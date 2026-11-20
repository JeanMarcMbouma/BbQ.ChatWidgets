import { reportingKinds, type ReportingAction, type ReportingCell, type ReportingColumn,
  type ReportingDefinition, type ReportingNode, type ReportingRow, type ReportingSettings } from './types';

type Row = { index: number; values: ReportingRow };
type Filter = { source?: string; field: string; value: ReportingCell };
type Context = { settings: ReportingSettings; sources: NonNullable<ReportingDefinition['sources']>; filters: Filter[] };
type ViewState = {
  filter?: ReportingCell;
  search: string;
  sort?: string;
  descending: boolean;
  page: number;
  size: number;
  hidden: Set<string>;
  selected: Set<number>;
  edits: Map<number, ReportingRow>;
  group?: string;
};
type Binding = { widget: ReportingNode; context: Context; rows: Row[]; columns: ReportingColumn[]; state: ViewState };
type Session = { state: Map<string, ViewState>; bindings: Map<string, Binding> };
type Emit = (action: string, payload: ReportingAction) => void;

const initialContext: Context = { settings: {}, sources: {}, filters: [] };
const palette = ['#2366ba', '#147c68', '#a45c16', '#883fa1', '#ae3c59', '#467336', '#5968a5', '#9b5f55'];
const chartLimit = 60;
const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
const own = <T>(record: Readonly<Record<string, T>>, key: string | undefined): T | undefined =>
  key && Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined;
const cell = (row: Row, field: string): ReportingCell => own(row.values, field) ?? null;
const text = (value: ReportingCell) => String(value ?? '');
const number = (value: ReportingCell) => typeof value === 'number' && Number.isFinite(value) ? value : undefined;
const formatter = new Intl.NumberFormat('en', { maximumFractionDigits: 4 });
const format = (value: number) => formatter.format(value);
const control = (path: string, id: string) => `data-report-focus="${escape(path + ':' + id)}"`;
const settingsFor = (widget: ReportingNode, parent: Context): Context => ({
  settings: { ...parent.settings, ...Object.fromEntries(Object.entries(widget.settings ?? {}).filter(([, value]) => value != null)) },
  sources: { ...parent.sources, ...widget.sources },
  filters: parent.filters,
});

function stateFor(session: Session, path: string, size = 10): ViewState {
  let state = session.state.get(path);
  if (!state) {
    state = { search: '', descending: false, page: 0, size: [10, 25, 50, 100].includes(size) ? size : 10,
      hidden: new Set(), selected: new Set(), edits: new Map() };
    session.state.set(path, state);
  }
  return state;
}

function getRows(widget: ReportingNode, context: Context, state: ViewState): Row[] {
  const source = widget.rows ?? own(context.sources, context.settings.dataSource);
  if (!Array.isArray(source)) return [];
  return source.flatMap((values, index) => {
    if (!values || typeof values !== 'object' || Array.isArray(values)) return [];
    const row = { index, values: state.edits.get(index) ?? values };
    return context.filters.every(filter =>
      filter.source !== context.settings.dataSource || cell(row, filter.field) === filter.value) ? [row] : [];
  });
}

function getColumns(context: Context, rows: Row[]): ReportingColumn[] {
  if (Array.isArray(context.settings.columns)) {
    return context.settings.columns.filter(column => column && typeof column.field === 'string');
  }
  const fields = [...new Set(rows.flatMap(row => Object.keys(row.values)))];
  return fields.map(field => ({ field, label: field }));
}

function section(widget: ReportingNode, path: string, body: string): string {
  return `<section class="bbq-report bbq-report-${widget.kind}" data-report-path="${path}" style="min-width:0">
    <h3>${escape(widget.label)}</h3>${body}</section>`;
}

