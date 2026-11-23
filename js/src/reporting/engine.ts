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
    const rendered = children.map((child, index) => renderNode(child,
      child?.kind === 'filter' ? context : { ...context, filters: [...context.filters, ...filters] },
      session, `${path}.${index}`, depth + 1));
    const layout = widget.settings?.layout;
    if (Array.isArray(layout)) {
      const cards = layout.map(card => {
        const span = (value: number | undefined, maximum: number, fallback: number) =>
          typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= maximum ? value : fallback;
        const content = Array.isArray(card?.children) ? card.children.map((index: number) =>
          Number.isInteger(index) && index >= 0 ? rendered[index] ?? '' : '').join('') : '';
        return content ? `<div class="bbq-report-placement" data-region="${escapeHtml(card.region)}"
          style="--bbq-column-span:${span(card.columnSpan, 12, 12)};--bbq-row-span:${span(card.rowSpan, 4, 1)}">${content}</div>` : '';
      }).join('');
      return section(widget, path, `<div class="bbq-report-layout">${cards}</div>`);
    }
    const content = rendered.join('');
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

type SeriesIdentity = { key: string; label: string; index: number };
type Point = {
  label: string; value: number; x: number; index: number; group?: ChartGroup;
  series?: SeriesIdentity; size?: number;
};
type Reference = { axis: 'X' | 'Y'; label: string; value: number };

function references(settings: ReportingSettings, rows: Row[]): Reference[] {
  const lines = settings.presentation?.referenceLines;
  if (!Array.isArray(lines)) return [];

  return lines.slice(0, 4).flatMap(line => {
    if (!line || (line.axis !== 'X' && line.axis !== 'Y') || typeof line.label !== 'string') return [];
    const field = line.field;
    const values = typeof field === 'string' ? new Set(rows.flatMap(row => number(cell(row, field)) ?? [])) : null;
    const value = line.value ?? (values?.size === 1 ? values.values().next().value : undefined);
    return typeof value === 'number' && Number.isFinite(value) ? [{ axis: line.axis, label: line.label, value }] : [];
  });
}

function referenceMarks(lines: Reference[], axis: Reference['axis'], at: (value: number) => number,
  start: number, end: number): string {
  return lines.filter(line => line.axis === axis).map(line => {
    const coordinate = at(line.value);
    const position = axis === 'X'
      ? `x1="${coordinate}" x2="${coordinate}" y1="${start}" y2="${end}"`
      : `x1="${start}" x2="${end}" y1="${coordinate}" y2="${coordinate}"`;
    const title = escapeHtml(line.label + ': ' + format(line.value));
    return `<line ${position} stroke="currentColor" stroke-dasharray="4 3" opacity=".7" data-report-reference><title>${title}</title></line>`;
  }).join('');
}

