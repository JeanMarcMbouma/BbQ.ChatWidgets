import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { reportingQueryKey } from "@bbq-chat/widgets";
import type {
  ReportingClient,
  ReportingColumn,
  ReportingField,
  ReportingGridPage,
  ReportingGridPageRequest,
  ReportingGridRow,
  ReportingGridRowActivation,
  ReportingQuery,
} from "@bbq-chat/widgets";

export interface PagedReportingGridProps {
  client: Pick<ReportingClient, "page">;
  title: string;
  query: ReportingQuery;
  dimension: ReportingField;
  onRowActivate?: (activation: ReportingGridRowActivation) => void;
  onSelectionChange?: (keys: readonly string[]) => void;
}

const defaultColumns: readonly ReportingColumn[] = [
  { field: "label", label: "Label" },
  { field: "value", label: "Value" },
];
const controls = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: ".5rem 1rem",
} as const;
const formatCount = new Intl.NumberFormat().format;
const maxOffset = 1_000_000;

/** A reporting grid that fetches bounded pages from the host's reporting API. */
export function PagedReportingGrid(props: PagedReportingGridProps) {
  const [scope, setScope] = useState({ client: props.client, generation: 0 });
  const hasSelection = useRef(false);
  const selectionChange = useRef(props.onSelectionChange);
  selectionChange.current = props.onSelectionChange;
  const key = JSON.stringify([scope.generation, reportingQueryKey(props.query), props.dimension.id]);
  useEffect(() => {
    if (hasSelection.current) {
      hasSelection.current = false;
      selectionChange.current?.([]);
    }
  }, [key]);
  if (scope.client !== props.client) {
    setScope({ client: props.client, generation: scope.generation + 1 });
    return null;
  }
  return <PagedGrid key={key} {...props} onSelectionChange={keys => {
    hasSelection.current = keys.length > 0;
    selectionChange.current?.(keys);
  }} />;
}