function renderNode(widget: ReportingNode, parent: Context, session: Session, path: string, depth: number): string {
  if (!widget || !reportingKinds.includes(widget.kind) || depth > 12) return '';
  const context = settingsFor(widget, parent);
  const state = stateFor(session, path, widget.pageSize);
  const rows = widget.kind === 'dashboard' ? [] : getRows(widget, context, state);
  const columns = widget.kind === 'grid' || widget.kind === 'table' ? getColumns(context, rows) : [];
  session.bindings.set(path, { widget, context, rows, columns, state });

  if (widget.error) return section(widget, path, `<p role="alert">${escape(widget.error)}</p>`);
  if (widget.kind === 'dashboard') {
    const children = Array.isArray(widget.children) ? widget.children : [];
    const filters: Filter[] = [];
    children.forEach((child, index) => {
      if (child?.kind !== 'filter' || !child.filterField) return;
      const childContext = settingsFor(child, context);
      const childState = stateFor(session, `${path}.${index}`);
      const field = child.filterField;
      const value = childState.filter;
      if (value === undefined) return;
      if (getRows(child, childContext, childState).some(row => cell(row, field) === value)) {
        filters.push({ source: childContext.settings.dataSource, field, value });
      } else {
        childState.filter = undefined;
      }
    });
    const content = children.map((child, index) => renderNode(child,
      child?.kind === 'filter' ? context : { ...context, filters: [...context.filters, ...filters] },
      session, `${path}.${index}`, depth + 1)).join('');
    return section(widget, path, `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr));gap:1rem">${content}</div>`);
  }

  if (widget.kind === 'filter') {
    if (!widget.filterField) return section(widget, path, '<p>Choose a filter field.</p>');
    const choices = [...new Set(rows.map(row => cell(row, widget.filterField!)))];
    const options = choices.map((value, index) =>
      `<option value="${index}"${value === state.filter ? ' selected' : ''}>${escape(text(value) || '(blank)')}</option>`).join('');
    return section(widget, path, `<label>Filter by ${escape(widget.filterField)}
      <select data-report-command="filter" ${control(path, 'filter')}><option value="">All</option>${options}</select></label>`);
  }

  if (widget.kind === 'table' || widget.kind === 'grid') return section(widget, path, renderTable(widget.kind, path, rows, columns, state, context.settings.groupBy));
  if (rows.length === 0) return section(widget, path, '<p>No results.</p>');
  if (widget.kind === 'metric') {
    const values = rows.flatMap(row => number(cell(row, context.settings.valueField ?? 'value')) ?? []);
    const total = values.reduce((sum, value) => sum + value, 0);
    return section(widget, path, `<p><strong>${Number.isFinite(total) && values.length ? format(total) : '—'}</strong></p>`);
  }
  return section(widget, path, renderChart(widget, rows, context.settings, state.selected));
}

function compare(a: ReportingCell, b: ReportingCell): number {
  return typeof a === 'number' && typeof b === 'number' ? a - b : text(a).localeCompare(text(b), undefined, { numeric: true });
}

function tableRows(rows: Row[], columns: ReportingColumn[], state: ViewState): Row[] {
  const search = state.search.trim().toLocaleLowerCase();
  const filtered = search ? rows.filter(row => columns.some(col => text(cell(row, col.field)).toLocaleLowerCase().includes(search))) : rows;
  if (!state.sort) return filtered;
  const field = state.sort;
  return [...filtered].sort((a, b) => compare(cell(a, field), cell(b, field)) * (state.descending ? -1 : 1));
}

