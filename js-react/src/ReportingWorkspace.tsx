import { useEffect, useMemo, useRef, useState } from "react";
import {
  applyReportingAction,
  applyReportingState,
  composeReportingSnapshot,
  pruneReportingFilters,
  reportingAvailableInputs,
  reportingEditableFilters,
  reportingWorkspaceInputs,
  resolveReportingControls,
  setReportingInput,
  withReportingFilters,
  isReportingAction,
  isReportingTimeSeriesKind,
  ReportingClient,
  reportingViews,
  type ReportingActionResolver,
  type ReportingCatalog,
  type ReportingDocument,
  type ReportingDocumentKind,
  type ReportingField,
  type ReportingFilter,
  type ReportingInput,
  type ReportingState,
  type ReportingTile,
  type ReportingView,
  type ReportingWidget,
  type ReportingWorkspaceAction,
  type SavedReportingDefinition,
} from "@bbq-chat/widgets";
import { PagedReportingGrid } from "./PagedReportingGrid.js";
import { WidgetRenderer } from "./WidgetRenderer.js";

export type ReportingWorkspaceClient = Pick<ReportingClient, "catalog" | "list" | "run" | "page" | "create" | "update" | "remove">
  & Partial<Pick<ReportingClient, "inputOptions">>;

export interface ReportingWorkspaceProps {
  client?: ReportingWorkspaceClient;
  initialPresetId?: string;
  resolveAction?: ReportingActionResolver;
  onReportingAction?: (event: ReportingWorkspaceAction) => void;
}

interface Preview {
  document: ReportingDocument;
  widget?: ReportingWidget;
  controls: ReportingInput[];
  grids: { tileIndex: number; dimension: ReportingField }[];
}

function datasetFor(catalog: ReportingCatalog, tile: ReportingTile) {
  return catalog.datasets.find(dataset => dataset.id === tile.query.dataset);
}

