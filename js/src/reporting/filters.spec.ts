import { describe, expect, it, vi } from 'vitest';
import type { ReportingCatalog, ReportingDocument } from './api';
import { reportingWorkspaceInputs, resolveReportingControls, withReportingFilters } from './filters';
import { applyReportingState } from './inputs';
import { composeReportingSnapshot } from './compose';

const catalog: ReportingCatalog = {
  presets: [], datasets: [{
    id: 'orders', label: 'Orders', metrics: [], dimensions: [], inputs: [
      { id: 'region', label: 'Region', role: 'Filter', type: 'Text' },
      { id: 'channel', label: 'Channel', role: 'Filter', type: 'Text', options: [{ label: 'Retail', value: 'retail' }] },
      { id: 'scale', label: 'Scale', role: 'Parameter', type: 'Integer', options: [{ label: 'Units', value: 1 }] },
    ],
  }],
};
const query = { dataset: 'orders', metric: 'count', groupBy: null, from: '2026-11-01', to: '2026-11-10',
  inputs: [{ id: 'region', value: 'north' }, { id: 'scale', value: 1 }] };
const report: ReportingDocument = { title: 'Orders', kind: 'report', tiles: [{ title: 'Count', view: 'metric', query }] };

describe('portable report filters', () => {
  it('uses saved order and labels and resolves only the displayed choices', async () => {
    expect(reportingWorkspaceInputs(report, catalog).map(input => input.label)).toEqual(['Region', 'Channel', 'Scale']);
    const definition = withReportingFilters(report, catalog, [{ input: 'channel', label: 'Sales channel' }, { input: 'region' }]);
    const readback: ReportingDocument = JSON.parse(JSON.stringify(definition));
    const getOptions = vi.fn(async () => [{ label: 'North', value: 'north' }]);
    const controls = await resolveReportingControls(readback, catalog, getOptions);
    expect(controls.map(input => input.label)).toEqual(['Sales channel', 'Region', 'Scale']);
    expect(controls[1].options).toEqual([{ label: 'North', value: 'north' }]);
    expect(getOptions).toHaveBeenCalledExactlyOnceWith(query, 'region');
  });

  it('preserves explicit filter tiles while leaving implicit preview filters to legacy definitions', async () => {
    const tile = report.tiles[0];
    const dashboard: ReportingDocument = {
      ...report, kind: 'dashboard', tiles: [tile, { ...tile, title: 'Another count' }],
    };
    const rows = async () => [{ label: 'North', value: 2 }, { label: 'South', value: 3 }];
    const inherited = await composeReportingSnapshot(dashboard, catalog, rows);
    const configured = await composeReportingSnapshot({ ...dashboard, filters: [] }, catalog, rows);
    const explicit = await composeReportingSnapshot({
      ...dashboard, filters: [], tiles: [...dashboard.tiles, { ...tile, view: 'filter' }],
    }, catalog, rows);
    expect(inherited.children?.filter(child => child.kind === 'filter')).toHaveLength(1);
    expect(configured.children?.filter(child => child.kind === 'filter')).toHaveLength(0);
    expect(explicit.children?.filter(child => child.kind === 'filter')).toHaveLength(1);
  });

  it('clears removed saved filter values and prevents stale overrides without removing parameters', () => {
    const definition = withReportingFilters(report, catalog, []);
    const effective = applyReportingState(definition, catalog, { inputs: [{ id: 'region', value: 'south' }] });
    expect(definition.filters).toEqual([]);
    expect(effective.tiles[0].query.inputs).toEqual([{ id: 'scale', value: 1 }]);
    expect(report.tiles[0].query.inputs).toHaveLength(2);
    expect(reportingWorkspaceInputs(definition, catalog).map(input => input.id)).toEqual(['scale']);
  });
});
