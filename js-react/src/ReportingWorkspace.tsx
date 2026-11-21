import { useEffect, useMemo, useRef, useState } from "react";
import {
  composeReportingSnapshot,
  isReportingAction,
  isReportingTimeSeriesKind,
  ReportingClient,
  reportingViews,
  type ReportingActionResolver,
  type ReportingCatalog,
  type ReportingDocument,
  type ReportingDocumentKind,
  type ReportingField,
  type ReportingTile,
  type ReportingView,
  type ReportingWidget,
  type ReportingWorkspaceAction,
  type SavedReportingDefinition,
} from "@bbq-chat/widgets";
import { PagedReportingGrid } from "./PagedReportingGrid.js";
import { WidgetRenderer } from "./WidgetRenderer.js";

export type ReportingWorkspaceClient = Pick<ReportingClient, "catalog" | "list" | "run" | "page" | "create" | "update" | "remove">;

export interface ReportingWorkspaceProps {
  client?: ReportingWorkspaceClient;
  initialPresetId?: string;
  resolveAction?: ReportingActionResolver;
  onReportingAction?: (event: ReportingWorkspaceAction) => void;
}

interface Preview {
  document: ReportingDocument;
  widget?: ReportingWidget;
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
  const widget = paged.size === document.tiles.length ? undefined
    : await composeReportingSnapshot(document, catalog, query => client.run(query, signal), {
      includeTile: tile => !paged.has(tile), describeError: errorMessage,
    });
  return { document, widget, grids };
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
      setActive({ id: report.id, saved: fromSaved });
      showPreview(result);
      setEditing(false);
    });
  }

  function start(kind: ReportingDocumentKind) {
    if (!catalog) return;
    setDraft({ title: "", kind, tiles: [newTile(catalog)] });
    setActive(undefined);
    setPreview(undefined);
    setStatus("");
    setError("");
    setEditing(true);
  }

  function changeTile(tileIndex: number, replacement: ReportingTile) {
    setDraft(previous => previous && {
      ...previous, tiles: previous.tiles.map((tile, index) => index === tileIndex ? replacement : tile),
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
      const result = await loadPreview(draft, catalog, client, signal);
      if (signal.aborted) return;
      showPreview(result);
      setEditing(false);
    });
  }

  function save() {
    if (!draft) return;
    void work(async signal => {
      if (active?.saved) {
        await client.update(active.id, draft, signal);
        if (signal.aborted) return;
        setSaved(reports => reports.map(report => report.id === active.id ? { ...report, definition: draft } : report));
      } else {
        const result = await client.create(draft, signal);
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
    if (!tile || !onReportingAction) return;
    const snapshot = structuredClone(tile);
    onReportingAction({ actionName: resolveAction?.(snapshot, tileIndex) ?? `report-result-${tileIndex}`, tile: snapshot, tileIndex, payload });
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
              {draft.tiles.map((tile, index) => <fieldset key={index}>
                <legend>Tile {index + 1}</legend>
                <ReportTileEditor tile={tile} catalog={catalog} kind={draft.kind}
                  onChange={replacement => changeTile(index, replacement)} />
                {draft.tiles.length > 1 && <div>
                  <button type="button" disabled={!index} onClick={() => moveTile(index, -1)}>Move tile {index + 1} up</button>
                  <button type="button" disabled={index === draft.tiles.length - 1} onClick={() => moveTile(index, 1)}>Move tile {index + 1} down</button>
                  <button type="button" onClick={() => setDraft({ ...draft, tiles: draft.tiles.filter((_, item) => item !== index) })}>Remove tile {index + 1}</button>
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
            {preview.widget && <WidgetRenderer key={preview.generation} widgets={[preview.widget]} onWidgetAction={(actionName, payload) => {
              const match = /^report-result-(\d+)$/.exec(actionName);
              if (match && isReportingAction(payload)) emit(Number(match[1]), payload);
            }} />}
            {preview.grids.map(({ tileIndex, dimension }) => {
              const tile = preview.document.tiles[tileIndex];
              return <PagedReportingGrid key={`${preview.generation}-${tileIndex}`} client={client} title={tile.title} query={tile.query}
                dimension={dimension} onRowActivate={onReportingAction ? payload => emit(tileIndex, payload) : undefined} />;
            })}
          </section>}
        </div> : !busy && <p>{catalog.datasets.length ? "Choose a report or create one." : "No reporting datasets are available."}</p>}
      </div>}
    </section>
  );
}

function ReportTileEditor({ tile, catalog, kind, onChange }: {
  tile: ReportingTile; catalog: ReportingCatalog; kind: ReportingDocumentKind; onChange: (tile: ReportingTile) => void;
}) {
  const dataset = datasetFor(catalog, tile);
  const grouping = dataset?.dimensions.find(field => field.id === tile.query.groupBy);
  const needsDates = (tile.view === "timeline" || isReportingTimeSeriesKind(tile.view)) && !grouping?.dateField && grouping?.id !== "day";
  return (
    <div className="bbq-reporting-workspace__fields">
      <label>Tile title <input required maxLength={100} value={tile.title}
        onChange={event => onChange({ ...tile, title: event.currentTarget.value })} /></label>
      <label>Dataset <select required value={tile.query.dataset} onChange={event => {
        const datasetId = event.currentTarget.value;
        const metric = catalog.datasets.find(item => item.id === datasetId)?.metrics[0]?.id ?? "";
        onChange({ ...tile, query: { ...tile.query, dataset: datasetId, metric, groupBy: null } });
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

