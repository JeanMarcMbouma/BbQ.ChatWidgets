import { isReportingTimeSeriesKind, reportingKinds, type ReportingAction, type ReportingCell, type ReportingColumn,
  type ReportingDefinition, type ReportingNode, type ReportingRow, type ReportingSettings, type ReportingTimeSeriesKind } from './types';

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
type ChartGroup = { field: string; value: ReportingCell; rowIndices: number[] };
type Binding = {
  widget: ReportingNode;
  context: Context;
  rows: Row[];
  columns: ReportingColumn[];
  state: ViewState;
  chartGroups?: Map<number, ChartGroup>;
};
type Session = { state: Map<string, ViewState>; bindings: Map<string, Binding> };
type Emit = (action: string, payload: ReportingAction) => void;

const initialContext: Context = { settings: {}, sources: {}, filters: [] };
const palette = ['#2366ba', '#147c68', '#a45c16', '#883fa1', '#ae3c59', '#467336', '#5968a5', '#9b5f55'];
const chartLimit = 60;
function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
const own = <T>(record: Readonly<Record<string, T>>, key: string | undefined): T | undefined =>
  key && Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined;
const cell = (row: Row, field: string): ReportingCell => own(row.values, field) ?? null;
const text = (value: ReportingCell) => String(value ?? '');
const number = (value: ReportingCell) => typeof value === 'number' && Number.isFinite(value) ? value : undefined;
const formatter = new Intl.NumberFormat('en', { maximumFractionDigits: 4 });
const format = (value: number) => formatter.format(value);
const control = (path: string, id: string) => `data-report-focus="${escapeHtml(path + ':' + id)}"`;
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
  return `<section class="bbq-report bbq-report-${escapeHtml(widget.kind)}" data-report-path="${escapeHtml(path)}" style="min-width:0">
    <h3>${escapeHtml(widget.label)}</h3>${body}</section>`;
}

function renderNode(widget: ReportingNode, parent: Context, session: Session, path: string, depth: number): string {
  if (!widget || !reportingKinds.includes(widget.kind) || depth > 12) return '';
  const context = settingsFor(widget, parent);
  const state = stateFor(session, path, widget.pageSize);
  const rows = widget.kind === 'dashboard' ? [] : getRows(widget, context, state);
  const columns = widget.kind === 'grid' || widget.kind === 'table' ? getColumns(context, rows) : [];
  const binding: Binding = { widget, context, rows, columns, state };
  session.bindings.set(path, binding);

  if (widget.error) return section(widget, path, `<p role="alert">${escapeHtml(widget.error)}</p>`);
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
      `<option value="${index}"${value === state.filter ? ' selected' : ''}>${escapeHtml(text(value) || '(blank)')}</option>`).join('');
    return section(widget, path, `<label>Filter by ${escapeHtml(widget.filterField)}
      <select data-report-command="filter" ${control(path, 'filter')}><option value="">All</option>${options}</select></label>`);
  }

  if (widget.kind === 'table' || widget.kind === 'grid') {
    return section(widget, path, renderTable(widget.kind, path, rows, columns, state, context.settings.groupBy, !!widget.action));
  }
  if (rows.length === 0) return section(widget, path, '<p>No results.</p>');
  if (widget.kind === 'metric') {
    const values = rows.flatMap(row => number(cell(row, context.settings.valueField ?? 'value')) ?? []);
    const total = values.reduce((sum, value) => sum + value, 0);
    return section(widget, path, `<p><strong>${Number.isFinite(total) && values.length ? format(total) : '—'}</strong></p>`);
  }
  return section(widget, path, renderChart(binding));
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