function newTile(catalog: ReportingCatalog): ReportingTile {
  const dataset = catalog.datasets[0];
  const defaults = catalog.presets[0]?.definition.tiles[0]?.query;
  const today = new Date().toISOString().slice(0, 10);
  return {
    title: "", view: "table",
    query: {
      dataset: dataset?.id ?? "", metric: dataset?.metrics[0]?.id ?? "", groupBy: null,
      from: defaults?.from ?? today, to: defaults?.to ?? today,
    },
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : "The reporting request failed. Try again.";
}

async function loadPreview(
  document: ReportingDocument, catalog: ReportingCatalog, client: ReportingWorkspaceClient, signal: AbortSignal,
): Promise<Preview> {
  const paged = new Set<ReportingTile>();
  const grids = document.tiles.flatMap((tile, tileIndex) => {
    const dimension = tile.view === "grid" && datasetFor(catalog, tile)?.dimensions
      .find(field => field.id === tile.query.groupBy && field.grid);
    if (!dimension) return [];
    paged.add(tile);
    return [{ tileIndex, dimension }];
  });
  const [widget, controls] = await Promise.all([
    paged.size === document.tiles.length ? undefined
      : composeReportingSnapshot(document, catalog, query => client.run(query, signal), {
        includeTile: tile => !paged.has(tile), describeError: errorMessage,
      }),
    resolveReportingControls(document, catalog, async ({ dataset, from, to }, input) => {
      try {
        return await client.inputOptions?.({ dataset, input, from, to }, signal) ?? [];
      } catch {
        return [];
      }
    }),
  ]);
  return { document, widget, controls, grids };
}

/** Catalog, viewer and authoring controls for the ChatWidgets reporting API. */
export function ReportingWorkspace({ client: suppliedClient, ...props }: ReportingWorkspaceProps) {
  const client = useMemo(() => suppliedClient ?? new ReportingClient(), [suppliedClient]);
  const [scope, setScope] = useState({ client, generation: 0 });
  if (scope.client !== client) {
    // Reset before rendering children so a new client cannot run the prior client's query.
    setScope({ client, generation: scope.generation + 1 });
    return null;
  }
  return <ReportingSession key={scope.generation} client={client} {...props} />;
}

function ReportingSession({ client, initialPresetId, resolveAction, onReportingAction }:
  ReportingWorkspaceProps & { client: ReportingWorkspaceClient }) {
  const [catalog, setCatalog] = useState<ReportingCatalog>();
  const [saved, setSaved] = useState<SavedReportingDefinition[]>([]);
  const [draft, setDraft] = useState<ReportingDocument>();
  const [active, setActive] = useState<{ id: string; saved: boolean }>();
  const [preview, setPreview] = useState<Preview & { generation: number }>();
  const [filterState, setFilterState] = useState<ReportingState>({});
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(true);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const operation = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setBusy(true);
    setCatalog(undefined);
    setDraft(undefined);
    setPreview(undefined);
    setFilterState({});
    setEditing(false);
    setActive(undefined);
    setStatus("");
    setError("");
    void (async () => {
      try {
        const [available, reports] = await Promise.all([client.catalog(signal), client.list(signal)]);
        if (signal.aborted) return;
        setCatalog(available);
        setSaved(reports);
        const preset = available.presets.find(report => report.id === initialPresetId) ?? available.presets[0];
        const first = preset ?? reports[0];
        if (!first) return;
        const definition = structuredClone(first.definition);
        setDraft(definition);
        setActive({ id: first.id, saved: !preset });
        const result = await loadPreview(definition, available, client, signal);
        if (!signal.aborted) showPreview(result);
      } catch (problem) {
        if (!signal.aborted) setError(errorMessage(problem));
      } finally {
        if (!signal.aborted) setBusy(false);
      }
    })();
    return () => {
      controller.abort();
      operation.current?.abort();
      operation.current = null;
    };
  }, [client, initialPresetId, reload]);

  function showPreview(result: Preview) {
    setPreview(previous => ({ ...result, generation: (previous?.generation ?? 0) + 1 }));
  }

  async function work(action: (signal: AbortSignal) => Promise<void>) {
    if (busy || operation.current) return;
    const controller = new AbortController();
    operation.current = controller;
    setBusy(true);
    setStatus("");
    setError("");
    try {
      await action(controller.signal);
    } catch (problem) {
      if (!controller.signal.aborted) setError(errorMessage(problem));
    } finally {
      if (operation.current === controller) {
        operation.current = null;
        setBusy(false);
      }
    }
  }

  function open(report: SavedReportingDefinition, fromSaved: boolean) {
    if (!catalog) return;
    void work(async signal => {
      const definition = structuredClone(report.definition);
      const result = await loadPreview(definition, catalog, client, signal);
      if (signal.aborted) return;
      setDraft(definition);
      setFilterState({});
      setActive({ id: report.id, saved: fromSaved });
      showPreview(result);
      setEditing(false);
    });
  }

  function start(kind: ReportingDocumentKind) {
    if (!catalog) return;
    const definition: ReportingDocument = { title: "", kind, tiles: [newTile(catalog)] };
    setDraft(reportingAvailableInputs(definition, catalog).some(input => input.role === "Filter")
      ? { ...definition, filters: [] } : definition);
    setFilterState({});
    setActive(undefined);
    setPreview(undefined);
    setStatus("");
    setError("");
    setEditing(true);
  }

  function updateDraft(definition: ReportingDocument) {
    if (!catalog) return;
    setDraft(definition);
    const allowed = new Set(reportingWorkspaceInputs(definition, catalog).map(input => input.id));
    setFilterState(previous => ({ ...previous, inputs: previous.inputs?.filter(input => allowed.has(input.id)) }));
  }

  function changeTile(tileIndex: number, replacement: ReportingTile) {
    if (!draft || !catalog) return;
    updateDraft(pruneReportingFilters({
      ...draft, tiles: draft.tiles.map((tile, index) => index === tileIndex ? replacement : tile),
    }, catalog));
  }

  function applyFilters(state: ReportingState) {
    if (!draft || !catalog) return;
    void work(async signal => {
      const result = await loadPreview(applyReportingState(draft, catalog, state), catalog, client, signal);
      if (signal.aborted) return;
      setFilterState(state);
      showPreview(result);
    });
  }

  function moveTile(index: number, offset: -1 | 1) {
    setDraft(previous => {
      if (!previous || !previous.tiles[index + offset]) return previous;
      const tiles = [...previous.tiles];
      [tiles[index], tiles[index + offset]] = [tiles[index + offset], tiles[index]];
      return { ...previous, tiles };
    });
  }

  function run() {
    if (!catalog || !draft) return;
    void work(async signal => {
      const result = await loadPreview(applyReportingState(draft, catalog, filterState), catalog, client, signal);
      if (signal.aborted) return;
      showPreview(result);
      setEditing(false);
    });
  }

  function save() {
    if (!draft || !catalog) return;
    const definition = applyReportingState(draft, catalog, filterState);
    void work(async signal => {
      if (active?.saved) {
        await client.update(active.id, definition, signal);
        if (signal.aborted) return;
        setSaved(reports => reports.map(report => report.id === active.id ? { ...report, definition } : report));
      } else {
        const result = await client.create(definition, signal);
        if (signal.aborted) return;
        setActive({ id: result.id, saved: true });
        setSaved(reports => [...reports, result]);
      }
      setStatus("Saved.");
    });
  }

  function remove() {
    if (!active?.saved) return;
    void work(async signal => {
      await client.remove(active.id, signal);
      if (signal.aborted) return;
      setSaved(reports => reports.filter(report => report.id !== active.id));
      setActive(undefined);
      setStatus("Deleted saved copy.");
    });
  }

  function emit(tileIndex: number, payload: ReportingWorkspaceAction["payload"]) {
    const tile = preview?.document.tiles[tileIndex];
    if (!tile) return;
    const snapshot = structuredClone(tile);
    const action = { actionName: resolveAction?.(snapshot, tileIndex) ?? `report-result-${tileIndex}`, tile: snapshot, tileIndex, payload };
    onReportingAction?.(action);
    if (snapshot.inputBinding && preview?.controls.some(input => input.id === snapshot.inputBinding?.input)) {
      const state = applyReportingAction(filterState, action, snapshot.inputBinding, { inputs: preview.controls });
      if (state !== filterState) applyFilters(state);
    }
  }

  return (
    <section className="bbq-reporting-workspace" aria-label="Reporting" aria-busy={busy}>
      <header>
        <h1>Reporting</h1>
        {!!catalog?.datasets.length && <div>
          <button type="button" disabled={busy} onClick={() => start("report")}>New report</button>
          <button type="button" disabled={busy} onClick={() => start("dashboard")}>New dashboard</button>
        </div>}
      </header>
      {error && <p role="alert">{error}</p>}
      {(busy || status) && <p role="status">{busy ? "Working." : status}</p>}
      {!catalog && !busy && <button type="button" onClick={() => setReload(value => value + 1)}>Load reports</button>}
      {catalog && <div className="bbq-reporting-workspace__layout">
        <nav aria-label="Reports and dashboards">
          <h2>Built in</h2>
          {catalog.presets.map(report => <button type="button" key={report.id} disabled={busy}
            aria-current={active?.id === report.id && !active.saved} onClick={() => open(report, false)}>{report.definition.title}</button>)}
          {!catalog.presets.length && <p>No presets available.</p>}
          <h2>Saved</h2>
          {saved.map(report => <button type="button" key={report.id} disabled={busy}
            aria-current={active?.id === report.id && active.saved} onClick={() => open(report, true)}>{report.definition.title}</button>)}
          {!saved.length && <p>No saved reports.</p>}
        </nav>
        {draft ? <div className="bbq-reporting-workspace__content">
          <header>
            <h2>{(editing ? draft.title : preview?.document.title ?? draft.title) || "Untitled " + draft.kind}</h2>
            {(!editing || preview) && <button type="button" disabled={busy} onClick={() => setEditing(!editing)}>
              {editing ? "Back to results" : "Edit " + draft.kind}
            </button>}
          </header>
          {editing && <form onSubmit={event => {
            event.preventDefault();
            const submitter = (event.nativeEvent as SubmitEvent).submitter;
            if (submitter?.getAttribute("value") === "save") save();
            else run();
          }}>
            <fieldset disabled={busy}>
              <legend>{draft.kind === "report" ? "Report settings" : "Dashboard settings"}</legend>
              <label>Title <input required maxLength={100} value={draft.title}
                onChange={event => setDraft({ ...draft, title: event.currentTarget.value })} /></label>
              <ReportFilterEditor document={draft} catalog={catalog}
                onChange={filters => updateDraft(withReportingFilters(draft, catalog, filters))} />
              {draft.tiles.map((tile, index) => <fieldset key={index}>
                <legend>Tile {index + 1}</legend>
                <ReportTileEditor tile={tile} catalog={catalog} kind={draft.kind}
                  onChange={replacement => changeTile(index, replacement)} />
                {draft.tiles.length > 1 && <div>
                  <button type="button" disabled={!index} onClick={() => moveTile(index, -1)}>Move tile {index + 1} up</button>
                  <button type="button" disabled={index === draft.tiles.length - 1} onClick={() => moveTile(index, 1)}>Move tile {index + 1} down</button>
                  <button type="button" onClick={() => updateDraft(pruneReportingFilters({ ...draft, tiles: draft.tiles.filter((_, item) => item !== index) }, catalog))}>Remove tile {index + 1}</button>
                </div>}
              </fieldset>)}
              {draft.kind === "dashboard" && draft.tiles.length < 8 && <button type="button"
                onClick={() => setDraft({ ...draft, tiles: [...draft.tiles, newTile(catalog)] })}>Add tile</button>}
              <button type="submit">Run {draft.kind}</button>
              <button type="submit" value="save">{active?.saved ? "Save changes" : "Save as new"}</button>
              {active?.saved && <button type="button" onClick={remove}>Delete saved copy</button>}
            </fieldset>
          </form>}
          {preview && <section hidden={editing} aria-label="Report results">
            {preview.controls.length > 0 && <fieldset aria-label="Report filters" disabled={busy}>
              <legend>Report filters</legend>
              <div className="bbq-reporting-workspace__fields">
                {preview.controls.map(input => {
                  const options = input.options ?? [];
                  const value = filterState.inputs?.find(selection => selection.id === input.id)?.value;
                  const selected = options.findIndex(option => option.value === value);
                  return <label key={input.id}>{input.label}
                    <select disabled={!options.length} value={selected} onChange={event =>
                      applyFilters(setReportingInput(filterState, input, options[Number(event.currentTarget.value)]?.value))}>
                      <option value={-1}>Use report setting</option>
                      {options.map((option, index) => <option key={index} value={index}>{option.label}</option>)}
                    </select>
                  </label>;
                })}
              </div>
              <button type="button" onClick={() => applyFilters({})}>Clear all filters</button>
            </fieldset>}
            {preview.widget && <WidgetRenderer key={preview.generation} widgets={[preview.widget]} onWidgetAction={(actionName, payload) => {
              const match = /^report-result-(\d+)$/.exec(actionName);
              if (match && isReportingAction(payload)) emit(Number(match[1]), payload);
            }} />}
            {preview.grids.map(({ tileIndex, dimension }) => {
              const tile = preview.document.tiles[tileIndex];
              return <PagedReportingGrid key={`${preview.generation}-${tileIndex}`} client={client} title={tile.title} query={tile.query}
                dimension={dimension} onRowActivate={onReportingAction || tile.inputBinding ? payload => emit(tileIndex, payload) : undefined} />;
            })}
          </section>}
        </div> : !busy && <p>{catalog.datasets.length ? "Choose a report or create one." : "No reporting datasets are available."}</p>}
      </div>}
    </section>
  );
}

