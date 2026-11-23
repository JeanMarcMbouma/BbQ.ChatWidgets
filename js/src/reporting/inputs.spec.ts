import { describe, expect, it, vi } from 'vitest';
import type { ReportingCatalog, ReportingDocument } from './api';
import { composeReportingSnapshot } from './compose';
import { applyReportingAction, applyReportingState, reportingDatePreset, setReportingInput } from './inputs';

const status = {
  id: 'region', label: 'Region', role: 'Filter', type: 'Integer', options: [{ value: 4, label: 'West' }],
} as const;
const mode = {
  id: 'scale', label: 'Scale', role: 'Parameter', type: 'Text', defaultValue: 'unit',
} as const;
const catalog: ReportingCatalog = {
  datasets: [{ id: 'orders', label: 'Orders', dimensions: [], metrics: [], inputs: [
    { ...status, options: [...status.options] }, mode,
  ] }], presets: [],
};
const query = { dataset: 'orders', metric: 'count', groupBy: null, from: '2026-10-30', to: '2026-11-01' };
const tile = { title: 'Orders', view: 'bar', query } as const;
const document: ReportingDocument = { title: 'Overview', kind: 'dashboard', tiles: [tile] };

describe('reporting inputs', () => {
  it('deduplicates equivalent selections and defaults but executes different values separately', async () => {
    const run = vi.fn(async () => [{ label: 'Orders', value: 2 }]);
    const tiles = [
      tile,
      { ...tile, query: { ...query, inputs: [{ id: 'scale', value: 'unit' }] } },
      { ...tile, query: { ...query, inputs: [{ id: 'scale', value: 'unit' }, { id: 'region', value: 4 }] } },
      { ...tile, query: { ...query, inputs: [{ id: 'region', value: 4 }, { id: 'scale', value: 'unit' }] } },
    ];
    await composeReportingSnapshot({ ...document, tiles }, catalog, run);
    expect(run).toHaveBeenCalledTimes(2);
    expect(run.mock.calls[0]).toEqual([tiles[1].query]);
    expect(run.mock.calls[1]).toEqual([tiles[3].query]);
  });

  it('applies typed chart and grid selections and ignores unsupported datasets and values', () => {
    const dataset = catalog.datasets[0];
    const binding = { input: 'region', field: 'regionId' };
    const action = { actionName: 'choose-region', tile, tileIndex: 0 };
    const selected = applyReportingAction({}, { ...action,
      payload: { kind: 'select', rowIndices: [0], row: { regionId: 4 } },
    }, binding, dataset);
    expect(selected.inputs).toEqual([{ id: 'region', value: 4 }]);
    const pageSelection = applyReportingAction({}, { ...action,
      payload: { kind: 'activate', rowKey: 'm-1', row: { label: 'March', value: 2, fields: { regionId: 4 } } },
    }, binding, dataset);
    expect(pageSelection).toEqual(selected);
    expect(applyReportingAction(selected, { ...action,
      payload: { kind: 'select', rowIndices: [0], row: { regionId: '4' } },
    }, binding, dataset)).toBe(selected);
    const dates = { from: '2026-10-31', to: '2026-11-01' };
    const applied = applyReportingState({ ...document, tiles: [tile, {
      ...tile, query: { ...query, dataset: 'independent' },
    }] }, catalog, { ...selected, dates });
    expect(applied.tiles[0].query).toEqual({ ...query, ...dates, inputs: selected.inputs });
    expect(applied.tiles[1].query.inputs).toBeUndefined();
    expect(tile.query).toEqual(query);
    expect(setReportingInput(selected, dataset.inputs![0], undefined).inputs).toBeUndefined();
  });

  it('computes relative dates as calendar days and enforces the source cap', () => {
    expect(reportingDatePreset({ today: '2026-11-02', maxDays: 8 }, 4)).toEqual({
      from: '2026-10-30', to: '2026-11-02',
    });
    expect(reportingDatePreset({ today: '2026-11-02', maxDays: 8 }, 9)).toBeUndefined();
    expect(reportingDatePreset({ today: '2026-02-30', maxDays: 8 }, 4)).toBeUndefined();
  });
});