function renderTable(kind: 'table' | 'grid', path: string, rows: Row[], columns: ReportingColumn[], state: ViewState,
  defaultGroup: string | undefined, actionable: boolean): string {
  const grid = kind === 'grid';
  const visible = columns.filter(column => !state.hidden.has(column.field));
  const matching = grid ? tableRows(rows, visible, state) : rows;
  const field = state.group ?? defaultGroup ?? '';
  const ordered = field && grid ? [...matching].sort((a, b) => compare(cell(a, field), cell(b, field))) : matching;
  const lastPage = Math.max(0, Math.ceil(ordered.length / state.size) - 1);
  state.page = Math.min(state.page, lastPage);
  const page = grid ? ordered.slice(state.page * state.size, (state.page + 1) * state.size) : ordered;
  const columnOptions = columns.map(col => `<label style="display:block"><input type="checkbox" data-report-command="column"
    data-field="${escapeHtml(col.field)}" ${control(path, 'column:' + col.field)}${state.hidden.has(col.field) ? '' : ' checked'}> ${escapeHtml(col.label)}</label>`).join('');
  const groupOptions = columns.map(col => `<option value="${escapeHtml(col.field)}"${field === col.field ? ' selected' : ''}>${escapeHtml(col.label)}</option>`).join('');
  const tools = grid ? `<div style="display:flex;flex-wrap:wrap;gap:.55rem;align-items:baseline">
    <label>Search <input type="search" data-report-command="search" ${control(path, 'search')} value="${escapeHtml(state.search)}"></label>
    <label>Group by <select data-report-command="group" ${control(path, 'group')}><option value="">None</option>${groupOptions}</select></label>
    <details${state.hidden.size ? ' open' : ''}><summary>Columns</summary>${columnOptions}</details>
    <button type="button" data-report-command="export" ${control(path, 'export')}>Export CSV</button>
    <span role="status">${state.selected.size} selected</span></div>` : '';
  const heading = visible.map(col => {
    const sort = state.sort === col.field ? (state.descending ? 'descending' : 'ascending') : 'none';
    return grid
      ? `<th scope="col" aria-sort="${sort}"><button type="button" data-report-command="sort" data-field="${escapeHtml(col.field)}" ${control(path, 'sort:' + col.field)}>${escapeHtml(col.label)}</button></th>`
      : `<th scope="col">${escapeHtml(col.label)}</th>`;
  }).join('');
  const body = page.map((row, index) => {
    const group = field && grid && (index === 0 || cell(row, field) !== cell(page[index - 1], field))
      ? `<tr><th scope="rowgroup" colspan="${visible.length + (actionable ? 2 : 1)}">${escapeHtml(text(cell(row, field)) || '(blank)')}</th></tr>` : '';
    const select = grid ? `<td><input type="checkbox" aria-label="Select row ${row.index + 1}" data-report-command="select"
      data-row="${row.index}" ${control(path, 'row:' + row.index)}${state.selected.has(row.index) ? ' checked' : ''}></td>` : '';
    const cells = visible.map(col => {
      const value = cell(row, col.field);
      const edit = grid && col.editable && typeof value !== 'boolean'
        ? `<input aria-label="${escapeHtml(col.label)} row ${row.index + 1}" type="${typeof value === 'number' ? 'number' : 'text'}" step="any"
          data-report-command="edit" data-row="${row.index}" data-field="${escapeHtml(col.field)}"
          ${control(path, 'edit:' + row.index + ':' + col.field)} value="${escapeHtml(text(value))}">` : escapeHtml(text(value));
      return `<td style="padding:.25rem .45rem">${edit}</td>`;
    }).join('');
    const activate = actionable ? ` data-report-command="activate" data-row="${row.index}"` : '';
    const details = actionable
      ? `<td><button type="button"${activate} aria-label="View details for row ${row.index + 1}">View</button></td>` : '';
    return `${group}<tr${activate}>${select}${cells}${details}</tr>`;
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
  const detailsHeading = actionable ? '<th scope="col">Details</th>' : '';
  return `${tools}<div style="overflow:auto"><table style="width:100%;text-align:left"><thead><tr>${selectAll}${heading}${detailsHeading}</tr></thead>
    <tbody>${body}</tbody></table></div>${page.length ? '' : '<p>No results.</p>'}${pager}`;
}

type Point = { label: string; value: number; x: number; index: number; group?: ChartGroup };

function renderChart(binding: Binding): string {
  const { widget, rows, context: { settings }, state: { selected } } = binding;
  const timeSeries = isReportingTimeSeriesKind(widget.kind) ? widget.kind : undefined;
  const groupField = ['bar', 'line', 'pie', 'pareto', 'waterfall'].includes(widget.kind) ? settings.groupBy : undefined;
  let points: Point[] = [];
  const byGroup = new Map<string, Point & { group: ChartGroup }>();
  rows.forEach((row, index) => {
    const value = number(cell(row, settings.valueField ?? 'value')) ?? (widget.kind === 'timeline' ? 0 : undefined);
    if (value === undefined || (widget.kind === 'pie' && value <= 0)) return;
    const category = cell(row, settings.groupBy ?? settings.categoryField ?? 'label');
    const label = text(category) || '(blank)';
    const date = cell(row, settings.dateField ?? 'date');
    const x = timeSeries ? timeValue(date) : widget.kind === 'timeline' ? (typeof date === 'string' ? Date.parse(date) : NaN)
      : widget.kind === 'scatter' ? number(cell(row, settings.xField ?? 'x')) : index;
    if (x === undefined || !Number.isFinite(x)) return;
    if (groupField) {
      const point = byGroup.get(label);
      if (point) {
        point.value += value;
        point.group.rowIndices.push(row.index);
        if (point.group.value !== category) point.group.value = label;
      } else {
        byGroup.set(label, { label, value, x: byGroup.size, index: row.index,
          group: { field: groupField, value: category, rowIndices: [row.index] } });
      }
    } else {
      points.push({ label, value, x, index: row.index });
    }
  });
  points.push(...[...byGroup.values()].filter(point => Number.isFinite(point.value)));
  if (timeSeries || widget.kind === 'timeline') points.sort((a, b) => a.x - b.x);
  if (widget.kind === 'pareto') {
    points = points.filter(point => point.value > 0).sort((a, b) => b.value - a.value);
  }
  if (!points.length) return timeSeries
    ? '<p>No plottable observations. Provide an ISO date and a numeric value for each observation.</p>'
    : '<p>No plottable values.</p>';
  const visible = points.slice(0, chartLimit);
  if (widget.action && groupField) {
    binding.chartGroups = new Map(visible.flatMap(point => point.group ? [[point.index, point.group]] : []));
  }
  if (widget.kind === 'histogram') return renderHistogram(widget, points);
  const detail = (point: Point) => `${point.label}: ${format(point.value)}${widget.kind === 'scatter' ? ` (x ${format(point.x)})` : ''}${timeSeries || widget.kind === 'timeline' ? ` (${timeSeries ? dateDetail(point.x) : new Date(point.x).toISOString().slice(0, 10)})` : ''}`;
  const button = (point: Point) => point.group && !widget.action ? ''
    : ` role="button" tabindex="0" data-report-command="point" data-row="${point.index}" aria-pressed="${selected.has(point.index)}" aria-label="${escapeHtml(detail(point))}"`;
  const title = (point: Point) => `<title>${escapeHtml(detail(point))}</title>`;
  const summary = `<details><summary>Chart data</summary><ul>${visible.map(point => `<li>${escapeHtml(detail(point))}</li>`).join('')}</ul></details>`;
  const plot = (w: number, h: number, body: string) => `<svg aria-label="${escapeHtml(widget.label)}" viewBox="0 0 ${w} ${h}"
    style="display:block;width:100%;height:auto;color:inherit">${body}</svg>${summary}${visible.length < points.length ? `<p>Showing ${visible.length} of ${points.length} points.</p>` : ''}`;
  if (timeSeries) return plot(420, 176, renderTimeSeries(timeSeries, visible, button, title));
  if (widget.kind === 'waterfall' || widget.kind === 'pareto') {
    const waterfall = widget.kind === 'waterfall';
    const scale = Math.max(...visible.map(point => Math.abs(point.value))) || 1;
    let running = 0;
    const steps = visible.map(point => {
      const start = running;
      running += point.value / scale;
      return { start, end: running };
    });
    const low = waterfall ? Math.min(0, ...steps.map(step => step.end)) : 0;
    const high = waterfall ? Math.max(0, ...steps.map(step => step.end)) : 1;
    const y = (value: number) => 136 - 112 * (value - low) / (high - low || 1);
    const width = 340 / visible.length;
    const bars = visible.map((point, index) => {
      const step = steps[index];
      const x = 25 + index * width;
      const start = y(waterfall ? step.start : 0);
      const end = y(waterfall ? step.end : point.value / scale);
      const connector = waterfall && index + 1 < visible.length
        ? `<line x1="${x + .72 * width}" x2="${x + width}" y1="${end}" y2="${end}" stroke="currentColor" opacity=".45"/>` : '';
      return `<g${button(point)}>${title(point)}<rect x="${x}" y="${Math.min(start, end)}" width="${.72 * width}"
        height="${Math.max(1, Math.abs(end - start))}" rx="2" fill="${point.value < 0 ? '#b74757' : palette[0]}"/></g>${connector}`;
    }).join('');
    const cumulative = waterfall ? '' : `<polyline aria-label="Cumulative share of displayed values" fill="none" stroke="#a14321" stroke-width="2.5"
      points="${steps.map((step, index) => `${25 + (index + .36) * width},${y(step.end / running)}`).join(' ')}"/>
      <text x="365" y="17" text-anchor="end" fill="currentColor" font-size="10">100%</text>`;
    return plot(390, 161, `<line x1="24" x2="366" y1="${y(0)}" y2="${y(0)}" stroke="currentColor" opacity=".4"/>
      ${bars}${cumulative}<text x="25" y="154" fill="currentColor" font-size="10">${escapeHtml(visible[0].label.slice(0, 20))}</text>
      ${visible.length > 1 ? `<text x="365" y="154" text-anchor="end" fill="currentColor" font-size="10">${escapeHtml(visible[visible.length - 1].label.slice(0, 20))}</text>` : ''}`);
  }
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
      return `<g${button(point)}>${title(point)}<text x="4" y="${y + 12}" fill="currentColor" font-size="10">${escapeHtml(point.label.slice(0, 23))}</text>
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
    ${line}${marks}<text x="28" y="159" fill="currentColor" font-size="10">${escapeHtml(widget.kind === 'scatter' ? format(minX) : (visible[0]?.label ?? '').slice(0, 20))}</text>
    <text x="364" y="159" text-anchor="end" fill="currentColor" font-size="10">${escapeHtml(widget.kind === 'scatter' ? format(maxX) : (visible[visible.length - 1]?.label ?? '').slice(0, 20))}</text>`);
}

function timeValue(value: ReportingCell): number | undefined {
  if (typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value)) return undefined;
  const day = value.slice(0, 10);
  const midnight = new Date(day);
  if (!Number.isFinite(midnight.getTime()) || midnight.toISOString().slice(0, 10) !== day) return undefined;
  return Date.parse(value);
}

