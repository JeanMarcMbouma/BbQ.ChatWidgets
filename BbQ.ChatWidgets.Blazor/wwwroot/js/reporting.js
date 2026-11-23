// Generated from js/src/reporting by npm run build:reporting.

// src/reporting/types.ts
var reportingTimeSeriesKinds = ["time-line", "area", "step", "time-column"];
var reportingKinds = [
  "dashboard",
  "filter",
  "bar",
  "line",
  "pie",
  "timeline",
  "scatter",
  ...reportingTimeSeriesKinds,
  "waterfall",
  "pareto",
  "histogram",
  "table",
  "grid",
  "metric"
];
function isReportingTimeSeriesKind(kind) {
  return reportingTimeSeriesKinds.some((timeSeriesKind) => timeSeriesKind === kind);
}

// src/reporting/engine.ts
var initialContext = { settings: {}, sources: {}, filters: [] };
var palette = ["#2366ba", "#147c68", "#a45c16", "#883fa1", "#ae3c59", "#467336", "#5968a5", "#9b5f55"];
var chartLimit = 60;
function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
var own = (record, key) => key && Object.prototype.hasOwnProperty.call(record, key) ? record[key] : void 0;
var cell = (row, field) => own(row.values, field) ?? null;
var text = (value) => String(value ?? "");
var number = (value) => typeof value === "number" && Number.isFinite(value) ? value : void 0;
var formatter = new Intl.NumberFormat("en", { maximumFractionDigits: 4 });
var format = (value) => formatter.format(value);
var control = (path, id) => `data-report-focus="${escapeHtml(path + ":" + id)}"`;
var settingsFor = (widget, parent) => ({
  settings: { ...parent.settings, ...Object.fromEntries(Object.entries(widget.settings ?? {}).filter(([, value]) => value != null)) },
  sources: { ...parent.sources, ...widget.sources },
  filters: parent.filters
});
function stateFor(session, path, size = 10) {
  let state = session.state.get(path);
  if (!state) {
    state = {
      search: "",
      descending: false,
      page: 0,
      size: [10, 25, 50, 100].includes(size) ? size : 10,
      hidden: /* @__PURE__ */ new Set(),
      selected: /* @__PURE__ */ new Set(),
      edits: /* @__PURE__ */ new Map()
    };
    session.state.set(path, state);
  }
  return state;
}
function getRows(widget, context, state) {
  const source = widget.rows ?? own(context.sources, context.settings.dataSource);
  if (!Array.isArray(source)) return [];
  return source.flatMap((values, index) => {
    if (!values || typeof values !== "object" || Array.isArray(values)) return [];
    const row = { index, values: state.edits.get(index) ?? values };
    return context.filters.every((filter) => filter.source !== context.settings.dataSource || cell(row, filter.field) === filter.value) ? [row] : [];
  });
}
function getColumns(context, rows) {
  if (Array.isArray(context.settings.columns)) {
    return context.settings.columns.filter((column) => column && typeof column.field === "string");
  }
  const fields = [...new Set(rows.flatMap((row) => Object.keys(row.values)))];
  return fields.map((field) => ({ field, label: field }));
}
function section(widget, path, body) {
  return `<section class="bbq-report bbq-report-${escapeHtml(widget.kind)}" data-report-path="${escapeHtml(path)}" style="min-width:0">
    <h3>${escapeHtml(widget.label)}</h3>${body}</section>`;
}
function renderNode(widget, parent, session, path, depth) {
  if (!widget || !reportingKinds.includes(widget.kind) || depth > 12) return "";
  const context = settingsFor(widget, parent);
  const state = stateFor(session, path, widget.pageSize);
  const rows = widget.kind === "dashboard" ? [] : getRows(widget, context, state);
  const columns = widget.kind === "grid" || widget.kind === "table" ? getColumns(context, rows) : [];
  const binding = { widget, context, rows, columns, state };
  session.bindings.set(path, binding);
  if (widget.error) return section(widget, path, `<p role="alert">${escapeHtml(widget.error)}</p>`);
  if (widget.kind === "dashboard") {
    const children = Array.isArray(widget.children) ? widget.children : [];
    const filters = [];
    children.forEach((child, index) => {
      if (child?.kind !== "filter" || !child.filterField) return;
      const childContext = settingsFor(child, context);
      const childState = stateFor(session, `${path}.${index}`);
      const field = child.filterField;
      const value = childState.filter;
      if (value === void 0) return;
      if (getRows(child, childContext, childState).some((row) => cell(row, field) === value)) {
        filters.push({ source: childContext.settings.dataSource, field, value });
      } else {
        childState.filter = void 0;
      }
    });
    const content = children.map((child, index) => renderNode(
      child,
      child?.kind === "filter" ? context : { ...context, filters: [...context.filters, ...filters] },
      session,
      `${path}.${index}`,
      depth + 1
    )).join("");
    return section(widget, path, `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr));gap:1rem">${content}</div>`);
  }
  if (widget.kind === "filter") {
    if (!widget.filterField) return section(widget, path, "<p>Choose a filter field.</p>");
    const choices = [...new Set(rows.map((row) => cell(row, widget.filterField)))];
    const options = choices.map((value, index) => `<option value="${index}"${value === state.filter ? " selected" : ""}>${escapeHtml(text(value) || "(blank)")}</option>`).join("");
    return section(widget, path, `<label>Filter by ${escapeHtml(widget.filterField)}
      <select data-report-command="filter" ${control(path, "filter")}><option value="">All</option>${options}</select></label>`);
  }
  if (widget.kind === "table" || widget.kind === "grid") {
    return section(widget, path, renderTable(widget.kind, path, rows, columns, state, context.settings.groupBy, !!widget.action));
  }
  if (rows.length === 0) return section(widget, path, "<p>No results.</p>");
  if (widget.kind === "metric") {
    const values = rows.flatMap((row) => number(cell(row, context.settings.valueField ?? "value")) ?? []);
    const total = values.reduce((sum, value) => sum + value, 0);
    return section(widget, path, `<p><strong>${Number.isFinite(total) && values.length ? format(total) : "\u2014"}</strong></p>`);
  }
  return section(widget, path, renderChart(binding));
}
function compare(a, b) {
  return typeof a === "number" && typeof b === "number" ? a - b : text(a).localeCompare(text(b), void 0, { numeric: true });
}
function tableRows(rows, columns, state) {
  const search = state.search.trim().toLocaleLowerCase();
  const filtered = search ? rows.filter((row) => columns.some((col) => text(cell(row, col.field)).toLocaleLowerCase().includes(search))) : rows;
  if (!state.sort) return filtered;
  const field = state.sort;
  return [...filtered].sort((a, b) => compare(cell(a, field), cell(b, field)) * (state.descending ? -1 : 1));
}
function renderTable(kind, path, rows, columns, state, defaultGroup, actionable) {
  const grid = kind === "grid";
  const visible = columns.filter((column) => !state.hidden.has(column.field));
  const matching = grid ? tableRows(rows, visible, state) : rows;
  const field = state.group ?? defaultGroup ?? "";
  const ordered = field && grid ? [...matching].sort((a, b) => compare(cell(a, field), cell(b, field))) : matching;
  const lastPage = Math.max(0, Math.ceil(ordered.length / state.size) - 1);
  state.page = Math.min(state.page, lastPage);
  const page = grid ? ordered.slice(state.page * state.size, (state.page + 1) * state.size) : ordered;
  const columnOptions = columns.map((col) => `<label style="display:block"><input type="checkbox" data-report-command="column"
    data-field="${escapeHtml(col.field)}" ${control(path, "column:" + col.field)}${state.hidden.has(col.field) ? "" : " checked"}> ${escapeHtml(col.label)}</label>`).join("");
  const groupOptions = columns.map((col) => `<option value="${escapeHtml(col.field)}"${field === col.field ? " selected" : ""}>${escapeHtml(col.label)}</option>`).join("");
  const tools = grid ? `<div style="display:flex;flex-wrap:wrap;gap:.55rem;align-items:baseline">
    <label>Search <input type="search" data-report-command="search" ${control(path, "search")} value="${escapeHtml(state.search)}"></label>
    <label>Group by <select data-report-command="group" ${control(path, "group")}><option value="">None</option>${groupOptions}</select></label>
    <details${state.hidden.size ? " open" : ""}><summary>Columns</summary>${columnOptions}</details>
    <button type="button" data-report-command="export" ${control(path, "export")}>Export CSV</button>
    <span role="status">${state.selected.size} selected</span></div>` : "";
  const heading = visible.map((col) => {
    const sort = state.sort === col.field ? state.descending ? "descending" : "ascending" : "none";
    return grid ? `<th scope="col" aria-sort="${sort}"><button type="button" data-report-command="sort" data-field="${escapeHtml(col.field)}" ${control(path, "sort:" + col.field)}>${escapeHtml(col.label)}</button></th>` : `<th scope="col">${escapeHtml(col.label)}</th>`;
  }).join("");
  const body = page.map((row, index) => {
    const group = field && grid && (index === 0 || cell(row, field) !== cell(page[index - 1], field)) ? `<tr><th scope="rowgroup" colspan="${visible.length + (actionable ? 2 : 1)}">${escapeHtml(text(cell(row, field)) || "(blank)")}</th></tr>` : "";
    const select = grid ? `<td><input type="checkbox" aria-label="Select row ${row.index + 1}" data-report-command="select"
      data-row="${row.index}" ${control(path, "row:" + row.index)}${state.selected.has(row.index) ? " checked" : ""}></td>` : "";
    const cells = visible.map((col) => {
      const value = cell(row, col.field);
      const edit = grid && col.editable && typeof value !== "boolean" ? `<input aria-label="${escapeHtml(col.label)} row ${row.index + 1}" type="${typeof value === "number" ? "number" : "text"}" step="any"
          data-report-command="edit" data-row="${row.index}" data-field="${escapeHtml(col.field)}"
          ${control(path, "edit:" + row.index + ":" + col.field)} value="${escapeHtml(text(value))}">` : escapeHtml(text(value));
      return `<td style="padding:.25rem .45rem">${edit}</td>`;
    }).join("");
    const activate = actionable ? ` data-report-command="activate" data-row="${row.index}"` : "";
    const details = actionable ? `<td><button type="button"${activate} aria-label="View details for row ${row.index + 1}">View</button></td>` : "";
    return `${group}<tr${activate}>${select}${cells}${details}</tr>`;
  }).join("");
  const all = page.length > 0 && page.every((row) => state.selected.has(row.index));
  const selectAll = grid ? `<th scope="col"><input type="checkbox" aria-label="Select page" data-report-command="select-page"
    ${control(path, "select-page")}${all ? " checked" : ""}${page.length ? "" : " disabled"}></th>` : "";
  const pager = grid ? `<div style="display:flex;flex-wrap:wrap;gap:.55rem;align-items:baseline">
    <button type="button" data-report-command="previous" ${control(path, "previous")}${state.page === 0 ? " disabled" : ""}>Previous</button>
    <span>${ordered.length ? state.page * state.size + 1 : 0}\u2013${Math.min((state.page + 1) * state.size, ordered.length)} of ${ordered.length}</span>
    <button type="button" data-report-command="next" ${control(path, "next")}${state.page >= lastPage ? " disabled" : ""}>Next</button>
    <label>Rows per page <select data-report-command="page-size" ${control(path, "page-size")}>
    ${[10, 25, 50, 100].map((size) => `<option${state.size === size ? " selected" : ""}>${size}</option>`).join("")}</select></label></div>` : "";
  const detailsHeading = actionable ? '<th scope="col">Details</th>' : "";
  return `${tools}<div style="overflow:auto"><table style="width:100%;text-align:left"><thead><tr>${selectAll}${heading}${detailsHeading}</tr></thead>
    <tbody>${body}</tbody></table></div>${page.length ? "" : "<p>No results.</p>"}${pager}`;
}
function references(settings, rows) {
  const lines = settings.presentation?.referenceLines;
  if (!Array.isArray(lines)) return [];
  return lines.slice(0, 4).flatMap((line) => {
    if (!line || line.axis !== "X" && line.axis !== "Y" || typeof line.label !== "string") return [];
    const field = line.field;
    const values = typeof field === "string" ? new Set(rows.flatMap((row) => number(cell(row, field)) ?? [])) : null;
    const value = line.value ?? (values?.size === 1 ? values.values().next().value : void 0);
    return typeof value === "number" && Number.isFinite(value) ? [{ axis: line.axis, label: line.label, value }] : [];
  });
}
function referenceMarks(lines, axis, at, start, end) {
  return lines.filter((line) => line.axis === axis).map((line) => {
    const coordinate = at(line.value);
    const position = axis === "X" ? `x1="${coordinate}" x2="${coordinate}" y1="${start}" y2="${end}"` : `x1="${start}" x2="${end}" y1="${coordinate}" y2="${coordinate}"`;
    const title = escapeHtml(line.label + ": " + format(line.value));
    return `<line ${position} stroke="currentColor" stroke-dasharray="4 3" opacity=".7" data-report-reference><title>${title}</title></line>`;
  }).join("");
}
function renderChart(binding) {
  const { widget, rows, context: { settings }, state: { selected } } = binding;
  const timeSeries = isReportingTimeSeriesKind(widget.kind) ? widget.kind : void 0;
  const presentation = settings.presentation;
  const valueField = presentation?.valueField ?? settings.valueField ?? "value";
  const xField = presentation?.xField ?? settings.xField ?? "x";
  const seriesAllowed = widget.kind === "bar" || widget.kind === "time-column";
  const series = seriesAllowed && Array.isArray(presentation?.series) ? presentation.series.slice(0, 8) : [];
  const seriesField = seriesAllowed && !series.length ? presentation?.seriesField : void 0;
  const groups = /* @__PURE__ */ new Map();
  const groupField = !seriesField && !series.length && ["bar", "line", "pie", "pareto", "waterfall"].includes(widget.kind) ? settings.groupBy : void 0;
  const width = presentation?.binWidth;
  const binned = widget.kind === "histogram" && typeof width === "number" && Number.isFinite(width) && width > 0;
  let points = [];
  const byGroup = /* @__PURE__ */ new Map();
  rows.forEach((row, index) => {
    const category = cell(row, groupField ?? presentation?.categoryField ?? settings.categoryField ?? "label");
    const label = text(category) || "(blank)";
    const date = cell(row, presentation?.dateField ?? settings.dateField ?? "date");
    const x2 = timeSeries ? timeValue(date) : widget.kind === "timeline" ? typeof date === "string" ? Date.parse(date) : NaN : widget.kind === "scatter" || binned ? number(cell(row, xField)) : index;
    if (x2 === void 0 || !Number.isFinite(x2)) return;
    const size = presentation?.sizeField ? number(cell(row, presentation.sizeField)) : void 0;
    if (series.length) {
      series.forEach((item, index2) => {
        const value2 = item && typeof item.field === "string" ? number(cell(row, item.field)) : void 0;
        if (value2 !== void 0) points.push({ label, value: value2, x: x2, index: row.index, series: { label: item.label, index: index2 } });
      });
      return;
    }
    const value = number(cell(row, valueField)) ?? (widget.kind === "timeline" ? 0 : void 0);
    if (value === void 0 || widget.kind === "pie" && value <= 0 || binned && (!Number.isSafeInteger(value) || value < 0 || !Number.isFinite(x2 + width) || x2 + width <= x2)) return;
    if (seriesField) {
      const key = cell(row, seriesField);
      let entry = groups.get(key);
      if (!entry) {
        if (groups.size === 8) return;
        entry = { label: text(key) || "(blank)", index: groups.size };
        groups.set(key, entry);
      }
      points.push({ label, value, x: x2, index: row.index, series: entry });
    } else if (groupField) {
      const point = byGroup.get(label);
      if (point) {
        point.value += value;
        point.group.rowIndices.push(row.index);
        if (point.group.value !== category) point.group.value = label;
      } else {
        byGroup.set(label, {
          label,
          value,
          x: byGroup.size,
          index: row.index,
          group: { field: groupField, value: category, rowIndices: [row.index] }
        });
      }
    } else {
      points.push({ label, value, x: x2, index: row.index, size });
    }
  });
  points.push(...[...byGroup.values()].filter((point) => Number.isFinite(point.value)));
  if (timeSeries || widget.kind === "timeline") points.sort((a, b) => a.x - b.x);
  if (widget.kind === "pareto") {
    points = points.filter((point) => point.value > 0).sort((a, b) => b.value - a.value);
  }
  if (!points.length) return timeSeries ? "<p>No plottable observations. Provide an ISO date and a numeric value for each observation.</p>" : "<p>No plottable values.</p>";
  const visible = points.slice(0, chartLimit);
  if (widget.action && groupField) {
    binding.chartGroups = new Map(visible.flatMap((point) => point.group ? [[point.index, point.group]] : []));
  }
  if (widget.kind === "histogram" && !binned) return renderHistogram(widget, points);
  const lines = references(settings, rows);
  const hole = presentation?.pieHole;
  const doughnut = widget.kind === "pie" && typeof hole === "number" && hole >= 0.2 && hole <= 0.8;
  const peak = widget.kind === "pie" ? Math.max(...visible.map((point) => point.value)) : 1;
  const total = widget.kind === "pie" ? visible.reduce((sum, point) => sum + point.value / peak, 0) : 1;
  const detail = (point) => {
    const name = binned ? `${format(point.x)} to <${format(point.x + width)}` : point.label;
    const series2 = point.series ? ` (${point.series.label})` : "";
    const scatter = widget.kind === "scatter" ? ` (x ${format(point.x)}${point.size === void 0 ? "" : `, size ${format(point.size)}`})` : "";
    const date = timeSeries || widget.kind === "timeline" ? ` (${timeSeries ? dateDetail(point.x) : new Date(point.x).toISOString().slice(0, 10)})` : "";
    const share = doughnut ? ` (${format(point.value / peak / total * 100)}%)` : "";
    return `${name}${series2}: ${format(point.value)}${scatter}${date}${share}`;
  };
  const button = (point) => point.group && !widget.action ? "" : ` role="button" tabindex="0" data-report-command="point" data-row="${point.index}" aria-pressed="${selected.has(point.index)}" aria-label="${escapeHtml(detail(point))}"`;
  const title = (point) => `<title>${escapeHtml(detail(point))}</title>`;
  const legend = new Map(visible.flatMap((point) => point.series ? [[point.series.index, point.series.label]] : []));
  const legendHtml = legend.size ? `<ul aria-label="Series" style="display:flex;flex-wrap:wrap;gap:.3rem 1rem;list-style:none;padding:0">${[...legend].map(([index, label]) => `<li><svg aria-hidden="true" width="12" height="12"><rect width="12" height="12" fill="${palette[index]}"/></svg> ${escapeHtml(label)}</li>`).join("")}</ul>` : "";
  const summary = `${legendHtml}<details><summary>Chart data</summary><ul>${visible.map((point) => `<li>${escapeHtml(detail(point))}</li>`).join("")}${lines.map((line2) => `<li>${escapeHtml(line2.label)}: ${format(line2.value)}</li>`).join("")}</ul></details>`;
  const plot = (w, h, body) => `<svg aria-label="${escapeHtml(widget.label)}" viewBox="0 0 ${w} ${h}"
    style="display:block;width:100%;height:auto;color:inherit">${body}</svg>${summary}${visible.length < points.length ? `<p>Showing ${visible.length} of ${points.length} points.</p>` : ""}`;
  if (timeSeries) return plot(420, 176, renderTimeSeries(timeSeries, visible, button, title, lines, presentation?.dateAxisLabel));
  if (binned) return plot(390, 165, renderBinnedHistogram(visible, width, button, title, lines));
  if (widget.kind === "waterfall" || widget.kind === "pareto") {
    const waterfall = widget.kind === "waterfall";
    const scale2 = Math.max(...visible.map((point) => Math.abs(point.value))) || 1;
    let running = 0;
    const steps = visible.map((point) => {
      const start = running;
      running += point.value / scale2;
      return { start, end: running };
    });
    const low = waterfall ? Math.min(0, ...steps.map((step) => step.end)) : 0;
    const high = waterfall ? Math.max(0, ...steps.map((step) => step.end)) : 1;
    const y2 = (value) => 136 - 112 * (value - low) / (high - low || 1);
    const width2 = 340 / visible.length;
    const bars = visible.map((point, index) => {
      const step = steps[index];
      const x2 = 25 + index * width2;
      const start = y2(waterfall ? step.start : 0);
      const end = y2(waterfall ? step.end : point.value / scale2);
      const connector = waterfall && index + 1 < visible.length ? `<line x1="${x2 + 0.72 * width2}" x2="${x2 + width2}" y1="${end}" y2="${end}" stroke="currentColor" opacity=".45"/>` : "";
      return `<g${button(point)}>${title(point)}<rect x="${x2}" y="${Math.min(start, end)}" width="${0.72 * width2}"
        height="${Math.max(1, Math.abs(end - start))}" rx="2" fill="${point.value < 0 ? "#b74757" : palette[0]}"/></g>${connector}`;
    }).join("");
    const cumulative = waterfall ? "" : `<polyline aria-label="Cumulative share of displayed values" fill="none" stroke="#a14321" stroke-width="2.5"
      points="${steps.map((step, index) => `${25 + (index + 0.36) * width2},${y2(step.end / running)}`).join(" ")}"/>
      <text x="365" y="17" text-anchor="end" fill="currentColor" font-size="10">100%</text>`;
    return plot(390, 161, `<line x1="24" x2="366" y1="${y2(0)}" y2="${y2(0)}" stroke="currentColor" opacity=".4"/>
      ${bars}${cumulative}<text x="25" y="154" fill="currentColor" font-size="10">${escapeHtml(visible[0].label.slice(0, 20))}</text>
      ${visible.length > 1 ? `<text x="365" y="154" text-anchor="end" fill="currentColor" font-size="10">${escapeHtml(visible[visible.length - 1].label.slice(0, 20))}</text>` : ""}`);
  }
  if (widget.kind === "pie") {
    let angle = -Math.PI / 2;
    const inner = doughnut ? hole * 78 : 0;
    const coordinate = (angle2, radius = 78) => `${100 + Math.cos(angle2) * radius},${88 + Math.sin(angle2) * radius}`;
    const slices = visible.map((point, index) => {
      const share = point.value / peak / total;
      const sweep = share * 2 * Math.PI;
      const start = angle;
      angle += sweep;
      const color = palette[index % palette.length];
      const part = title(point);
      if (sweep >= 2 * Math.PI - 1e-10) {
        if (!inner) return `<circle cx="100" cy="88" r="78" fill="${color}"${button(point)}>${part}</circle>`;
        const ring = `M22,88 a78,78 0 1,0 156,0 a78,78 0 1,0 -156,0 Z M${100 - inner},88 a${inner},${inner} 0 1,0 ${inner * 2},0 a${inner},${inner} 0 1,0 ${inner * -2},0 Z`;
        return `<path d="${ring}" fill="${color}" fill-rule="evenodd"${button(point)}>${part}</path>`;
      }
      const arc = sweep > Math.PI ? 1 : 0;
      const center = inner ? `L${coordinate(angle, inner)} A${inner},${inner} 0 ${arc},0 ${coordinate(start, inner)}` : "L100,88";
      return `<path d="M${coordinate(start)} A78,78 0 ${arc},1 ${coordinate(angle)} ${center} Z"
        fill="${color}"${button(point)}>${part}</path>`;
    }).join("");
    return `<div style="max-width:19rem;margin:auto">${plot(200, 176, slices)}</div>`;
  }
  const valueAxis = widget.kind === "bar" ? "X" : "Y";
  const guides = lines.filter((line2) => line2.axis === valueAxis).map((line2) => line2.value);
  const minimum = Math.min(0, ...guides, ...visible.map((point) => point.value));
  const maximum = Math.max(0, ...guides, ...visible.map((point) => point.value));
  const scale = Math.max(Math.abs(minimum), Math.abs(maximum)) || 1;
  const fraction = (value) => (value / scale - minimum / scale) / (maximum / scale - minimum / scale || 1);
  if (widget.kind === "bar") {
    const categories = /* @__PURE__ */ new Map();
    const scaleX2 = (value) => 152 + fraction(value) * 234;
    const baseline2 = scaleX2(0);
    const slot = legend.size ? 13 : 25;
    const block = legend.size ? 14 + (Math.max(...legend.keys()) + 1) * slot : slot;
    const bars = visible.map((point, index) => {
      const first = !point.series || !categories.has(point.label);
      if (first && point.series) categories.set(point.label, categories.size);
      const position = point.series ? categories.get(point.label) : index;
      const y2 = position * block + (point.series ? 14 + point.series.index * slot : 8);
      const x2 = scaleX2(point.value);
      const label = first ? `<text x="4" y="${point.series ? position * block + 11 : y2 + 12}" fill="currentColor" font-size="10">${escapeHtml(point.label.slice(0, 23))}</text>` : "";
      return `<g${button(point)}>${title(point)}${label}
        <rect x="${Math.min(x2, baseline2)}" y="${y2}" width="${Math.max(Math.abs(x2 - baseline2), 1)}" height="${point.series ? 11 : 15}" fill="${palette[point.series?.index ?? 0]}"/></g>`;
    }).join("");
    const height = (legend.size ? categories.size : visible.length) * block + 10;
    return plot(398, height, `<line x1="${baseline2}" x2="${baseline2}" y1="0" y2="${height}" stroke="currentColor" opacity=".4"/>${bars}${referenceMarks(lines, "X", scaleX2, 0, height)}`);
  }
  const xGuides = widget.kind === "scatter" ? lines.filter((line2) => line2.axis === "X").map((line2) => line2.value) : [];
  const minX = Math.min(...xGuides, ...visible.map((point) => point.x));
  const maxX = Math.max(...xGuides, ...visible.map((point) => point.x));
  const xScale = Math.max(Math.abs(minX), Math.abs(maxX)) || 1;
  const scaleX = (value) => 28 + 336 * (value / xScale - minX / xScale) / (maxX / xScale - minX / xScale || 1);
  const x = (point) => scaleX(point.x);
  const scaleY = (value) => 145 - 120 * fraction(value);
  const y = (point) => widget.kind === "timeline" ? 85 : scaleY(point.value);
  const maximumSize = Math.max(0, ...visible.map((point) => point.size ?? 0));
  const marks = visible.map((point) => {
    const radius = widget.kind === "scatter" && point.size !== void 0 && maximumSize > 0 ? Math.sqrt(9 + 135 * Math.max(0, point.size) / maximumSize) : 5;
    return `<circle cx="${x(point)}" cy="${y(point)}" r="${radius}" fill="${palette[0]}"${button(point)}>${title(point)}</circle>`;
  }).join("");
  const line = widget.kind === "line" ? `<polyline points="${visible.map((point) => `${x(point)},${y(point)}`).join(" ")}"
    fill="none" stroke="${palette[0]}" stroke-width="2"/>` : "";
  const baseline = widget.kind === "timeline" ? 85 : 145 - 120 * fraction(0);
  const reference = widget.kind === "scatter" ? referenceMarks(lines, "X", scaleX, 18, 145) + referenceMarks(lines, "Y", scaleY, 28, 364) : "";
  return plot(390, 166, `<line x1="25" x2="367" y1="${baseline}" y2="${baseline}" stroke="currentColor" opacity=".4"/>
    ${line}${marks}${reference}<text x="28" y="159" fill="currentColor" font-size="10">${escapeHtml(widget.kind === "scatter" ? format(minX) : (visible[0]?.label ?? "").slice(0, 20))}</text>
    <text x="364" y="159" text-anchor="end" fill="currentColor" font-size="10">${escapeHtml(widget.kind === "scatter" ? format(maxX) : (visible[visible.length - 1]?.label ?? "").slice(0, 20))}</text>`);
}
function timeValue(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value)) return void 0;
  const day = value.slice(0, 10);
  const midnight = new Date(day);
  if (!Number.isFinite(midnight.getTime()) || midnight.toISOString().slice(0, 10) !== day) return void 0;
  return Date.parse(value);
}
function dateDetail(timestamp) {
  const iso = new Date(timestamp).toISOString();
  return iso.endsWith("T00:00:00.000Z") ? iso.slice(0, 10) : iso.replace(".000Z", "Z");
}
function renderTimeSeries(kind, points, pointAction, pointTitle, lines, axisLabel) {
  const left = 58;
  const right = 378;
  const top = 15;
  const bottom = 139;
  const first = points[0].x;
  const last = points[points.length - 1].x;
  const span = last - first;
  const guides = lines.filter((line) => line.axis === "Y").map((line) => line.value);
  const low = Math.min(0, ...guides, ...points.map((point) => point.value));
  const high = Math.max(0, ...guides, ...points.map((point) => point.value));
  const scale = Math.max(Math.abs(low), Math.abs(high)) || 1;
  const valueSpan = high / scale - low / scale;
  const x = (timestamp) => span ? left + (right - left) * (timestamp - first) / span : (left + right) / 2;
  const y = (value) => valueSpan ? bottom - (bottom - top) * (value / scale - low / scale) / valueSpan : (bottom + top) / 2;
  const baseline = y(0);
  const color = kind === "area" ? palette[1] : kind === "step" ? palette[3] : palette[0];
  const plotted = points.map((point) => ({ point, x: x(point.x), y: y(point.value) }));
  const ticks = span > 0 ? [first, first + span / 2, last] : [first];
  const timeAxis = ticks.map((tick, index) => {
    const label = new Date(tick).toISOString();
    const display = span > 0 && span < 864e5 ? label.slice(11, span < 1e3 ? 23 : span < 6e4 ? 19 : 16) : label.slice(0, 10);
    const anchor = index === 0 && span ? "start" : index === 2 ? "end" : "middle";
    return `<line x1="${x(tick)}" x2="${x(tick)}" y1="${top}" y2="${bottom}" stroke="currentColor" opacity=".12"/>
      <text x="${x(tick)}" y="157" text-anchor="${anchor}" fill="currentColor" font-size="10">${escapeHtml(display)}</text>`;
  }).join("");
  const valueAxis = [.../* @__PURE__ */ new Set([low, 0, high])].map((value) => {
    const absolute = Math.abs(value);
    const label = absolute >= 1e6 || absolute > 0 && absolute < 1e-3 ? value.toExponential(1) : format(value);
    return `<line x1="${left}" x2="${right}" y1="${y(value)}" y2="${y(value)}" stroke="currentColor" opacity="${value === 0 ? 0.4 : 0.18}"/>
      <text x="${left - 8}" y="${y(value) + 3}" text-anchor="end" fill="currentColor" font-size="10">${escapeHtml(label)}</text>`;
  }).join("");
  let data;
  if (kind === "time-column") {
    const seriesCount = Math.max(0, ...points.map((point) => point.series ? point.series.index + 1 : 0));
    const groups = /* @__PURE__ */ new Map();
    for (const mark of plotted) {
      const group = groups.get(mark.x) ?? [];
      group.push(mark);
      groups.set(mark.x, group);
    }
    const ordered = [...groups.entries()];
    data = ordered.map(([center, group], index) => {
      const previous = ordered[index - 1]?.[0] ?? -Infinity;
      const next = ordered[index + 1]?.[0] ?? Infinity;
      const width = Math.min(26, 0.75 * Math.min(center - previous, next - center));
      const slot = width / (seriesCount || group.length);
      return group.map(({ point, y: end }, position) => `<rect x="${center - width / 2 + slot * (point.series?.index ?? position)}" y="${Math.min(end, baseline)}" width="${slot * 0.88}"
          height="${Math.max(1, Math.abs(end - baseline))}" fill="${point.series ? palette[point.series.index] : point.value < 0 ? "#b74757" : color}"${pointAction(point)}>${pointTitle(point)}</rect>`).join("");
    }).join("");
  } else {
    const path = plotted.map((point, index) => index === 0 ? `M ${point.x} ${point.y}` : kind === "step" ? `H ${point.x} V ${point.y}` : `L ${point.x} ${point.y}`).join(" ");
    const area = kind === "area" ? `<path d="${path} L ${x(last)} ${baseline} L ${x(first)} ${baseline} Z" fill="${color}" fill-opacity=".2"/>` : "";
    const markers = plotted.map(({ point, x: cx, y: cy }) => `<circle cx="${cx}" cy="${cy}" r="4" fill="${color}"${pointAction(point)}>${pointTitle(point)}</circle>`).join("");
    data = `${area}<path d="${path}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round"/>${markers}`;
  }
  return `${timeAxis}${valueAxis}${data}${referenceMarks(lines, "Y", y, left, right)}<text x="418" y="170" text-anchor="end" fill="currentColor" font-size="9">${escapeHtml(axisLabel ?? "UTC")}</text>`;
}
function renderBinnedHistogram(points, width, action, title, lines) {
  const xValues = [
    ...points.flatMap((point) => [point.x, point.x + width]),
    ...lines.filter((line) => line.axis === "X").map((line) => line.value)
  ];
  const minimum = Math.min(...xValues);
  const maximum = Math.max(...xValues);
  const scale = Math.max(Math.abs(minimum), Math.abs(maximum)) || 1;
  const range = maximum / scale - minimum / scale || 1;
  const x = (value) => 30 + (value / scale - minimum / scale) / range * 330;
  const low = Math.min(0, ...lines.filter((line) => line.axis === "Y").map((line) => line.value));
  const high = Math.max(1, ...points.map((point) => point.value), ...lines.filter((line) => line.axis === "Y").map((line) => line.value));
  const heightScale = Math.max(Math.abs(low), high);
  const y = (value) => 138 - (value / heightScale - low / heightScale) / (high / heightScale - low / heightScale) * 116;
  const bars = points.map((point) => `<rect x="${x(point.x)}" y="${y(point.value)}" width="${Math.max(1, x(point.x + width) - x(point.x) - 1)}" height="${y(0) - y(point.value)}" fill="${palette[0]}"${action(point)}>${title(point)}</rect>`).join("");
  return `<line x1="30" x2="360" y1="${y(0)}" y2="${y(0)}" stroke="currentColor" opacity=".4"/>${bars}
    ${referenceMarks(lines, "X", x, 16, 138)}${referenceMarks(lines, "Y", y, 30, 360)}
    <text x="30" y="155" fill="currentColor" font-size="10">${format(minimum)}</text>
    <text x="360" y="155" text-anchor="end" fill="currentColor" font-size="10">${format(maximum)}</text>`;
}
function renderHistogram(widget, points) {
  const minimum = points.reduce((value, point) => Math.min(value, point.value), Infinity);
  const maximum = points.reduce((value, point) => Math.max(value, point.value), -Infinity);
  const scale = Math.max(Math.abs(minimum), Math.abs(maximum)) || 1;
  const low = minimum / scale;
  const span = maximum / scale - low;
  const size = span ? Math.min(12, Math.ceil(Math.sqrt(points.length))) : 1;
  const bins = Array(size).fill(0);
  for (const point of points) {
    const index = span ? Math.floor((point.value / scale - low) / span * size) : 0;
    bins[Math.max(0, Math.min(size - 1, index))]++;
  }
  const peak = Math.max(...bins);
  const width = 340 / size;
  const edge = (index) => format((low + span * index / size) * scale);
  const labels = bins.map((count, index) => `${edge(index)}${size === 1 ? "" : `\u2013${edge(index + 1)}`}: ${count} ${count === 1 ? "observation" : "observations"}`);
  const bars = bins.map((count, index) => {
    const height = count / peak * 110;
    return `<rect x="${25 + index * width}" y="${132 - height}" width="${width - 2}" height="${height}" rx="2" fill="${palette[0]}">
      <title>${escapeHtml(labels[index])}</title></rect>`;
  }).join("");
  return `<svg aria-label="${escapeHtml(widget.label)}" viewBox="0 0 390 155" style="display:block;width:100%;height:auto;color:inherit">
    <line x1="25" x2="365" y1="132" y2="132" stroke="currentColor" opacity=".4"/>${bars}
    <text x="25" y="149" fill="currentColor" font-size="10">${escapeHtml(format(minimum))}</text>
    ${size > 1 ? `<text x="365" y="149" text-anchor="end" fill="currentColor" font-size="10">${escapeHtml(format(maximum))}</text>` : ""}</svg>
    <details><summary>Distribution data</summary><ul>${labels.map((label) => `<li>${escapeHtml(label)}</li>`).join("")}</ul></details>`;
}
var mounted = /* @__PURE__ */ new WeakMap();
function mountReporting(container, definition, emit) {
  mounted.get(container)?.();
  const session = { state: /* @__PURE__ */ new Map(), bindings: /* @__PURE__ */ new Map() };
  const render = (focus) => {
    const key = focus?.getAttribute("data-report-focus");
    const selection = focus && "selectionStart" in focus ? focus.selectionStart : null;
    session.bindings.clear();
    container.innerHTML = renderNode(definition, initialContext, session, "0", 0);
    if (!key) return;
    const next = [...container.querySelectorAll("[data-report-focus]")].find((element) => element.getAttribute("data-report-focus") === key);
    next?.focus();
    if (selection !== null && next?.matches('input[type="search"]')) next.setSelectionRange(selection, selection);
  };
  const listener = (event) => {
    const origin = event.target;
    const target = origin?.closest?.("[data-report-command]");
    const path = target?.closest("[data-report-path]")?.getAttribute("data-report-path");
    const binding = path ? session.bindings.get(path) : void 0;
    if (!target || !binding || !container.contains(target)) return;
    const command = target.dataset.reportCommand;
    const isButton = target.tagName === "BUTTON";
    const keyboard = event.type === "keydown" && command === "point" && ["Enter", " "].includes(event.key);
    const eventType = command === "search" ? "input" : isButton || command === "point" || command === "activate" ? "click" : "change";
    if (event.type !== eventType && !keyboard) return;
    if (keyboard) event.preventDefault();
    const input = target;
    const { widget, context, state, rows, columns } = binding;
    const source = context.settings.dataSource;
    const field = target.dataset.field;
    const row = rows.find((entry) => entry.index === Number(target.dataset.row));
    let payload;
    switch (command) {
      case "filter": {
        const field2 = widget.filterField;
        if (!field2) return;
        const values = [...new Set(rows.map((entry) => cell(entry, field2)))];
        state.filter = input.value === "" ? void 0 : values[Number(input.value)];
        payload = { kind: "filter", source, field: field2, value: state.filter ?? null, active: state.filter !== void 0 };
        break;
      }
      case "point": {
        if (!row) return;
        state.selected.clear();
        state.selected.add(row.index);
        target.closest("[data-report-path]")?.querySelector('[data-report-command="point"][aria-pressed="true"]')?.setAttribute("aria-pressed", "false");
        target.setAttribute("aria-pressed", "true");
        const aggregate = binding.chartGroups?.get(row.index);
        if (widget.action) emit?.(widget.action, aggregate ? { kind: "select", source, rowIndices: [...aggregate.rowIndices], group: { field: aggregate.field, value: aggregate.value } } : { kind: "select", source, rowIndices: [row.index], row: row.values });
        return;
      }
      case "activate":
        if (row && widget.action && (isButton || !origin?.closest("button, input, select, label, a, textarea, summary, [contenteditable]"))) {
          emit?.(widget.action, { kind: "activate", source, rowIndex: row.index, row: row.values });
        }
        return;
      case "search":
        state.search = input.value;
        state.page = 0;
        break;
      case "sort":
        state.descending = state.sort === field && !state.descending;
        state.sort = field;
        state.page = 0;
        break;
      case "group":
        state.group = input.value;
        state.page = 0;
        break;
      case "column":
        if (!field) return;
        if (input.checked) state.hidden.delete(field);
        else state.hidden.add(field);
        state.page = 0;
        break;
      case "previous":
        state.page = Math.max(state.page - 1, 0);
        break;
      case "next":
        state.page += 1;
        break;
      case "page-size":
        if (![10, 25, 50, 100].includes(Number(input.value))) return;
        state.size = Number(input.value);
        state.page = 0;
        break;
      case "select":
        if (!row) return;
        if (input.checked) state.selected.add(row.index);
        else state.selected.delete(row.index);
        payload = { kind: "select", source, rowIndices: [...state.selected], row: row.values };
        break;
      case "select-page": {
        const page = Array.from(target.closest("table")?.querySelectorAll('[data-report-command="select"]') ?? []);
        for (const checkbox of page) {
          const index = Number(checkbox.dataset.row);
          if (input.checked) state.selected.add(index);
          else state.selected.delete(index);
        }
        payload = { kind: "select", source, rowIndices: [...state.selected] };
        break;
      }
      case "edit": {
        if (!row || !field || !columns.some((column) => column.field === field && column.editable)) return;
        const value = input.type === "number" ? input.value === "" ? null : input.valueAsNumber : input.value;
        if (typeof value === "number" && !Number.isFinite(value)) return;
        state.edits.set(row.index, { ...row.values, [field]: value });
        payload = { kind: "edit", source, rowIndex: row.index, field, value };
        break;
      }
      case "export": {
        const visible = columns.filter((column) => !state.hidden.has(column.field));
        downloadCsv(container, visible, tableRows(rows, visible, state));
        return;
      }
      default:
        return;
    }
    render(target);
    if (payload && widget.action) emit?.(widget.action, payload);
  };
  const events = ["click", "change", "input", "keydown"];
  events.forEach((event) => container.addEventListener(event, listener));
  const dispose = () => {
    events.forEach((event) => container.removeEventListener(event, listener));
    if (mounted.get(container) === dispose) mounted.delete(container);
  };
  mounted.set(container, dispose);
  render();
  return dispose;
}
function csvCell(value) {
  const raw = text(value);
  const neutral = typeof value === "string" && (/^[\s\uFEFF]*[=+\-@]/.test(raw) || /^[\t\r\n]/.test(raw)) ? "'" + raw : raw;
  return '"' + neutral.replace(/"/g, '""') + '"';
}
function downloadCsv(container, columns, rows) {
  const csv = [
    columns.map((col) => csvCell(col.label)).join(","),
    ...rows.map((row) => columns.map((col) => csvCell(cell(row, col.field))).join(","))
  ].join("\r\n");
  const document = container.ownerDocument;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "report.csv";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

// src/reporting/blazor.ts
var disposers = /* @__PURE__ */ new WeakMap();
function mount(element, json, callback) {
  unmount(element);
  const definition = JSON.parse(json);
  disposers.set(element, mountReporting(
    element,
    definition,
    (action, payload) => {
      void callback.invokeMethodAsync("DispatchReportAction", action, payload);
    }
  ));
}
function unmount(element) {
  disposers.get(element)?.();
  disposers.delete(element);
}
export {
  mount,
  unmount
};