function ReportFilterEditor({ document, catalog, onChange }: {
  document: ReportingDocument; catalog: ReportingCatalog; onChange: (filters: ReportingFilter[]) => void;
}) {
  const available = reportingAvailableInputs(document, catalog).filter(input => input.role === "Filter");
  const filters = reportingEditableFilters(document, catalog);
  const addable = available.filter(input => !filters.some(filter => filter.input === input.id));
  if (!available.length && !filters.length) return null;

  function move(index: number, offset: number) {
    if (!filters[index + offset]) return;
    const next = [...filters];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    onChange(next);
  }

  return <fieldset>
    <legend>Report filters</legend>
    {filters.map((filter, index) => {
      const name = available.find(input => input.id === filter.input)?.label ?? filter.input;
      return <div key={filter.input} className="bbq-reporting-workspace__fields">
        <label>{name} label <input maxLength={100} placeholder={name} value={filter.label ?? ""}
          onChange={event => {
            const label = event.currentTarget.value;
            onChange(filters.map(item => item.input === filter.input ? { input: item.input, label: label || undefined } : item));
          }} onBlur={event => {
            const label = event.currentTarget.value.trim() || undefined;
            if (label !== filter.label) {
              onChange(filters.map(item => item.input === filter.input ? { input: item.input, label } : item));
            }
          }} /></label>
        <button type="button" disabled={!index} aria-label={`Move ${name} filter up`} onClick={() => move(index, -1)}>Move up</button>
        <button type="button" disabled={index === filters.length - 1} aria-label={`Move ${name} filter down`}
          onClick={() => move(index, 1)}>Move down</button>
        <button type="button" aria-label={`Remove ${name} filter`}
          onClick={() => onChange(filters.filter(item => item.input !== filter.input))}>Remove</button>
      </div>;
    })}
    {!!addable.length && <label>Add filter
      <select value="" onChange={event => {
        const id = event.currentTarget.value;
        if (addable.some(item => item.id === id)) onChange([...filters, { input: id }]);
      }}>
        <option value="">Choose a filter</option>
        {addable.map(input => <option value={input.id} key={input.id}>{input.label}</option>)}
      </select>
    </label>}
  </fieldset>;
}