function dateDetail(timestamp: number): string {
  const iso = new Date(timestamp).toISOString();
  return iso.endsWith('T00:00:00.000Z') ? iso.slice(0, 10) : iso.replace('.000Z', 'Z');
}

function renderTimeSeries(kind: ReportingTimeSeriesKind, points: Point[],
  pointAction: (point: Point) => string, pointTitle: (point: Point) => string): string {
  const left = 58;
  const right = 378;
  const top = 15;
  const bottom = 139;
  const first = points[0].x;
  const last = points[points.length - 1].x;
  const span = last - first;
  const low = Math.min(0, ...points.map(point => point.value));
  const high = Math.max(0, ...points.map(point => point.value));
  const scale = Math.max(Math.abs(low), Math.abs(high)) || 1;
  const valueSpan = high / scale - low / scale;
  const x = (timestamp: number) => span ? left + (right - left) * (timestamp - first) / span : (left + right) / 2;
  const y = (value: number) => valueSpan
    ? bottom - (bottom - top) * (value / scale - low / scale) / valueSpan
    : (bottom + top) / 2;
  const baseline = y(0);
  const color = kind === 'area' ? palette[1] : kind === 'step' ? palette[3] : palette[0];
  const plotted = points.map(point => ({ point, x: x(point.x), y: y(point.value) }));
  const ticks = span > 0 ? [first, first + span / 2, last] : [first];
  const timeAxis = ticks.map((tick, index) => {
    const label = new Date(tick).toISOString();
    const display = span > 0 && span < 86_400_000
      ? label.slice(11, span < 1_000 ? 23 : span < 60_000 ? 19 : 16)
      : label.slice(0, 10);
    const anchor = index === 0 && span ? 'start' : index === 2 ? 'end' : 'middle';
    return `<line x1="${x(tick)}" x2="${x(tick)}" y1="${top}" y2="${bottom}" stroke="currentColor" opacity=".12"/>
      <text x="${x(tick)}" y="157" text-anchor="${anchor}" fill="currentColor" font-size="10">${escapeHtml(display)}</text>`;
  }).join('');
  const valueAxis = [...new Set([low, 0, high])].map(value => {
    const absolute = Math.abs(value);
    const label = absolute >= 1_000_000 || (absolute > 0 && absolute < .001) ? value.toExponential(1) : format(value);
    return `<line x1="${left}" x2="${right}" y1="${y(value)}" y2="${y(value)}" stroke="currentColor" opacity="${value === 0 ? .4 : .18}"/>
      <text x="${left - 8}" y="${y(value) + 3}" text-anchor="end" fill="currentColor" font-size="10">${escapeHtml(label)}</text>`;
  }).join('');

  let data: string;
  if (kind === 'time-column') {
    const groups = new Map<number, typeof plotted>();
    for (const mark of plotted) {
      const group = groups.get(mark.x) ?? [];
      group.push(mark);
      groups.set(mark.x, group);
    }
    const ordered = [...groups.entries()];
    data = ordered.map(([center, group], index) => {
      const previous = ordered[index - 1]?.[0] ?? -Infinity;
      const next = ordered[index + 1]?.[0] ?? Infinity;
      const width = Math.min(26, .75 * Math.min(center - previous, next - center));
      const slot = width / group.length;
      return group.map(({ point, y: end }, position) =>
        `<rect x="${center - width / 2 + slot * position}" y="${Math.min(end, baseline)}" width="${slot * .88}"
          height="${Math.max(1, Math.abs(end - baseline))}" fill="${point.value < 0 ? '#b74757' : color}"${pointAction(point)}>${pointTitle(point)}</rect>`).join('');
    }).join('');
  } else {
    const path = plotted.map((point, index) =>
      index === 0 ? `M ${point.x} ${point.y}` : kind === 'step' ? `H ${point.x} V ${point.y}` : `L ${point.x} ${point.y}`).join(' ');
    const area = kind === 'area'
      ? `<path d="${path} L ${x(last)} ${baseline} L ${x(first)} ${baseline} Z" fill="${color}" fill-opacity=".2"/>`
      : '';
    const markers = plotted.map(({ point, x: cx, y: cy }) =>
      `<circle cx="${cx}" cy="${cy}" r="4" fill="${color}"${pointAction(point)}>${pointTitle(point)}</circle>`).join('');
    data = `${area}<path d="${path}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round"/>${markers}`;
  }
  return `${timeAxis}${valueAxis}${data}<text x="418" y="170" text-anchor="end" fill="currentColor" font-size="9">UTC</text>`;
}