function renderTable(kind: 'table' | 'grid', path: string, rows: Row[], columns: ReportingColumn[], state: ViewState, defaultGroup?: string): string {
  const grid = kind === 'grid';
  const visible = columns.filter(column => !state.hidden.has(column.field));
  const matching = grid ? tableRows(rows, visible, state) : rows;
  const field = state.group ?? defaultGroup ?? '';
  const ordered = field && grid ? [...matching].sort((a, b) => compare(cell(a, field), cell(b, field))) : matching;
  const lastPage = Math.max(0, Math.ceil(ordered.length / state.size) - 1);
  state.page = Math.min(state.page, lastPage);
  const page = grid ? ordered.slice(state.page * state.size, (state.page + 1) * state.size) : ordered;
  const columnOptions = columns.map(col => `<label style="display:block"><input type="checkbox" data-report-command="column"
    data-field="${escape(col.field)}" ${control(path, 'column:' + col.field)}${state.hidden.has(col.field) ? '' : ' checked'}> ${escape(col.label)}</label>`).join('');
  const groupOptions = columns.map(col => `<option value="${escape(col.field)}"${field === col.field ? ' selected' : ''}>${escape(col.label)}</option>`).join('');
  const tools = grid ? `<div style="display:flex;flex-wrap:wrap;gap:.55rem;align-items:baseline">
    <label>Search <input type="search" data-report-command="search" ${control(path, 'search')} value="${escape(state.search)}"></label>
    <label>Group by <select data-report-command="group" ${control(path, 'group')}><option value="">None</option>${groupOptions}</select></label>
    <details${state.hidden.size ? ' open' : ''}><summary>Columns</summary>${columnOptions}</details>
    <button type="button" data-report-command="export" ${control(path, 'export')}>Export CSV</button>
    <span role="status">${state.selected.size} selected</span></div>` : '';
  const heading = visible.map(col => {
    const sort = state.sort === col.field ? (state.descending ? 'descending' : 'ascending') : 'none';
    return grid
      ? `<th scope="col" aria-sort="${sort}"><button type="button" data-report-command="sort" data-field="${escape(col.field)}" ${control(path, 'sort:' + col.field)}>${escape(col.label)}</button></th>`
      : `<th scope="col">${escape(col.label)}</th>`;
  }).join('');
  const body = page.map((row, index) => {
    const group = field && grid && (index === 0 || cell(row, field) !== cell(page[index - 1], field))
      ? `<tr><th scope="rowgroup" colspan="${visible.length + 1}">${escape(text(cell(row, field)) || '(blank)')}</th></tr>` : '';
    const select = grid ? `<td><input type="checkbox" aria-label="Select row ${row.index + 1}" data-report-command="select"
      data-row="${row.index}" ${control(path, 'row:' + row.index)}${state.selected.has(row.index) ? ' checked' : ''}></td>` : '';
    const cells = visible.map(col => {
      const value = cell(row, col.field);
      const edit = grid && col.editable && typeof value !== 'boolean'
        ? `<input aria-label="${escape(col.label)} row ${row.index + 1}" type="${typeof value === 'number' ? 'number' : 'text'}" step="any"
          data-report-command="edit" data-row="${row.index}" data-field="${escape(col.field)}"
          ${control(path, 'edit:' + row.index + ':' + col.field)} value="${escape(text(value))}">` : escape(text(value));
      return `<td style="padding:.25rem .45rem">${edit}</td>`;
    }).join('');
    return `${group}<tr>${select}${cells}</tr>`;
  }).join('');
  const all = page.length > 0 && page.every(row => state.selected.has(row.index));
  const selectAll = grid ? `<th scope="col"><input type="checkbox" aria-label="Select page" data-report-command="select-page"
    ${control(path, 'select-page')}${all ? ' checked' : ''}${page.length ? '' : ' disabled'}></th>` : '';
  const pager = grid ? `<div style="display:flex;flex-wrap:wrap;gap:.55rem;align-items:baseline">
    <button type="button" data-report-command="previous" ${control(path, 'previous')}${state.page === 0 ? ' disabled' : ''}>Previous</button>
    <span>${ordered.length ? state.page * state.size + 1 : 0}–${Math.min((state.page + 1) * state.size, ordered.length)} of ${ordered.length}</span>
    <button type="button" data-report-command="next" ${control(path, 'next')}${state.page >= lastPage ? ' disabled' : ''}>Next</button>
    <label>Rows per page <select data-report-command="page-size" ${control(path, 'page-size')}>
    ${[10, 25, 50, 100].map(size => `<option${state.size === size ? ' selected' : ''}>${size}</option>`).join('')}</select></label></div>` : '';
  return `${tools}<div style="overflow:auto"><table style="width:100%;text-align:left"><thead><tr>${selectAll}${heading}</tr></thead>
    <tbody>${body}</tbody></table></div>${page.length ? '' : '<p>No results.</p>'}${pager}`;
}

type Point = { label: string; value: number; x: number; index: number | undefined };

