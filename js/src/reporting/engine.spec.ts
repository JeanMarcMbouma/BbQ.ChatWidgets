// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { ChatWidget, ReportingWidget } from '../models/ChatWidget';
import { SsrWidgetRenderer } from '../renderers/SsrWidgetRenderer';
import { WidgetEventManager } from '../handlers/WidgetEventManager';
import { mountReporting } from './engine';
import { reportingTimeSeriesKinds, type ReportingKind, type ReportingRow } from './types';

const tile = (kind: ReportingKind, label: string = kind) => new ReportingWidget(label, 'report', kind);

function element<T extends Element>(root: Element, selector: string): T {
  const node = root.querySelector<T>(selector);
  if (!node) throw new Error('Missing element ' + selector);
  return node;
}

function change(input: HTMLInputElement | HTMLSelectElement, value: string, event = 'change') {
  input.value = value;
  input.dispatchEvent(new Event(event, { bubbles: true }));
}

describe('reporting widgets', () => {
  it('keeps report data and edited grid text literal across SSR and browser rerenders', () => {
    const marker = `"'><b data-report-marker>literal & text</b>`;
    const field = 'description' + marker;
    const widget = new ReportingWidget(marker, '', 'grid', {
      rows: [{ [field]: marker }],
      settings: { columns: [{ field, label: marker, editable: true }] },
    });
    const root = document.createElement('div');
    root.innerHTML = new SsrWidgetRenderer().renderWidget(widget);
    expect(root.querySelector('[data-report-marker]')).toBeNull();
    expect(root.querySelector('h3')?.textContent).toBe(marker);
    const host = element(root, '.bbq-reporting');
    expect(JSON.parse(host.getAttribute('data-bbq-reporting')!)).toEqual(widget.toObject());

    const release = mountReporting(host, widget);
    const editor = () => element<HTMLInputElement>(host, 'input[data-report-command=edit]');
    try {
      expect(editor().getAttribute('data-field')).toBe(field);
      expect(editor().value).toBe(marker);
      change(editor(), marker + ' updated');
      change(element<HTMLInputElement>(host, 'input[type=search]'), marker, 'input');
      expect(editor().value).toBe(marker + ' updated');
      expect(element<HTMLInputElement>(host, 'input[type=search]').value).toBe(marker);
      expect(host.querySelector('[data-report-marker]')).toBeNull();
    } finally {
      release();
    }
  });

  it('round-trips definitions and renders all chart kinds as bounded, encoded SVG', () => {
    const rows = [
      { label: '<img src=x>', value: 14, x: 0, date: '2026-11-01' },
      { label: 'Nov 2', value: -4, x: -2, date: '2026-11-02' },
    ];
    const dashboard = new ReportingWidget('Overview', '', 'dashboard', {
      settings: { dataSource: 'daily' },
      sources: { daily: rows },
      children: [tile('bar'), tile('line'), tile('pie'), tile('timeline'), tile('scatter'),
        tile('waterfall'), tile('pareto'), tile('histogram'), ...reportingTimeSeriesKinds.map(kind => tile(kind))],
    });
    const restored = ChatWidget.fromJson(dashboard.toJson());
    expect(restored).toBeInstanceOf(ReportingWidget);
    expect(restored?.toObject()).toEqual(JSON.parse(dashboard.toJson()));
    const root = document.createElement('div');
    root.innerHTML = new SsrWidgetRenderer().renderWidget(restored!);
    expect(root.querySelectorAll('svg')).toHaveLength(12);
    expect(root.querySelector('img')).toBeNull();
    expect(root.textContent).toContain('<img src=x>');
    expect(root.querySelectorAll('.bbq-report-pie [data-report-command=point]')).toHaveLength(1);
    expect(root.querySelectorAll('.bbq-report-waterfall [data-report-command=point]')).toHaveLength(2);
    expect(root.querySelector('.bbq-report-pareto polyline')).not.toBeNull();
    expect(root.querySelectorAll('.bbq-report-pareto [data-report-command=point]')).toHaveLength(1);
    expect(root.querySelectorAll('.bbq-report-histogram rect')).toHaveLength(2);
    expect(root.querySelector('.bbq-report-histogram')?.textContent).toContain('1 observation');
  });

  it.each(reportingTimeSeriesKinds)('plots %s chronologically and selects the source observation', kind => {
    const rows: ReportingRow[] = [
      { label: 'Late', time: '2026-11-09', value: 12 },
      { label: 'Invalid date', time: '2026-02-30', value: 20 },
      { label: 'Early', time: '2026-11-01', value: -8 },
      { label: 'Close', time: '2026-11-03T01:00:00+01:00', value: 3 },
      { label: 'Invalid value', time: '2026-11-02', value: '6' },
    ];
    const root = document.createElement('div');
    const handle = vi.fn();
    const release = mountReporting(root, new ReportingWidget('Orders', 'inspect', kind, {
      settings: { dataSource: 'orders', dateField: 'time' }, sources: { orders: rows },
    }), handle);
    try {
      const points = [...root.querySelectorAll('[data-row]')];
      expect(points.map(point => point.getAttribute('data-row'))).toEqual(['2', '3', '0']);
      const [early, close, late] = points.map(point =>
        point.tagName.toLowerCase() === 'rect'
          ? Number(point.getAttribute('x')) + Number(point.getAttribute('width')) / 2
          : Number(point.getAttribute('cx')));
      expect((close - early) / (late - early)).toBeCloseTo(.25);
      expect(root.textContent).toContain('2026-11-09');
      expect(root.textContent).toContain('UTC');
      expect(root.querySelectorAll('details li')).toHaveLength(3);
      points[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(handle).toHaveBeenCalledWith('inspect', {
        kind: 'select', source: 'orders', rowIndices: [2], row: rows[2],
      });
      if (kind === 'step') expect(root.querySelector('path')?.getAttribute('d')).toContain(' H ');
      if (kind === 'area') expect(root.querySelector('path')?.getAttribute('d')).toMatch(/ Z$/);
    } finally {
      release();
    }
  });

  it('bounds dense and extreme time-series marks and rejects unusable observations', () => {
    const rows = Array.from({ length: 62 }, (_, index) => ({
      date: '2026-11-01', label: String(index), value: index % 2 ? -Number.MAX_VALUE : Number.MAX_VALUE,
    }));
    const root = document.createElement('div');
    const renderer = new SsrWidgetRenderer();
    root.innerHTML = renderer.renderWidget(new ReportingWidget('Magnitude', '', 'time-column', { rows }));
    const columns = [...root.querySelectorAll('rect')];
    expect(columns).toHaveLength(60);
    expect(new Set(columns.map(column => column.getAttribute('x'))).size).toBe(60);
    expect(columns.every(column => ['x', 'y', 'width', 'height'].every(attribute => Number.isFinite(Number(column.getAttribute(attribute))))))
      .toBe(true);
    expect(root.textContent).toContain('Showing 60 of 62 points.');

    root.innerHTML = renderer.renderWidget(new ReportingWidget('Invalid', '', 'time-line', {
      rows: [{ date: 'yesterday', value: 8 }, { date: '2026-11-01', value: '8' }],
    }));
    expect(root.querySelector('svg')).toBeNull();
    expect(root.textContent).toContain('Provide an ISO date and a numeric value');
  });

  it('keeps waterfall order, ranks Pareto rows, and balances histogram boundary counts', () => {
    const rows = [{ label: 'First', value: 2 }, { label: 'Second', value: 8 }, { label: 'Third', value: -4 }, { label: 'Fourth', value: 2 }];
    const root = document.createElement('div');
    root.innerHTML = new SsrWidgetRenderer().renderWidget(new ReportingWidget('Analysis', '', 'dashboard', {
      rows, children: [
        new ReportingWidget('Waterfall', '', 'waterfall', { rows }),
        new ReportingWidget('Pareto', '', 'pareto', { rows }),
        new ReportingWidget('Histogram', '', 'histogram', { rows }),
      ],
    }));
    const order = (kind: string) => [...root.querySelectorAll(`.bbq-report-${kind} [data-row]`)].map(point => point.getAttribute('data-row'));
    expect(order('waterfall')).toEqual(['0', '1', '2', '3']);
    expect(order('pareto')).toEqual(['1', '0', '3']);
    const bins = [...root.querySelectorAll('.bbq-report-histogram li')].map(bin => bin.textContent);
    expect(bins).toEqual(['-4–2: 1 observation', '2–8: 3 observations']);
  });

  it('shares filtered data through nested dashboards and keeps other sources independent', () => {
    const filter = new ReportingWidget('Status', 'filter', 'filter', { filterField: 'label' });
    const scope = new ReportingWidget('Nested', '', 'dashboard', { children: [tile('table', 'Orders')] });
    const other = new ReportingWidget('Independent', '', 'table', { settings: { dataSource: 'other' } });
    const widget = new ReportingWidget('Dashboard', '', 'dashboard', {
      settings: { dataSource: 'orders', columns: [{ field: 'label', label: 'Order status' }] },
      sources: {
        orders: [{ label: 'Open', value: 2 }, { label: 'Closed', value: 9 }],
        other: [{ label: 'Other source', value: 6 }],
      },
      children: [filter, scope, other],
    });
    const root = document.createElement('div');
    root.innerHTML = new SsrWidgetRenderer().renderWidget(widget);
    const handle = vi.fn();
    const manager = new WidgetEventManager({ handle });
    manager.attachHandlers(root);
    change(element<HTMLSelectElement>(root, 'select'), '0');
    expect(root.querySelectorAll('.bbq-report-table tbody tr')).toHaveLength(2);
    expect(root.querySelector('.bbq-report-table tbody')?.textContent).toContain('Open');
    expect(root.querySelector('.bbq-report-table tbody')?.textContent).not.toContain('Closed');
    expect(root.textContent).toContain('Other source');
    expect(handle).toHaveBeenCalledWith('filter', { kind: 'filter', source: 'orders', field: 'label', value: 'Open', active: true });
    manager.detachHandlers(root);
    change(element<HTMLSelectElement>(root, 'select'), '1');
    expect(handle).toHaveBeenCalledTimes(1);
  });

  it('dispatches keyboard chart selection with source identity', () => {
    const root = document.createElement('div');
    const row = { label: 'Open', value: 2 };
    const handle = vi.fn();
    const release = mountReporting(root, new ReportingWidget('Orders', 'open_order', 'bar', {
      settings: { dataSource: 'orders' }, sources: { orders: [row] },
    }), handle);
    const point = element(root, '[data-report-command=point]');
    point.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(point.getAttribute('aria-pressed')).toBe('true');
    expect(handle).toHaveBeenCalledWith('open_order', { kind: 'select', source: 'orders', rowIndices: [0], row });
    release();
  });

  it('dispatches the contributing rows for a grouped bar', () => {
    const root = document.createElement('div');
    const handle = vi.fn();
    const release = mountReporting(root, new ReportingWidget('Orders', 'open_group', 'bar', {
      settings: { dataSource: 'orders', groupBy: 'status' },
      sources: { orders: [
        { status: 'Open', value: 3 },
        { status: 'Closed', value: 2 },
        { status: 'Open', value: 5 },
        { status: 'Open', value: 'pending' },
      ] },
    }), handle);
    const point = element(root, '[data-report-command="point"][data-row="0"]');
    point.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(point.getAttribute('aria-pressed')).toBe('true');
    expect(handle).toHaveBeenCalledExactlyOnceWith('open_group', {
      kind: 'select', source: 'orders', rowIndices: [0, 2], group: { field: 'status', value: 'Open' },
    });
    release();
  });

  it('activates table rows through a cell click or the details button', () => {
    const root = document.createElement('div');
    const row = { label: 'Order 300', value: 17 };
    const handle = vi.fn();
    const widget = new ReportingWidget('Orders', 'view_order', 'table', { rows: [row] });
    const release = mountReporting(root, widget, handle);
    element<HTMLTableCellElement>(root, 'tbody td').click();
    element<HTMLButtonElement>(root, 'button[data-report-command="activate"]').click();
    expect(handle.mock.calls).toEqual(Array(2).fill([
      'view_order', { kind: 'activate', source: undefined, rowIndex: 0, row },
    ]));

    const releaseWithoutAction = mountReporting(root, new ReportingWidget('Orders', '', 'table', { rows: [row] }), handle);
    expect(root.querySelector('[data-report-command="activate"]')).toBeNull();
    element<HTMLTableCellElement>(root, 'tbody td').click();
    expect(handle).toHaveBeenCalledTimes(2);
    release();
    releaseWithoutAction();
  });

  it('keeps grid activation separate from selection and editing after sorting', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handle = vi.fn();
    const rows = [{ label: 'Open', value: 17 }, { label: 'Closed', value: 2 }];
    const release = mountReporting(root, new ReportingWidget('Orders', 'view_order', 'grid', {
      settings: { dataSource: 'orders', columns: [{ field: 'label', label: 'Label' }, { field: 'value', label: 'Value', editable: true }] },
      sources: { orders: rows },
    }), handle);
    element<HTMLButtonElement>(root, '[data-report-command="sort"][data-field="value"]').click();
    element<HTMLInputElement>(root, 'tbody input[type="checkbox"]').click();
    const editor = element<HTMLInputElement>(root, 'tbody input[type="number"]');
    editor.click();
    change(editor, '3');
    element<HTMLTableCellElement>(root, 'tbody td:nth-child(2)').click();
    expect(handle.mock.calls).toEqual([
      ['view_order', { kind: 'select', source: 'orders', rowIndices: [1], row: rows[1] }],
      ['view_order', { kind: 'edit', source: 'orders', rowIndex: 1, field: 'value', value: 3 }],
      ['view_order', { kind: 'activate', source: 'orders', rowIndex: 1, row: { label: 'Closed', value: 3 } }],
    ]);
    release();
    root.remove();
  });

  it('exports all matching visible columns and protects spreadsheet cells', async () => {
    const root = document.createElement('div');
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:fixture');
    const revokeObjectURL = vi.fn();
    const link = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL, revokeObjectURL }));
    const release = mountReporting(root, new ReportingWidget('Orders', '', 'grid', { rows: [
      { label: '=1+1', value: -4 },
      { label: 'Skip this row', value: 17 },
    ] }));
    try {
      change(element<HTMLInputElement>(root, 'input[type=search]'), '1+1', 'input');
      element<HTMLButtonElement>(root, '[data-report-command=export]').click();
      expect(link).toHaveBeenCalledTimes(1);
      const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
      const contents = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsText(blob);
      });
      expect(contents).toBe(`"label","value"\r\n"'=1+1","-4"`);
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:fixture');
    } finally {
      release();
      link.mockRestore();
      vi.unstubAllGlobals();
    }
  });

  it('combines grid pagination, sorting, search, selection, column visibility, grouping and edits', () => {
    const rows: ReportingRow[] = Array.from({ length: 14 }, (_, i) => ({ label: 'Item ' + i, value: i, status: i % 2 ? 'Open' : 'Closed' }));
    const root = document.createElement('div');
    const emit = vi.fn();
    document.body.append(root);
    const unmount = mountReporting(root, new ReportingWidget('Orders', 'grid', 'grid', {
      rows,
      settings: { columns: [
        { field: 'label', label: 'Item' }, { field: 'value', label: 'Value', editable: true }, { field: 'status', label: 'Status' },
      ] },
    }), emit);
    const command = <T extends Element>(name: string, extra = '') => element<T>(root, `[data-report-command="${name}"]${extra}`);
    expect(root.querySelectorAll('tbody tr')).toHaveLength(10);
    command<HTMLButtonElement>('next').click();
    expect(root.querySelectorAll('tbody tr')).toHaveLength(4);
    command<HTMLInputElement>('select-page').click();
    expect(emit).toHaveBeenLastCalledWith('grid', expect.objectContaining({ rowIndices: [10, 11, 12, 13] }));
    for (let i = 0; i < 2; i += 1) command<HTMLButtonElement>('sort', '[data-field="value"]').click();
    expect(root.querySelector('tbody tr')?.textContent).toContain('Item 13');
    const editor = command<HTMLInputElement>('edit', '[data-row="13"]');
    change(editor, '18');
    expect(emit).toHaveBeenLastCalledWith('grid', expect.objectContaining({ kind: 'edit', rowIndex: 13, field: 'value', value: 18 }));
    change(command<HTMLSelectElement>('group'), 'status');
    expect(root.querySelector('th[scope="rowgroup"]')).not.toBeNull();
    command<HTMLInputElement>('column', '[data-field="status"]').click();
    expect(root.querySelector('thead')?.textContent).not.toContain('Status');
    change(command<HTMLInputElement>('search'), 'Item 13', 'input');
    expect(root.querySelectorAll('tbody input[data-report-command=select]')).toHaveLength(1);
    expect(command<HTMLInputElement>('edit').value).toBe('18');
    unmount();
    root.remove();
  });
});