function renderHistogram(widget: ReportingNode, points: Point[]): string {
  const minimum = points.reduce((value, point) => Math.min(value, point.value), Infinity);
  const maximum = points.reduce((value, point) => Math.max(value, point.value), -Infinity);
  const scale = Math.max(Math.abs(minimum), Math.abs(maximum)) || 1;
  const low = minimum / scale;
  const span = maximum / scale - low;
  const size = span ? Math.min(12, Math.ceil(Math.sqrt(points.length))) : 1;
  const bins = Array<number>(size).fill(0);
  for (const point of points) {
    const index = span ? Math.floor((point.value / scale - low) / span * size) : 0;
    bins[Math.max(0, Math.min(size - 1, index))]++;
  }
  const peak = Math.max(...bins);
  const width = 340 / size;
  const edge = (index: number) => format((low + span * index / size) * scale);
  const labels = bins.map((count, index) =>
    `${edge(index)}${size === 1 ? '' : `–${edge(index + 1)}`}: ${count} ${count === 1 ? 'observation' : 'observations'}`);
  const bars = bins.map((count, index) => {
    const height = count / peak * 110;
    return `<rect x="${25 + index * width}" y="${132 - height}" width="${width - 2}" height="${height}" rx="2" fill="${palette[0]}">
      <title>${escapeHtml(labels[index])}</title></rect>`;
  }).join('');
  return `<svg aria-label="${escapeHtml(widget.label)}" viewBox="0 0 390 155" style="display:block;width:100%;height:auto;color:inherit">
    <line x1="25" x2="365" y1="132" y2="132" stroke="currentColor" opacity=".4"/>${bars}
    <text x="25" y="149" fill="currentColor" font-size="10">${escapeHtml(format(minimum))}</text>
    ${size > 1 ? `<text x="365" y="149" text-anchor="end" fill="currentColor" font-size="10">${escapeHtml(format(maximum))}</text>` : ''}</svg>
    <details><summary>Distribution data</summary><ul>${labels.map(label => `<li>${escapeHtml(label)}</li>`).join('')}</ul></details>`;
}