function renderChart(widget: ReportingNode, rows: Row[], settings: ReportingSettings, selection: ReadonlySet<number>): string {
  const points: Point[] = [];
  const byGroup = new Map<string, Point>();
  rows.forEach((row, index) => {
    const value = number(cell(row, settings.valueField ?? 'value')) ?? (widget.kind === 'timeline' ? 0 : undefined);
    if (value === undefined || (widget.kind === 'pie' && value <= 0)) return;
    const label = text(cell(row, settings.groupBy ?? settings.categoryField ?? 'label')) || '(blank)';
    const date = cell(row, settings.dateField ?? 'date');
    const x = widget.kind === 'timeline' ? (typeof date === 'string' ? Date.parse(date) : NaN)
      : widget.kind === 'scatter' ? number(cell(row, settings.xField ?? 'x')) : index;
    if (x === undefined || !Number.isFinite(x)) return;
    if (settings.groupBy && ['bar', 'line', 'pie'].includes(widget.kind)) {
      const point = byGroup.get(label);
      if (point) point.value += value;
      else byGroup.set(label, { label, value, x: byGroup.size, index: undefined });
    } else {
      points.push({ label, value, x, index: row.index });
    }
  });
  points.push(...[...byGroup.values()].filter(point => Number.isFinite(point.value)));
  if (widget.kind === 'timeline') points.sort((a, b) => a.x - b.x);
  if (!points.length) return '<p>No plottable values.</p>';
  const visible = points.slice(0, chartLimit);
  const detail = (point: Point) => `${point.label}: ${format(point.value)}${widget.kind === 'scatter' ? ` (x ${format(point.x)})` : ''}${widget.kind === 'timeline' ? ` (${new Date(point.x).toISOString().slice(0, 10)})` : ''}`;
  const button = (point: Point) => point.index === undefined ? ''
    : ` role="button" tabindex="0" data-report-command="point" data-row="${point.index}" aria-pressed="${selection.has(point.index)}" aria-label="${escape(detail(point))}"`;
  const title = (point: Point) => `<title>${escape(detail(point))}</title>`;
  const summary = `<details><summary>Chart data</summary><ul>${visible.map(point => `<li>${escape(detail(point))}</li>`).join('')}</ul></details>`;
  const plot = (w: number, h: number, body: string) => `<svg aria-label="${escape(widget.label)}" viewBox="0 0 ${w} ${h}"
    style="display:block;width:100%;height:auto;color:inherit">${body}</svg>${summary}${visible.length < points.length ? `<p>Showing ${visible.length} of ${points.length} points.</p>` : ''}`;
  if (widget.kind === 'pie') {
    const peak = Math.max(...visible.map(point => point.value));
    const denominator = visible.reduce((sum, point) => sum + point.value / peak, 0);
    let angle = -Math.PI / 2;
    const coordinate = (angle: number) => `${100 + Math.cos(angle) * 78},${88 + Math.sin(angle) * 78}`;
    const slices = visible.map((point, index) => {
      const sweep = (point.value / peak) / denominator * 2 * Math.PI;
      const start = coordinate(angle);
      angle += sweep;
      const color = palette[index % palette.length];
      if (sweep >= 2 * Math.PI - 1e-10) {
        return `<circle cx="100" cy="88" r="78" fill="${color}"${button(point)}>${title(point)}</circle>`;
      }
      return `<path d="M100,88 L${start} A78,78 0 ${sweep > Math.PI ? 1 : 0},1 ${coordinate(angle)} Z"
        fill="${color}"${button(point)}>${title(point)}</path>`;
    }).join('');
    return `<div style="max-width:19rem;margin:auto">${plot(200, 176, slices)}</div>`;
  }
  const minimum = Math.min(0, ...visible.map(point => point.value));
  const maximum = Math.max(0, ...visible.map(point => point.value));
  const scale = Math.max(Math.abs(minimum), Math.abs(maximum)) || 1;
  const fraction = (value: number) => (value / scale - minimum / scale) / (maximum / scale - minimum / scale || 1);
  if (widget.kind === 'bar') {
    const height = visible.length * 25 + 10;
    const baseline = 152 + fraction(0) * 234;
    const bars = visible.map((point, index) => {
      const y = index * 25 + 8;
      const x = 152 + fraction(point.value) * 234;
      return `<g${button(point)}>${title(point)}<text x="4" y="${y + 12}" fill="currentColor" font-size="10">${escape(point.label.slice(0, 23))}</text>
        <rect x="${Math.min(x, baseline)}" y="${y}" width="${Math.max(Math.abs(x - baseline), 1)}" height="15" fill="${palette[0]}"/></g>`;
    }).join('');
    return plot(398, height, `<line x1="${baseline}" x2="${baseline}" y1="0" y2="${height}" stroke="currentColor" opacity=".4"/>${bars}`);
  }
  const minX = Math.min(...visible.map(point => point.x));
  const maxX = Math.max(...visible.map(point => point.x));
  const xScale = Math.max(Math.abs(minX), Math.abs(maxX)) || 1;
  const x = (point: Point) => 28 + 336 * (point.x / xScale - minX / xScale) / (maxX / xScale - minX / xScale || 1);
  const y = (point: Point) => widget.kind === 'timeline' ? 85 : 145 - 120 * fraction(point.value);
  const marks = visible.map(point => `<circle cx="${x(point)}" cy="${y(point)}" r="5" fill="${palette[0]}"${button(point)}>${title(point)}</circle>`).join('');
  const line = widget.kind === 'line' ? `<polyline points="${visible.map(point => `${x(point)},${y(point)}`).join(' ')}"
    fill="none" stroke="${palette[0]}" stroke-width="2"/>` : '';
  const baseline = widget.kind === 'timeline' ? 85 : 145 - 120 * fraction(0);
  return plot(390, 166, `<line x1="25" x2="367" y1="${baseline}" y2="${baseline}" stroke="currentColor" opacity=".4"/>
    ${line}${marks}<text x="28" y="159" fill="currentColor" font-size="10">${escape(widget.kind === 'scatter' ? format(minX) : (visible[0]?.label ?? '').slice(0, 20))}</text>
    <text x="364" y="159" text-anchor="end" fill="currentColor" font-size="10">${escape(widget.kind === 'scatter' ? format(maxX) : (visible[visible.length - 1]?.label ?? '').slice(0, 20))}</text>`);
}

