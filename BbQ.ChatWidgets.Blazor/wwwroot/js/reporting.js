// Generated from js/src/reporting by npm run build:reporting.

// src/reporting/types.ts
var reportingKinds = ["dashboard", "filter", "bar", "line", "pie", "timeline", "scatter", "table", "grid", "metric"];

// src/reporting/engine.ts
var initialContext = { settings: {}, sources: {}, filters: [] };
var palette = ["#2366ba", "#147c68", "#a45c16", "#883fa1", "#ae3c59", "#467336", "#5968a5", "#9b5f55"];
var chartLimit = 60;
var escape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
var own = (record, key) => key && Object.prototype.hasOwnProperty.call(record, key) ? record[key] : void 0;
var cell = (row, field) => own(row.values, field) ?? null;
var text = (value) => String(value ?? "");
var number = (value) => typeof value === "number" && Number.isFinite(value) ? value : void 0;
var formatter = new Intl.NumberFormat("en", { maximumFractionDigits: 4 });
var format = (value) => formatter.format(value);
var control = (path, id) => `data-report-focus="${escape(path + ":" + id)}"`;
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
  return `<section class="bbq-report bbq-report-${widget.kind}" data-report-path="${path}" style="min-width:0">
    <h3>${escape(widget.label)}</h3>${body}</section>`;
}
function renderNode(widget, parent, session, path, depth) {
  if (!widget || !reportingKinds.includes(widget.kind) || depth > 12) return "";
  const context = settingsFor(widget, parent);
  const state = stateFor(session, path, widget.pageSize);
  const rows = widget.kind === "dashboard" ? [] : getRows(widget, context, state);
  const columns = widget.kind === "grid" || widget.kind === "table" ? getColumns(context, rows) : [];
  session.bindings.set(path, { widget, context, rows, columns, state });
  if (widget.error) return section(widget, path, `<p role="alert">${escape(widget.error)}</p>`);
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
    const options = choices.map((value, index) => `<option value="${index}"${value === state.filter ? " selected" : ""}>${escape(text(value) || "(blank)")}</option>`).join("");
    return section(widget, path, `<label>Filter by ${escape(widget.filterField)}
      <select data-report-command="filter" ${control(path, "filter")}><option value="">All</option>${options}</select></label>`);
  }
  if (widget.kind === "table" || widget.kind === "grid") return section(widget, path, renderTable(widget.kind, path, rows, columns, state, context.settings.groupBy));
  if (rows.length === 0) return section(widget, path, "<p>No results.</p>");
  if (widget.kind === "metric") {
    const values = rows.flatMap((row) => number(cell(row, context.settings.valueField ?? "value")) ?? []);
    const total = values.reduce((sum, value) => sum + value, 0);
    return section(widget, path, `<p><strong>${Number.isFinite(total) && values.length ? format(total) : "\u2014"}</strong></p>`);
  }
  return section(widget, path, renderChart(widget, rows, context.settings, state.selected));
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
function renderTable(kind, path, rows, columns, state, defaultGroup) {
  const grid = kind === "grid";
  const visible = columns.filter((column) => !state.hidden.has(column.field));
  const matching = grid ? tableRows(rows, visible, state) : rows;
  const field = state.group ?? defaultGroup ?? "";
  const ordered = field && grid ? [...matching].sort((a, b) => compare(cell(a, field), cell(b, field))) : matching;
  const lastPage = Math.max(0, Math.ceil(ordered.length / state.size) - 1);
  state.page = Math.min(state.page, lastPage);
  const page = grid ? ordered.slice(state.page * state.size, (state.page + 1) * state.size) : ordered;
  const columnOptions = columns.map((col) => `<label style="display:block"><input type="checkbox" data-report-command="column"
    data-field="${escape(col.field)}" ${control(path, "column:" + col.field)}${state.hidden.has(col.field) ? "" : " checked"}> ${escape(col.label)}</label>`).join("");
  const groupOptions = columns.map((col) => `<option value="${escape(col.field)}"${field === col.field ? " selected" : ""}>${escape(col.label)}</option>`).join("");
  const tools = grid ? `<div style="display:flex;flex-wrap:wrap;gap:.55rem;align-items:baseline">
    <label>Search <input type="search" data-report-command="search" ${control(path, "search")} value="${escape(state.search)}"></label>
    <label>Group by <select data-report-command="group" ${control(path, "group")}><option value="">None</option>${groupOptions}</select></label>
    <details${state.hidden.size ? " open" : ""}><summary>Columns</summary>${columnOptions}</details>
    <button type="button" data-report-command="export" ${control(path, "export")}>Export CSV</button>
    <span role="status">${state.selected.size} selected</span></div>` : "";
  const heading = visible.map((col) => {
    const sort = state.sort === col.field ? state.descending ? "descending" : "ascending" : "none";
    return grid ? `<th scope="col" aria-sort="${sort}"><button type="button" data-report-command="sort" data-field="${escape(col.field)}" ${control(path, "sort:" + col.field)}>${escape(col.label)}</button></th>` : `<th scope="col">${escape(col.label)}</th>`;
  }).join("");
  const body = page.map((row, index) => {
    const group = field && grid && (index === 0 || cell(row, field) !== cell(page[index - 1], field)) ? `<tr><th scope="rowgroup" colspan="${visible.length + 1}">${escape(text(cell(row, field)) || "(blank)")}</th></tr>` : "";
    const select = grid ? `<td><input type="checkbox" aria-label="Select row ${row.index + 1}" data-report-command="select"
      data-row="${row.index}" ${control(path, "row:" + row.index)}${state.selected.has(row.index) ? " checked" : ""}></td>` : "";
    const cells = visible.map((col) => {
      const value = cell(row, col.field);
      const edit = grid && col.editable && typeof value !== "boolean" ? `<input aria-label="${escape(col.label)} row ${row.index + 1}" type="${typeof value === "number" ? "number" : "text"}" step="any"
          data-report-command="edit" data-row="${row.index}" data-field="${escape(col.field)}"
          ${control(path, "edit:" + row.index + ":" + col.field)} value="${escape(text(value))}">` : escape(text(value));
      return `<td style="padding:.25rem .45rem">${edit}</td>`;
    }).join("");
    return `${group}<tr>${select}${cells}</tr>`;
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
  return `${tools}<div style="overflow:auto"><table style="width:100%;text-align:left"><thead><tr>${selectAll}${heading}</tr></thead>
    <tbody>${body}</tbody></table></div>${page.length ? "" : "<p>No results.</p>"}${pager}`;
}
function renderChart(widget, rows, settings, selection) {
  const points = [];
  const byGroup = /* @__PURE__ */ new Map();
  rows.forEach((row, index) => {
    const value = number(cell(row, settings.valueField ?? "value")) ?? (widget.kind === "timeline" ? 0 : void 0);
    if (value === void 0 || widget.kind === "pie" && value <= 0) return;
    const label = text(cell(row, settings.groupBy ?? settings.categoryField ?? "label")) || "(blank)";
    const date = cell(row, settings.dateField ?? "date");
    const x2 = widget.kind === "timeline" ? typeof date === "string" ? Date.parse(date) : NaN : widget.kind === "scatter" ? number(cell(row, settings.xField ?? "x")) : index;
    if (x2 === void 0 || !Number.isFinite(x2)) return;
    if (settings.groupBy && ["bar", "line", "pie"].includes(widget.kind)) {
      const point = byGroup.get(label);
      if (point) point.value += value;
      else byGroup.set(label, { label, value, x: byGroup.size, index: void 0 });
    } else {
      points.push({ label, value, x: x2, index: row.index });
    }
  });
  points.push(...[...byGroup.values()].filter((point) => Number.isFinite(point.value)));
  if (widget.kind === "timeline") points.sort((a, b) => a.x - b.x);
  if (!points.length) return "<p>No plottable values.</p>";
  const visible = points.slice(0, chartLimit);
  const detail = (point) => `${point.label}: ${format(point.value)}${widget.kind === "scatter" ? ` (x ${format(point.x)})` : ""}${widget.kind === "timeline" ? ` (${new Date(point.x).toISOString().slice(0, 10)})` : ""}`;
  const button = (point) => point.index === void 0 ? "" : ` role="button" tabindex="0" data-report-command="point" data-row="${point.index}" aria-pressed="${selection.has(point.index)}" aria-label="${escape(detail(point))}"`;
  const title = (point) => `<title>${escape(detail(point))}</title>`;
  const summary = `<details><summary>Chart data</summary><ul>${visible.map((point) => `<li>${escape(detail(point))}</li>`).join("")}</ul></details>`;
  const plot = (w, h, body) => `<svg aria-label="${escape(widget.label)}" viewBox="0 0 ${w} ${h}"
    style="display:block;width:100%;height:auto;color:inherit">${body}</svg>${summary}${visible.length < points.length ? `<p>Showing ${visible.length} of ${points.length} points.</p>` : ""}`;
  if (widget.kind === "pie") {
    const peak = Math.max(...visible.map((point) => point.value));
    const denominator = visible.reduce((sum, point) => sum + point.value / peak, 0);
    let angle = -Math.PI / 2;
    const coordinate = (angle2) => `${100 + Math.cos(angle2) * 78},${88 + Math.sin(angle2) * 78}`;
    const slices = visible.map((point, index) => {
      const sweep = point.value / peak / denominator * 2 * Math.PI;
      const start = coordinate(angle);
      angle += sweep;
      const color = palette[index % palette.length];
      if (sweep >= 2 * Math.PI - 1e-10) {
        return `<circle cx="100" cy="88" r="78" fill="${color}"${button(point)}>${title(point)}</circle>`;
      }
      return `<path d="M100,88 L${start} A78,78 0 ${sweep > Math.PI ? 1 : 0},1 ${coordinate(angle)} Z"
        fill="${color}"${button(point)}>${title(point)}</path>`;
    }).join("");
    return `<div style="max-width:19rem;margin:auto">${plot(200, 176, slices)}</div>`;
  }
  const minimum = Math.min(0, ...visible.map((point) => point.value));
  const maximum = Math.max(0, ...visible.map((point) => point.value));
  const scale = Math.max(Math.abs(minimum), Math.abs(maximum)) || 1;
  const fraction = (value) => (value / scale - minimum / scale) / (maximum / scale - minimum / scale || 1);
  if (widget.kind === "bar") {
    const height = visible.length * 25 + 10;
    const baseline2 = 152 + fraction(0) * 234;
    const bars = visible.map((point, index) => {
      const y2 = index * 25 + 8;
      const x2 = 152 + fraction(point.value) * 234;
      return `<g${button(point)}>${title(point)}<text x="4" y="${y2 + 12}" fill="currentColor" font-size="10">${escape(point.label.slice(0, 23))}</text>
        <rect x="${Math.min(x2, baseline2)}" y="${y2}" width="${Math.max(Math.abs(x2 - baseline2), 1)}" height="15" fill="${palette[0]}"/></g>`;
    }).join("");
    return plot(398, height, `<line x1="${baseline2}" x2="${baseline2}" y1="0" y2="${height}" stroke="currentColor" opacity=".4"/>${bars}`);
  }
  const minX = Math.min(...visible.map((point) => point.x));
  const maxX = Math.max(...visible.map((point) => point.x));
  const xScale = Math.max(Math.abs(minX), Math.abs(maxX)) || 1;
  const x = (point) => 28 + 336 * (point.x / xScale - minX / xScale) / (maxX / xScale - minX / xScale || 1);
  const y = (point) => widget.kind === "timeline" ? 85 : 145 - 120 * fraction(point.value);
  const marks = visible.map((point) => `<circle cx="${x(point)}" cy="${y(point)}" r="5" fill="${palette[0]}"${button(point)}>${title(point)}</circle>`).join("");
  const line = widget.kind === "line" ? `<polyline points="${visible.map((point) => `${x(point)},${y(point)}`).join(" ")}"
    fill="none" stroke="${palette[0]}" stroke-width="2"/>` : "";
  const baseline = widget.kind === "timeline" ? 85 : 145 - 120 * fraction(0);
  return plot(390, 166, `<line x1="25" x2="367" y1="${baseline}" y2="${baseline}" stroke="currentColor" opacity=".4"/>
    ${line}${marks}<text x="28" y="159" fill="currentColor" font-size="10">${escape(widget.kind === "scatter" ? format(minX) : (visible[0]?.label ?? "").slice(0, 20))}</text>
    <text x="364" y="159" text-anchor="end" fill="currentColor" font-size="10">${escape(widget.kind === "scatter" ? format(maxX) : (visible[visible.length - 1]?.label ?? "").slice(0, 20))}</text>`);
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
    const target = event.target?.closest?.("[data-report-command]");
    const path = target?.closest("[data-report-path]")?.getAttribute("data-report-path");
    const binding = path ? session.bindings.get(path) : void 0;
    if (!target || !binding || !container.contains(target)) return;
    const command = target.dataset.reportCommand;
    const isButton = target.tagName === "BUTTON";
    const keyboard = event.type === "keydown" && command === "point" && ["Enter", " "].includes(event.key);
    const eventType = command === "search" ? "input" : isButton || command === "point" ? "click" : "change";
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
        if (widget.action) emit?.(widget.action, { kind: "select", source, rowIndices: [row.index], row: row.values });
        return;
      }
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