export function renderReporting(definition: ReportingDefinition): string {
  return `<div class="bbq-reporting" data-bbq-reporting="${escapeHtml(JSON.stringify(definition))}">
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
    const origin = event.target as Element | null;
    const target = origin?.closest?.<HTMLElement>('[data-report-command]');
    const path = target?.closest('[data-report-path]')?.getAttribute('data-report-path');
    const binding = path ? session.bindings.get(path) : undefined;
    if (!target || !binding || !container.contains(target)) return;
    const command = target.dataset.reportCommand;
    const isButton = target.tagName === 'BUTTON';
    const keyboard = event.type === 'keydown' && command === 'point' &&
      ['Enter', ' '].includes((event as KeyboardEvent).key);
    const eventType = command === 'search' ? 'input' : isButton || command === 'point' || command === 'activate' ? 'click' : 'change';
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
        const aggregate = binding.chartGroups?.get(row.index);
        if (widget.action) emit?.(widget.action, aggregate
          ? { kind: 'select', source, rowIndices: [...aggregate.rowIndices], group: { field: aggregate.field, value: aggregate.value } }
          : { kind: 'select', source, rowIndices: [row.index], row: row.values });
        return;
      }
      case 'activate':
        if (row && widget.action && (isButton || !origin?.closest('button, input, select, label, a, textarea, summary, [contenteditable]'))) {
          emit?.(widget.action, { kind: 'activate', source, rowIndex: row.index, row: row.values });
        }
        return;
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