export function renderReporting(definition: ReportingDefinition): string {
  return `<div class="bbq-reporting" data-bbq-reporting="${escape(JSON.stringify(definition))}">
    ${renderNode(definition, initialContext, { state: new Map(), bindings: new Map() }, '0', 0)}</div>`;
}

const mounted = new WeakMap<Element, () => void>();

export function mountReporting(container: Element, definition: ReportingDefinition, emit?: Emit): () => void {
  mounted.get(container)?.();
  const session: Session = { state: new Map(), bindings: new Map() };
  const render = (focus?: Element) => {
    const key = focus?.getAttribute('data-report-focus');
    const selection = focus && 'selectionStart' in focus ? (focus as HTMLInputElement).selectionStart : null;
    session.bindings.clear();
    container.innerHTML = renderNode(definition, initialContext, session, '0', 0);
    if (!key) return;
    const next = [...container.querySelectorAll<HTMLElement>('[data-report-focus]')]
      .find(element => element.getAttribute('data-report-focus') === key);
    next?.focus();
    if (selection !== null && next?.matches('input[type="search"]')) (next as HTMLInputElement).setSelectionRange(selection, selection);
  };
  const listener = (event: Event) => {
    const target = (event.target as Element | null)?.closest?.<HTMLElement>('[data-report-command]');
    const path = target?.closest('[data-report-path]')?.getAttribute('data-report-path');
    const binding = path ? session.bindings.get(path) : undefined;
    if (!target || !binding || !container.contains(target)) return;
    const command = target.dataset.reportCommand;
    const isButton = target.tagName === 'BUTTON';
    const keyboard = event.type === 'keydown' && command === 'point' &&
      ['Enter', ' '].includes((event as KeyboardEvent).key);
    const eventType = command === 'search' ? 'input' : isButton || command === 'point' ? 'click' : 'change';
    if (event.type !== eventType && !keyboard) return;
    if (keyboard) event.preventDefault();
    const input = target as HTMLInputElement;
    const { widget, context, state, rows, columns } = binding;
    const source = context.settings.dataSource;
    const field = target.dataset.field;
    const row = rows.find(entry => entry.index === Number(target.dataset.row));
    let payload: ReportingAction | undefined;

    switch (command) {
      case 'filter': {
        const field = widget.filterField;
        if (!field) return;
        const values = [...new Set(rows.map(entry => cell(entry, field)))];
        state.filter = input.value === '' ? undefined : values[Number(input.value)];
        payload = { kind: 'filter', source, field, value: state.filter ?? null, active: state.filter !== undefined };
        break;
      }
      case 'point': {
        if (!row) return;
        state.selected.clear();
        state.selected.add(row.index);
        target.closest('[data-report-path]')?.querySelector('[data-report-command="point"][aria-pressed="true"]')
          ?.setAttribute('aria-pressed', 'false');
        target.setAttribute('aria-pressed', 'true');
        if (widget.action) emit?.(widget.action, { kind: 'select', source, rowIndices: [row.index], row: row.values });
        return;
      }
      case 'search':
        state.search = input.value;
        state.page = 0;
        break;
      case 'sort':
        state.descending = state.sort === field && !state.descending;
        state.sort = field;
        state.page = 0;
        break;
      case 'group':
        state.group = input.value;
        state.page = 0;
        break;
      case 'column':
        if (!field) return;
        if (input.checked) state.hidden.delete(field);
        else state.hidden.add(field);
        state.page = 0;
        break;
      case 'previous':
        state.page = Math.max(state.page - 1, 0);
        break;
      case 'next':
        state.page += 1;
        break;
      case 'page-size':
        if (![10, 25, 50, 100].includes(Number(input.value))) return;
        state.size = Number(input.value);
        state.page = 0;
        break;
      case 'select':
        if (!row) return;
        if (input.checked) state.selected.add(row.index);
        else state.selected.delete(row.index);
        payload = { kind: 'select', source, rowIndices: [...state.selected], row: row.values };
        break;
      case 'select-page': {
        const page = Array.from(target.closest('table')?.querySelectorAll<HTMLInputElement>('[data-report-command="select"]') ?? []);
        for (const checkbox of page) {
          const index = Number(checkbox.dataset.row);
          if (input.checked) state.selected.add(index);
          else state.selected.delete(index);
        }
        payload = { kind: 'select', source, rowIndices: [...state.selected] };
        break;
      }
      case 'edit': {
        if (!row || !field || !columns.some(column => column.field === field && column.editable)) return;
        const value = input.type === 'number' ? input.value === '' ? null : input.valueAsNumber : input.value;
        if (typeof value === 'number' && !Number.isFinite(value)) return;
        state.edits.set(row.index, { ...row.values, [field]: value });
        payload = { kind: 'edit', source, rowIndex: row.index, field, value };
        break;
      }
      case 'export': {
        const visible = columns.filter(column => !state.hidden.has(column.field));
        downloadCsv(container, visible, tableRows(rows, visible, state));
        return;
      }
      default:
        return;
    }
    render(target);
    if (payload && widget.action) emit?.(widget.action, payload);
  };
  const events = ['click', 'change', 'input', 'keydown'];
  events.forEach(event => container.addEventListener(event, listener));
  const dispose = () => {
    events.forEach(event => container.removeEventListener(event, listener));
    if (mounted.get(container) === dispose) mounted.delete(container);
  };
  mounted.set(container, dispose);
  render();
  return dispose;
}

