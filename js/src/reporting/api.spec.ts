import { describe, expect, it, vi } from 'vitest';
import { ReportingClient } from './api';
import { composeReportingSnapshot } from './compose';
import type { ReportingCatalog, ReportingDocument } from './api';
import { isReportingAction } from './types';

const query = { dataset: 'orders', metric: 'value', groupBy: 'day', from: '2026-11-01', to: '2026-11-02' };
const document: ReportingDocument = {
  title: 'Orders', kind: 'dashboard',
  tiles: [
    { title: 'Ignored', view: 'grid', query },
    { title: 'Trend', view: 'line', query },
    { title: 'Data', view: 'table', query: { ...query } },
    { title: 'Unavailable', view: 'bar', query: { ...query, dataset: 'other' } },
  ],
};

describe('reporting integration', () => {
  it('narrows snapshot actions without confusing them with paged or malformed events', () => {
    expect(isReportingAction({ kind: 'activate', rowIndex: 0, row: { label: 'Order', value: 8 } })).toBe(true);
    expect(isReportingAction({ kind: 'select', rowIndices: [0, 2], group: { field: 'region', value: null } })).toBe(true);
    expect(isReportingAction({ kind: 'activate', rowKey: 'N-10', row: { label: 'Order', value: 8 } })).toBe(false);
    expect(isReportingAction({ kind: 'select', rowIndices: [0, '1'] })).toBe(false);
    expect(isReportingAction({ kind: 'filter', field: 'region' })).toBe(false);
  });

  it('uses the host transport, propagates cancellation, and surfaces API errors', async () => {
    const signal = new AbortController().signal;
    const fetch = vi.fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(Response.json([{ label: 'South', value: 42 }]))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(Response.json({ error: 'Dataset unavailable.' }, { status: 400 }));
    const client = new ReportingClient({ baseUrl: '/host/reports/', fetch });

    await expect(client.run(query, signal)).resolves.toEqual([{ label: 'South', value: 42 }]);
    expect(fetch).toHaveBeenNthCalledWith(1, '/host/reports/run', {
      method: 'POST', signal, headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(query),
    });
    await expect(client.remove('custom/1')).resolves.toBeUndefined();
    expect(fetch).toHaveBeenNthCalledWith(2, '/host/reports/saved/custom%2F1', expect.objectContaining({ method: 'DELETE' }));
    await expect(client.run(query)).rejects.toMatchObject({ status: 400, message: 'Dataset unavailable.' });
  });

  it('deduplicates queries, keeps action indices, and isolates unavailable data', async () => {
    const catalog: ReportingCatalog = {
      datasets: [{
        id: 'orders', label: 'Orders', metrics: [],
        dimensions: [{ id: 'day', label: 'Day', columns: [{ field: 'date', label: 'Date' }] }],
      }],
      presets: [],
    };
    const run = vi.fn().mockResolvedValueOnce([
      { label: '2026-11-01', value: 42, fields: { region: 'South' } },
      { label: '2026-11-02', value: 54 },
    ]).mockRejectedValueOnce(new Error('Unknown dataset'));
    const snapshot = await composeReportingSnapshot(document, catalog, run, {
      includeTile: tile => tile.view !== 'grid',
    });

    expect(run).toHaveBeenCalledTimes(2);
    expect(snapshot.kind).toBe('dashboard');
    expect(snapshot.children?.map(child => [child.kind, child.action])).toEqual([
      ['filter', ''], ['line', 'report-result-1'], ['table', 'report-result-2'], ['bar', 'report-result-3'],
    ]);
    expect(snapshot.children?.[2].settings?.columns).toEqual([{ field: 'date', label: 'Date' }]);
    expect(snapshot.children?.[3].error).toBe('The reporting query failed.');
    expect(snapshot.sources?.['source-0']?.[0]).toEqual({
      label: '2026-11-01', date: '2026-11-01', x: 1, region: 'South', value: 42,
    });
  });

  it('binds a provider-declared timestamp rather than guessing it from a category label', async () => {
    const timestamp = '2026-11-01T13:45:00Z';
    const catalog: ReportingCatalog = {
      datasets: [{
        id: 'orders', label: 'Orders', metrics: [],
        dimensions: [{ id: 'shift', label: 'Shift', dateField: 'startedAt' }],
      }],
      presets: [],
    };
    const snapshot = await composeReportingSnapshot({
      title: 'Shifts', kind: 'report',
      tiles: [{ title: 'Orders per shift', view: 'time-line', query: { ...query, groupBy: 'shift' } }],
    }, catalog, async () => [{ label: 'Shift 1', value: 42, fields: { startedAt: timestamp } }]);

    expect(snapshot.children?.[0].settings?.dateField).toBe('startedAt');
    expect(snapshot.sources?.['source-0']?.[0]).toMatchObject({ label: 'Shift 1', startedAt: timestamp });
  });
});