function renderChart(binding: Binding): string {
  const { widget, rows, context: { settings }, state: { selected } } = binding;
  const timeSeries = isReportingTimeSeriesKind(widget.kind) ? widget.kind : undefined;
  const presentation = settings.presentation;
  const hex = /^#[a-fA-F0-9]{6}$/;
  const colors = new Map((Array.isArray(presentation?.colors) ? presentation.colors.slice(0, 32) : [])
    .filter(item => item && typeof item.key === 'string' && typeof item.color === 'string' && hex.test(item.color))
    .map(item => [item.key, typeof item.darkColor === 'string' && hex.test(item.darkColor)
      ? `light-dark(${item.color},${item.darkColor})` : item.color]));
  const colorFor = (point: Point, fallback: string) => colors.get(point.series?.key ?? point.label) ?? fallback;
  const valueField = presentation?.valueField ?? settings.valueField ?? 'value';
  const xField = presentation?.xField ?? settings.xField ?? 'x';
  const seriesAllowed = widget.kind === 'bar' || widget.kind === 'column' || widget.kind === 'time-column';
  const series = seriesAllowed && Array.isArray(presentation?.series) ? presentation.series.slice(0, 8) : [];
  const seriesField = seriesAllowed && !series.length ? presentation?.seriesField : undefined;
  const groups = new Map<ReportingCell, SeriesIdentity>();
  const groupField = !seriesField && !series.length && ['bar', 'column', 'line', 'pie', 'pareto', 'waterfall'].includes(widget.kind)
    ? settings.groupBy : undefined;
  const width = presentation?.binWidth;
  const binned = widget.kind === 'histogram' && typeof width === 'number' && Number.isFinite(width) && width > 0;
  let points: Point[] = [];
  const byGroup = new Map<string, Point & { group: ChartGroup }>();
  rows.forEach((row, index) => {
    const category = cell(row, groupField ?? presentation?.categoryField ?? settings.categoryField ?? 'label');
    const label = text(category) || '(blank)';
    const date = cell(row, presentation?.dateField ?? settings.dateField ?? 'date');
    const x = timeSeries ? timeValue(date) : widget.kind === 'timeline' ? (typeof date === 'string' ? Date.parse(date) : NaN)
      : widget.kind === 'scatter' || binned ? number(cell(row, xField)) : index;
    if (x === undefined || !Number.isFinite(x)) return;
    const size = presentation?.sizeField ? number(cell(row, presentation.sizeField)) : undefined;
    if (series.length) {
      series.forEach((item, index) => {
        const value = item && typeof item.field === 'string' ? number(cell(row, item.field)) : undefined;
        if (value !== undefined) points.push({ label, value, x, index: row.index, series: { key: item.field, label: item.label, index } });
      });
      return;
    }

    const value = number(cell(row, valueField)) ?? (widget.kind === 'timeline' ? 0 : undefined);
    if (value === undefined || (widget.kind === 'pie' && value <= 0) ||
        (binned && (!Number.isSafeInteger(value) || value < 0 || !Number.isFinite(x + width) || x + width <= x))) return;
    if (seriesField) {
      const key = cell(row, seriesField);
      let entry = groups.get(key);
      if (!entry) {
        if (groups.size === 8) return;
        entry = { key: text(key), label: text(key) || '(blank)', index: groups.size };
        groups.set(key, entry);
      }
      points.push({ label, value, x, index: row.index, series: entry });
    } else if (groupField) {
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
      points.push({ label, value, x, index: row.index, size });
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
  if (widget.kind === 'histogram' && !binned) return renderHistogram(widget, points);
  const lines = references(settings, rows);
  const hole = presentation?.pieHole;
  const doughnut = widget.kind === 'pie' && typeof hole === 'number' && hole >= .2 && hole <= .8;
  const peak = widget.kind === 'pie' ? Math.max(...visible.map(point => point.value)) : 1;
  const total = widget.kind === 'pie' ? visible.reduce((sum, point) => sum + point.value / peak, 0) : 1;
  const detail = (point: Point) => {
    const name = binned ? `${format(point.x)} to <${format(point.x + width)}` : point.label;
    const series = point.series ? ` (${point.series.label})` : '';
    const scatter = widget.kind === 'scatter' ? ` (x ${format(point.x)}${point.size === undefined ? '' : `, size ${format(point.size)}`})` : '';
    const date = timeSeries || widget.kind === 'timeline'
      ? ` (${timeSeries ? dateDetail(point.x) : new Date(point.x).toISOString().slice(0, 10)})` : '';
    const share = doughnut ? ` (${format(point.value / peak / total * 100)}%)` : '';
    return `${name}${series}: ${format(point.value)}${scatter}${date}${share}`;
  };
  const button = (point: Point) => point.group && !widget.action ? ''
    : ` role="button" tabindex="0" data-report-command="point" data-row="${point.index}" aria-pressed="${selected.has(point.index)}" aria-label="${escapeHtml(detail(point))}"`;
  const title = (point: Point) => `<title>${escapeHtml(detail(point))}</title>`;
  const legend = new Map(visible.flatMap((point, index) => point.series
    ? [[point.series.index, { label: point.series.label, color: colorFor(point, palette[point.series.index]) }] as const]
    : widget.kind === 'pie' && colors.size ? [[index, { label: point.label, color: colorFor(point, palette[index % palette.length]) }] as const] : []));
  const legendHtml = legend.size
    ? `<ul aria-label="Series" style="display:flex;flex-wrap:wrap;gap:.3rem 1rem;list-style:none;padding:0">${[...legend.values()].map(({ label, color }) =>
      `<li><svg aria-hidden="true" width="12" height="12"><rect width="12" height="12" fill="${color}"/></svg> ${escapeHtml(label)}</li>`).join('')}</ul>`
    : '';
  const summary = `${legendHtml}<details><summary>Chart data</summary><ul>${visible.map(point => `<li>${escapeHtml(detail(point))}</li>`).join('')}${
    lines.map(line => `<li>${escapeHtml(line.label)}: ${format(line.value)}</li>`).join('')}</ul></details>`;
  const plot = (w: number, h: number, body: string) => `<svg aria-label="${escapeHtml(widget.label)}" viewBox="0 0 ${w} ${h}"
    style="display:block;width:100%;height:auto;color:inherit">${body}</svg>${summary}${visible.length < points.length ? `<p>Showing ${visible.length} of ${points.length} points.</p>` : ''}`;
  if (timeSeries) return plot(420, 176, renderTimeSeries(timeSeries, visible, button, title, lines, colorFor, presentation?.dateAxisLabel));
  if (binned) return plot(390, 165, renderBinnedHistogram(visible, width, button, title, lines));
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
    let angle = -Math.PI / 2;
    const inner = doughnut ? hole * 78 : 0;
    const coordinate = (angle: number, radius = 78) => `${100 + Math.cos(angle) * radius},${88 + Math.sin(angle) * radius}`;
    const slices = visible.map((point, index) => {
      const share = (point.value / peak) / total;
      const sweep = share * 2 * Math.PI;
      const start = angle;
      angle += sweep;
      const color = colorFor(point, palette[index % palette.length]);
      const part = title(point);
      if (sweep >= 2 * Math.PI - 1e-10) {
        if (!inner) return `<circle cx="100" cy="88" r="78" fill="${color}"${button(point)}>${part}</circle>`;
        const ring = `M22,88 a78,78 0 1,0 156,0 a78,78 0 1,0 -156,0 Z M${100 - inner},88 a${inner},${inner} 0 1,0 ${inner * 2},0 a${inner},${inner} 0 1,0 ${inner * -2},0 Z`;
        return `<path d="${ring}" fill="${color}" fill-rule="evenodd"${button(point)}>${part}</path>`;
      }
      const arc = sweep > Math.PI ? 1 : 0;
      const center = inner ? `L${coordinate(angle, inner)} A${inner},${inner} 0 ${arc},0 ${coordinate(start, inner)}` : 'L100,88';
      return `<path d="M${coordinate(start)} A78,78 0 ${arc},1 ${coordinate(angle)} ${center} Z"
        fill="${color}"${button(point)}>${part}</path>`;
    }).join('');
    return `<div style="max-width:19rem;margin:auto">${plot(200, 176, slices)}</div>`;
  }
  const valueAxis = widget.kind === 'bar' ? 'X' : 'Y';
  const guides = lines.filter(line => line.axis === valueAxis).map(line => line.value);
  const minimum = Math.min(0, ...guides, ...visible.map(point => point.value));
  const maximum = Math.max(0, ...guides, ...visible.map(point => point.value));
  const scale = Math.max(Math.abs(minimum), Math.abs(maximum)) || 1;
  const fraction = (value: number) => (value / scale - minimum / scale) / (maximum / scale - minimum / scale || 1);
  if (widget.kind === 'bar') {
    const categories = new Map<string, number>();
    const scaleX = (value: number) => 152 + fraction(value) * 234;
    const baseline = scaleX(0);
    const slot = legend.size ? 13 : 25;
    const block = legend.size ? 14 + (Math.max(...legend.keys()) + 1) * slot : slot;
    const bars = visible.map((point, index) => {
      const first = !point.series || !categories.has(point.label);
      if (first && point.series) categories.set(point.label, categories.size);
      const position = point.series ? categories.get(point.label)! : index;
      const y = position * block + (point.series ? 14 + point.series.index * slot : 8);
      const x = scaleX(point.value);
      const label = first ? `<text x="4" y="${point.series ? position * block + 11 : y + 12}" fill="currentColor" font-size="10">${escapeHtml(point.label.slice(0, 23))}</text>` : '';
      return `<g${button(point)}>${title(point)}${label}
        <rect x="${Math.min(x, baseline)}" y="${y}" width="${Math.max(Math.abs(x - baseline), 1)}" height="${point.series ? 11 : 15}" fill="${colorFor(point, palette[point.series?.index ?? 0])}"/></g>`;
    }).join('');
    const height = (legend.size ? categories.size : visible.length) * block + 10;
    return plot(398, height, `<line x1="${baseline}" x2="${baseline}" y1="0" y2="${height}" stroke="currentColor" opacity=".4"/>${bars}${referenceMarks(lines, 'X', scaleX, 0, height)}`);
  }
  if (widget.kind === 'column') {
    const categories = new Map<string, Point[]>();
    for (const point of visible) {
      const category = categories.get(point.label) ?? [];
      category.push(point);
      categories.set(point.label, category);
    }
    const left = 40;
    const top = 13;
    const bottom = 157;
    const chartWidth = Math.max(360, categories.size * 86 + left + 12);
    const slot = (chartWidth - left - 8) / categories.size;
    const y = (value: number) => bottom - fraction(value) * (bottom - top);
    const baseline = y(0);
    const seriesCount = Math.max(1, ...visible.map(point => (point.series?.index ?? 0) + 1));
    const axes = [...new Set([minimum, 0, maximum])].map(tick =>
      `<line x1="${left}" x2="${chartWidth - 8}" y1="${y(tick)}" y2="${y(tick)}" stroke="currentColor" opacity=".18"/>
       <text x="${left - 5}" y="${y(tick) + 3}" text-anchor="end" fill="currentColor" font-size="10">${format(tick)}</text>`).join('');
    const bars = [...categories].map(([label, points], index) => {
      const start = left + slot * index;
      const band = Math.min(slot * .74, 112);
      const pitch = band / Math.max(seriesCount, points.some(point => !point.series) ? points.length : 1);
      const marks = points.map((point, position) => {
        const end = y(point.value);
        return `<rect x="${start + (slot - band) / 2 + pitch * (point.series?.index ?? position)}"
           y="${Math.min(end, baseline)}" width="${pitch * .92}" height="${Math.max(1, Math.abs(end - baseline))}"
           fill="${colorFor(point, palette[point.series?.index ?? 0])}"${button(point)}>${title(point)}</rect>`;
      }).join('');
      return `${marks}<text x="${start + slot / 2}" y="172" text-anchor="middle" fill="currentColor" font-size="10">
        ${escapeHtml(label.length > 16 ? label.slice(0, 15) + '…' : label)}<title>${escapeHtml(label)}</title></text>`;
    }).join('');
    return `<div style="overflow-x:auto"><div style="min-width:${chartWidth}px">${plot(chartWidth, 180,
      `${axes}${bars}${referenceMarks(lines, 'Y', y, left, chartWidth - 8)}`)}</div></div>`;
  }
  const xGuides = widget.kind === 'scatter' ? lines.filter(line => line.axis === 'X').map(line => line.value) : [];
  const minX = Math.min(...xGuides, ...visible.map(point => point.x));
  const maxX = Math.max(...xGuides, ...visible.map(point => point.x));
  const xScale = Math.max(Math.abs(minX), Math.abs(maxX)) || 1;
  const scaleX = (value: number) => 28 + 336 * (value / xScale - minX / xScale) / (maxX / xScale - minX / xScale || 1);
  const x = (point: Point) => scaleX(point.x);
  const scaleY = (value: number) => 145 - 120 * fraction(value);
  const y = (point: Point) => widget.kind === 'timeline' ? 85 : scaleY(point.value);
  const maximumSize = Math.max(0, ...visible.map(point => point.size ?? 0));
  const marks = visible.map(point => {
    const radius = widget.kind === 'scatter' && point.size !== undefined && maximumSize > 0
      ? Math.sqrt(9 + 135 * Math.max(0, point.size) / maximumSize) : 5;
    return `<circle cx="${x(point)}" cy="${y(point)}" r="${radius}" fill="${palette[0]}"${button(point)}>${title(point)}</circle>`;
  }).join('');
  const line = widget.kind === 'line' ? `<polyline points="${visible.map(point => `${x(point)},${y(point)}`).join(' ')}"
    fill="none" stroke="${palette[0]}" stroke-width="2"/>` : '';
  const baseline = widget.kind === 'timeline' ? 85 : 145 - 120 * fraction(0);
  const reference = widget.kind === 'scatter'
    ? referenceMarks(lines, 'X', scaleX, 18, 145) + referenceMarks(lines, 'Y', scaleY, 28, 364) : '';
  return plot(390, 166, `<line x1="25" x2="367" y1="${baseline}" y2="${baseline}" stroke="currentColor" opacity=".4"/>
    ${line}${marks}${reference}<text x="28" y="159" fill="currentColor" font-size="10">${escapeHtml(widget.kind === 'scatter' ? format(minX) : (visible[0]?.label ?? '').slice(0, 20))}</text>
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
  pointAction: (point: Point) => string, pointTitle: (point: Point) => string,
  lines: Reference[], colorFor: (point: Point, fallback: string) => string, axisLabel?: string): string {
  const left = 58;
  const right = 378;
  const top = 15;
  const bottom = 139;
  const first = points[0].x;
  const last = points[points.length - 1].x;
  const span = last - first;
  const guides = lines.filter(line => line.axis === 'Y').map(line => line.value);
  const low = Math.min(0, ...guides, ...points.map(point => point.value));
  const high = Math.max(0, ...guides, ...points.map(point => point.value));
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
    const seriesCount = Math.max(0, ...points.map(point => point.series ? point.series.index + 1 : 0));
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
      const slot = width / (seriesCount || group.length);
      return group.map(({ point, y: end }, position) =>
        `<rect x="${center - width / 2 + slot * (point.series?.index ?? position)}" y="${Math.min(end, baseline)}" width="${slot * .88}"
          height="${Math.max(1, Math.abs(end - baseline))}" fill="${colorFor(point, point.series ? palette[point.series.index] : point.value < 0 ? '#b74757' : color)}"${pointAction(point)}>${pointTitle(point)}</rect>`).join('');
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
  return `${timeAxis}${valueAxis}${data}${referenceMarks(lines, 'Y', y, left, right)}<text x="418" y="170" text-anchor="end" fill="currentColor" font-size="9">${escapeHtml(axisLabel ?? 'UTC')}</text>`;
}

function renderBinnedHistogram(points: Point[], width: number, action: (point: Point) => string,
  title: (point: Point) => string, lines: Reference[]): string {
  const xValues = [...points.flatMap(point => [point.x, point.x + width]),
    ...lines.filter(line => line.axis === 'X').map(line => line.value)];
  const minimum = Math.min(...xValues);
  const maximum = Math.max(...xValues);
  const scale = Math.max(Math.abs(minimum), Math.abs(maximum)) || 1;
  const range = maximum / scale - minimum / scale || 1;
  const x = (value: number) => 30 + (value / scale - minimum / scale) / range * 330;
  const low = Math.min(0, ...lines.filter(line => line.axis === 'Y').map(line => line.value));
  const high = Math.max(1, ...points.map(point => point.value), ...lines.filter(line => line.axis === 'Y').map(line => line.value));
  const heightScale = Math.max(Math.abs(low), high);
  const y = (value: number) => 138 - (value / heightScale - low / heightScale) / (high / heightScale - low / heightScale) * 116;
  const bars = points.map(point =>
    `<rect x="${x(point.x)}" y="${y(point.value)}" width="${Math.max(1, x(point.x + width) - x(point.x) - 1)}" height="${y(0) - y(point.value)}" fill="${palette[0]}"${action(point)}>${title(point)}</rect>`).join('');
  return `<line x1="30" x2="360" y1="${y(0)}" y2="${y(0)}" stroke="currentColor" opacity=".4"/>${bars}
    ${referenceMarks(lines, 'X', x, 16, 138)}${referenceMarks(lines, 'Y', y, 30, 360)}
    <text x="30" y="155" fill="currentColor" font-size="10">${format(minimum)}</text>
    <text x="360" y="155" text-anchor="end" fill="currentColor" font-size="10">${format(maximum)}</text>`;
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
