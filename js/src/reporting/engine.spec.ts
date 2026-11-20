// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { ChatWidget, ReportingWidget } from '../models/ChatWidget';
import { SsrWidgetRenderer } from '../renderers/SsrWidgetRenderer';
import { WidgetEventManager } from '../handlers/WidgetEventManager';
import { mountReporting } from './engine';
import type { ReportingKind, ReportingRow } from './types';

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
  it('round-trips definitions and renders all chart kinds as bounded, encoded SVG', () => {
    const rows = [
      { label: '<img src=x>', value: 14, x: 0, date: '2026-11-01' },
      { label: 'Nov 2', value: -4, x: -2, date: '2026-11-02' },
    ];
    const dashboard = new ReportingWidget('Overview', '', 'dashboard', {
      settings: { dataSource: 'daily' },
      sources: { daily: rows },
      children: [tile('bar'), tile('line'), tile('pie'), tile('timeline'), tile('scatter')],
    });
    const restored = ChatWidget.fromJson(dashboard.toJson());
    expect(restored).toBeInstanceOf(ReportingWidget);
    expect(restored?.toObject()).toEqual(JSON.parse(dashboard.toJson()));
    const root = document.createElement('div');
    root.innerHTML = new SsrWidgetRenderer().renderWidget(restored!);
    expect(root.querySelectorAll('svg')).toHaveLength(5);
    expect(root.querySelector('img')).toBeNull();
    expect(root.textContent).toContain('<img src=x>');
    expect(root.querySelectorAll('.bbq-report-pie [data-report-command=point]')).toHaveLength(1);
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