function csvCell(value: ReportingCell): string {
  const raw = text(value);
  const neutral = typeof value === 'string' && (/^[\s\uFEFF]*[=+\-@]/.test(raw) || /^[\t\r\n]/.test(raw)) ? "'" + raw : raw;
  return '"' + neutral.replace(/"/g, '""') + '"';
}

function downloadCsv(container: Element, columns: ReportingColumn[], rows: Row[]): void {
  const csv = [columns.map(col => csvCell(col.label)).join(','),
    ...rows.map(row => columns.map(col => csvCell(cell(row, col.field))).join(','))].join('\r\n');
  const document = container.ownerDocument;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'report.csv';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function attachReporting(container: Element, emit: Emit): void {
  const roots = [...container.querySelectorAll('[data-bbq-reporting]')];
  if (container.matches('[data-bbq-reporting]')) roots.unshift(container);
  for (const element of roots) {
    try {
      const definition = JSON.parse(element.getAttribute('data-bbq-reporting') ?? 'null');
      if (definition?.type === 'reporting') mountReporting(element, definition, emit);
    } catch {
      // Malformed server markup is left intact.
    }
  }
}

export function detachReporting(container: Element): void {
  mounted.get(container)?.();
  container.querySelectorAll('[data-bbq-reporting]').forEach(element => mounted.get(element)?.());
}