function ReportTileEditor({ tile, catalog, kind, onChange }: {
  tile: ReportingTile; catalog: ReportingCatalog; kind: ReportingDocumentKind; onChange: (tile: ReportingTile) => void;
}) {
  const dataset = datasetFor(catalog, tile);
  const grouping = dataset?.dimensions.find(field => field.id === tile.query.groupBy);
  const needsDates = (tile.view === "timeline" || isReportingTimeSeriesKind(tile.view)) &&
    !tile.presentation?.dateField && !grouping?.dateField && grouping?.id !== "day";
  return (
    <div className="bbq-reporting-workspace__fields">
      <label>Tile title <input required maxLength={100} value={tile.title}
        onChange={event => onChange({ ...tile, title: event.currentTarget.value })} /></label>
      <label>Dataset <select required value={tile.query.dataset} onChange={event => {
        const datasetId = event.currentTarget.value;
        const metric = catalog.datasets.find(item => item.id === datasetId)?.metrics[0]?.id ?? "";
        onChange({ ...tile, presentation: undefined, inputBinding: undefined,
          query: { ...tile.query, dataset: datasetId, metric, groupBy: null, inputs: undefined } });
      }}>
        <option value="" disabled>Choose dataset</option>
        {catalog.datasets.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select></label>
      <label>Metric <select required value={tile.query.metric} onChange={event => onChange({
        ...tile, query: { ...tile.query, metric: event.currentTarget.value },
      })}>
        <option value="" disabled>Choose metric</option>
        {dataset?.metrics.map(metric => <option key={metric.id} value={metric.id}>{metric.label}</option>)}
      </select></label>
      <label>Group by <select value={tile.query.groupBy ?? ""} onChange={event => onChange({
        ...tile, query: { ...tile.query, groupBy: event.currentTarget.value || null },
      })}>
        <option value="">No grouping</option>
        {dataset?.dimensions.map(field => <option key={field.id} value={field.id}>{field.label}</option>)}
      </select></label>
      <label>Display <select value={tile.view} onChange={event => onChange({ ...tile, view: event.currentTarget.value as ReportingView })}>
        {reportingViews.filter(view => view.id !== "filter" || kind === "dashboard")
          .map(view => <option key={view.id} value={view.id}>{view.label}</option>)}
      </select></label>
      <label>From <input type="date" required value={tile.query.from} onChange={event => onChange({
        ...tile, query: { ...tile.query, from: event.currentTarget.value },
      })} /></label>
      <label>Through <input type="date" required min={tile.query.from} value={tile.query.to} onChange={event => onChange({
        ...tile, query: { ...tile.query, to: event.currentTarget.value },
      })} /></label>
      {needsDates && <p>Choose a grouping with dates for this chart.</p>}
    </div>
  );
}