function PagedGrid({
  client, title, query, dimension, onRowActivate, onSelectionChange,
}: PagedReportingGridProps) {
  const [request, setRequest] = useState<ReportingGridPageRequest>({ query, offset: 0, limit: 25 });
  const [completed, setCompleted] = useState<{
    client: PagedReportingGridProps["client"];
    request: ReportingGridPageRequest;
    page?: ReportingGridPage;
    error?: string;
  }>();
  const [search, setSearch] = useState("");
  const [filterField, setFilterField] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [selected, setSelected] = useState(new Set<string>());
  const current = completed?.client === client ? completed : undefined;
  const page = current?.page;
  const visibleRequest = current?.request ?? request;
  const loading = current?.request !== request;
  const error = loading ? undefined : current?.error;
  const columns = dimension.columns ?? defaultColumns;
  const filterColumns = columns.filter(column => dimension.grid?.filterFields.includes(column.field));
  const canSearch = Boolean(dimension.grid?.searchFields.length);
  const pageSelected = Boolean(page?.rows.length && page.rows.every(entry => selected.has(entry.key)));

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      const result = await client.page(request, controller.signal);
      if (controller.signal.aborted) return;
      if (request.offset > 0 && request.offset >= result.total) {
        const offset = Math.max(0, Math.ceil(result.total / request.limit) - 1) * request.limit;
        setRequest({ ...request, offset });
        return;
      }
      setCompleted({ client, request, page: result });
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) {
        setCompleted({ client, request, error: cause instanceof Error && cause.message ? cause.message : "Could not load this grid page." });
      }
    });
    return () => controller.abort();
  }, [client, request]);

  function updateSelection(keys: readonly string[], checked: boolean) {
    const next = new Set(selected);
    for (const key of keys) {
      if (checked) next.add(key);
      else next.delete(key);
    }
    setSelected(next);
    onSelectionChange?.([...next]);
  }

  function activate(entry: ReportingGridRow) {
    if (!loading) onRowActivate?.({ kind: "activate", rowKey: entry.key, row: entry.row });
  }

  function onRowClick(event: MouseEvent<HTMLTableRowElement>, entry: ReportingGridRow) {
    if (event.target instanceof Element &&
      event.target.closest("a, button, input, select, textarea, label, [contenteditable]")) return;
    activate(entry);
  }

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequest({
      ...request,
      offset: 0,
      search: search.trim() || undefined,
      filters: filterField && filterValue.trim() ? [{ field: filterField, value: filterValue.trim() }] : undefined,
    });
    if (selected.size) updateSelection([...selected], false);
  }

  function sort(field: string) {
    setRequest({
      ...request,
      offset: 0,
      sortField: field,
      descending: field === request.sortField && !request.descending,
    });
  }

  return (
    <section className="bbq-paged-reporting-grid" aria-label={title} aria-busy={loading}>
      <header style={controls}>
        <h3>{title}</h3>
        {selected.size > 0 && <>
          <span role="status">{formatCount(selected.size)} selected</span>
          <button type="button" onClick={() => updateSelection([...selected], false)}>Clear selection</button>
        </>}
      </header>
      {(canSearch || filterColumns.length > 0) && (
        <form className="bbq-paged-reporting-grid__controls" style={controls} onSubmit={apply}>
          {canSearch && <label>Search <input type="search" maxLength={160} value={search}
            onChange={event => setSearch(event.target.value)} /></label>}
          {filterColumns.length > 0 && <label>Filter field <select value={filterField}
            onChange={event => { setFilterField(event.target.value); setFilterValue(""); }}>
            <option value="">None</option>
            {filterColumns.map(column => <option key={column.field} value={column.field}>{column.label}</option>)}
          </select></label>}
          {filterField && <label>Exact value <input maxLength={160} value={filterValue}
            onChange={event => setFilterValue(event.target.value)} /></label>}
          <button type="submit" disabled={loading}>Apply</button>
        </form>
      )}
      {loading && <p role="status">Loading rows.</p>}
      {error && <>
        <p role="alert">{error}</p>
        <button type="button" onClick={() => setRequest({ ...request })}>Retry</button>
      </>}
      {page && <>
        <div className="bbq-paged-reporting-grid__table-scroll" style={{ overflow: "auto", maxHeight: "31rem" }}
          tabIndex={0} role="region" aria-label={title + " table"}>
          <table style={{ width: "100%", textAlign: "start" }}>
            <thead><tr>
              <th scope="col"><input type="checkbox" aria-label="Select this page" checked={pageSelected}
                disabled={loading || !page.rows.length} onChange={event => updateSelection(page.rows.map(entry => entry.key), event.target.checked)} /></th>
              {columns.map(column => <th key={column.field} scope="col"
                aria-sort={visibleRequest.sortField === column.field ? (visibleRequest.descending ? "descending" : "ascending") : undefined}>
                {dimension.grid?.sortFields.includes(column.field)
                  ? <button type="button" disabled={loading} onClick={() => sort(column.field)}>{column.label}</button>
                  : column.label}
              </th>)}
              {onRowActivate && <th scope="col">Actions</th>}
            </tr></thead>
            <tbody>
              {page.rows.map(entry => <tr key={entry.key}
                className={selected.has(entry.key) ? "is-selected" : undefined}
                onClick={onRowActivate ? event => onRowClick(event, entry) : undefined}>
                <td><input type="checkbox" aria-label={"Select " + entry.row.label} checked={selected.has(entry.key)}
                  disabled={loading} onChange={event => updateSelection([entry.key], event.target.checked)} /></td>
                {columns.map(column => <td key={column.field}>{cell(entry, column.field)}</td>)}
                {onRowActivate && <td><button type="button" aria-label={"View " + entry.row.label}
                  disabled={loading} onClick={() => activate(entry)}>View</button></td>}
              </tr>)}
              {!page.rows.length && <tr><td colSpan={columns.length + (onRowActivate ? 2 : 1)}>No matching rows.</td></tr>}
            </tbody>
          </table>
        </div>
        <footer className="bbq-paged-reporting-grid__pager" style={controls}>
          <span role="status">{page.rows.length
            ? `${formatCount(visibleRequest.offset + 1)}–${formatCount(visibleRequest.offset + page.rows.length)} of ${formatCount(page.total)}`
            : "0 results"}</span>
          <nav aria-label="Grid pagination" style={controls}>
            <button type="button" disabled={loading || !request.offset}
              onClick={() => setRequest({ ...request, offset: request.offset - request.limit })}>Previous</button>
            {page.total > 0 && <span>Page {formatCount(Math.floor(visibleRequest.offset / visibleRequest.limit) + 1)} of {formatCount(Math.ceil(page.total / visibleRequest.limit))}</span>}
            <button type="button" disabled={loading || request.offset + request.limit >= page.total || request.offset + request.limit > maxOffset}
              onClick={() => setRequest({ ...request, offset: request.offset + request.limit })}>Next</button>
          </nav>
          <label>Rows per page <select value={request.limit} disabled={loading}
            onChange={event => setRequest({ ...request, limit: Number(event.target.value), offset: 0 })}>
            {[10, 25, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
          </select></label>
        </footer>
      </>}
    </section>
  );
}

function cell(entry: ReportingGridRow, field: string): string | number {
  const value = field === "label" || field === "value" ? entry.row[field] : entry.row.fields?.[field];
  return typeof value === "boolean" ? String(value) : value ?? "";
}
