import { expect, it, vi } from 'vitest';
import type { ReportingCatalog, ReportingDocument } from './api';
import { composeReportingSnapshot } from './compose';
import { mountReporting } from './engine';
import { resolveReportingLayout } from './layout';

const query = {
  dataset: 'orders',
  metric: 'total',
  groupBy: null,
  from: '2026-11-01',
  to: '2026-11-14',
};
const catalog: ReportingCatalog = {
  datasets: [
    { id: 'orders', label: 'Orders', metrics: [{ id: 'total', label: 'Total' }], dimensions: [] },
  ],
  presets: [],
};
const definition: ReportingDocument = {
  title: 'Order report',
  kind: 'dashboard',
  tiles: [
    { id: 'headline', title: 'Headline', view: 'metric', query },
    { id: 'details', title: 'Details', view: 'table', query },
    { id: 'rank', title: 'Rank', view: 'column', query: { ...query, groupBy: 'warehouse' } },
  ],
  layout: {
    defaultModeId: 'summary',
    modes: [
      {
        id: 'summary',
        label: 'Summary',
        placements: [{ id: 'results', tileIds: ['details', 'headline'], columnSpan: 8 }],
      },
      {
        id: 'regions',
        label: 'Regions',
        placements: [
          {
            id: 'charts',
            defaultVariantId: 'ranked',
            variants: [
              { id: 'ranked', label: 'Ranked', tileIds: ['rank'] },
              { id: 'total', label: 'Total', tileIds: ['headline'] },
            ],
          },
        ],
      },
    ],
  },
};

it('resolves placements by ID, chooses defaults and runs only the active distinct queries', async () => {
  const reordered = { ...definition, tiles: [...definition.tiles].reverse() };
  const active = resolveReportingLayout(reordered, { modeId: 'missing' });
  expect(active?.mode.id).toBe('summary');
  expect(active?.placements[0].tileIndices).toEqual([1, 2]);
  expect(
    resolveReportingLayout(reordered, { modeId: 'regions', variants: { charts: 'unknown' } })
      ?.placements[0].variantId
  ).toBe('ranked');
  const run = vi.fn(async () => [{ label: 'North', value: 3 }]);
  const widget = await composeReportingSnapshot(reordered, catalog, run);
  expect(run).toHaveBeenCalledExactlyOnceWith(query);
  expect(widget.children?.map((child) => child.label)).toEqual(['Details', 'Headline']);
  expect(widget.settings?.layout).toEqual([{ columnSpan: 8, children: [0, 1] }]);

  run.mockClear();
  const layoutState = { modeId: 'regions', variants: { charts: 'total' } };
  const variant = await composeReportingSnapshot(definition, catalog, run, { layoutState });
  expect(run).toHaveBeenCalledExactlyOnceWith(query);
  expect(variant.children?.map((child) => child.label)).toEqual(['Headline']);
});

it('renders grouped columns with a Y guide and keeps colors attached to authored keys', () => {
  const host = document.createElement('div');
  const action = vi.fn();
  const mount = mountReporting(
    host,
    {
      type: 'reporting',
      label: 'Comparison',
      action: 'filter',
      kind: 'column',
      rows: [{ label: 'North', value: 12, target: 14 }],
      settings: {
        presentation: {
          series: [
            { field: 'value', label: 'Actual' },
            { field: 'target', label: 'Target' },
          ],
          colors: [
            { key: 'value', color: '#123abc' },
            { key: 'target', color: '#765def', darkColor: '#abcdef' },
          ],
          referenceLines: [{ axis: 'Y', label: 'Target', field: 'target' }],
        },
      },
    },
    action
  );
  const marks = host.querySelectorAll('svg rect[data-report-command=point]');
  expect([...marks].map((mark) => mark.getAttribute('fill'))).toEqual([
    '#123abc',
    'light-dark(#765def,#abcdef)',
  ]);
  expect(host.querySelector('ul[aria-label=Series] rect')?.getAttribute('fill')).toBe('#123abc');
  const guide = host.querySelector('[data-report-reference]');
  expect(guide?.getAttribute('y1')).toBe(guide?.getAttribute('y2'));
  marks[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  expect(action).toHaveBeenCalledWith(
    'filter',
    expect.objectContaining({ row: { label: 'North', value: 12, target: 14 } })
  );
  mount();
});

it('keeps an authored pie color when an earlier category is absent', () => {
  const host = document.createElement('div');
  const cleanup = mountReporting(host, {
    type: 'reporting',
    label: 'Order share',
    action: 'filter',
    kind: 'pie',
    rows: [{ label: 'Open', value: 9 }],
    settings: {
      presentation: {
        pieHole: 0.55,
        colors: [
          { key: 'Delivered', color: '#158000' },
          { key: 'Open', color: '#984000' },
        ],
      },
    },
  });
  expect(host.querySelector('path[data-report-command=point]')?.getAttribute('fill')).toBe(
    '#984000'
  );
  expect(host.querySelector('ul[aria-label=Series] rect')?.getAttribute('fill')).toBe('#984000');
  cleanup();
});
