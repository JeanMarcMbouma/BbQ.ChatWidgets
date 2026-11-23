import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, EventEmitter, inject, InjectionToken, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WidgetRendererComponent } from '../widget-renderer.component';
import { firstValueFrom, ReplaySubject, takeUntil } from 'rxjs';
import { applyReportingAction, applyReportingState, composeReportingSnapshot, isReportingAction, isReportingTimeSeriesKind,
  pruneReportingFilters, reportingAvailableInputs, reportingEditableFilters, reportingQueryKey, reportingViews,
  reportingWorkspaceInputs, resolveReportingControls, resolveReportingLayout, withReportingFilters, ReportingWidget } from '@bbq-chat/widgets';
import type {
  ReportingCatalog as ReportCatalog, ReportingDataset as ReportDataset,
  ReportingDocument as ReportDefinition, ReportingDocumentKind as ReportKind,
  ReportingActionResolver, ReportingCalendar, ReportingDateRange, ReportingField, ReportingGridRowActivation,
  ChatWidget, ReportingFilter, ReportingInput, ReportingLayoutState, ReportingPlacement, ReportingResultRow,
  ReportingSelection, ReportingTileRenderer, ReportingState, ReportingTile as ReportTile,
  ReportingWorkspaceAction, SavedReportingDefinition as SavedReport,
} from '@bbq-chat/widgets';
import { ReportingApi } from './reporting-api';
import { PagedReportingGridComponent } from './paged-grid.component';
import { ReportingControlsComponent } from './reporting-controls.component';
import { nextReportingId, ReportingLayoutEditorComponent } from './reporting-layout-editor.component';

/** Optional preset to open when the reporting workspace loads. */
export const REPORTING_INITIAL_PRESET = new InjectionToken<string>('Initial reporting preset');

export type { ReportingWorkspaceAction } from '@bbq-chat/widgets';

/** Standalone workspace for authoring and viewing reports and dashboards. */
@Component({
  selector: 'bbq-reporting, app-reporting',
  standalone: true,
  imports: [FormsModule, WidgetRendererComponent, PagedReportingGridComponent, ReportingControlsComponent, ReportingLayoutEditorComponent],
  providers: [ReportingApi],
  templateUrl: './reporting.component.html',
  styleUrl: './reporting.component.css',
})
export class ReportingComponent implements OnInit, OnDestroy {
  /** Optionally map a tile to a host action name. The default is report-result-<tile index>. */
  @Input() resolveAction?: ReportingActionResolver;

  /** Routes renderer and server-paged grid interactions to the host application. */
  @Output() readonly reportingAction = new EventEmitter<ReportingWorkspaceAction>();

  /** Restores shared state controlled by the host, such as route parameters. */
  @Input() set reportingState(value: ReportingState | undefined) {
    this.updateState(value ?? {}, false);
  }

  /** Emits the effective shared dates and selected inputs. */
  @Output() readonly reportingStateChange = new EventEmitter<ReportingState>();

  /** Optionally selects an available preset or saved definition after the catalog loads. */
  @Input() set selectedReport(value: ReportingSelection | undefined) {
    this.requestedSelection = value;
    if (value) this.restoreSelection(value);
  }

  /** Emits a selected preset or saved item, or null for a new draft. */
  @Output() readonly selectionChange = new EventEmitter<ReportingSelection | null>();

  /** Host permission for the authoring UI. The server still authorizes mutations. */
  @Input() canEdit = true;

  /** Host renderer adapters keyed by authored renderer ID. */
  @Input() tileRenderers: Readonly<Record<string, ReportingTileRenderer>> = {};

  get rendererIds(): string[] { return Object.keys(this.tileRenderers); }

  @Input() set layoutState(value: ReportingLayoutState | undefined) {
    this.updateLayoutState(value ?? {}, false);
  }
  @Output() readonly layoutStateChange = new EventEmitter<ReportingLayoutState>();
  private currentLayoutState: ReportingLayoutState = {};

  private readonly api = inject(ReportingApi);
  private readonly initialPreset = inject(REPORTING_INITIAL_PRESET, { optional: true });
  private readonly detector = inject(ChangeDetectorRef);
  private requestedSelection?: ReportingSelection;
  private renderStop?: ReplaySubject<void>;
  private renderVersion = 0;
  private renderQueued = false;
  private destroyed = false;
  private readonly results = new Map<string, ReportingResultRow[]>();

  state: ReportingState = {};
  inputs: ReportingInput[] = [];
  calendar?: ReportingCalendar;
  defaultDates?: ReportingDateRange;

  catalog: ReportCatalog | null = null;
  saved: SavedReport[] = [];
  draft: ReportDefinition | null = null;
  savedId: string | null = null;
  presetId: string | null = null;
  editing = false;
  readonly views = reportingViews;
  widgets: ReportingWidget[] = [];
  pagedGrids: { tile: ReportTile; tileIndex: number; dimension: ReportingField }[] = [];
  cards: { placement: ReportingPlacement; tiles: {
    tileIndex: number;
    widgets: ChatWidget[];
    missingRenderer?: string;
    grid?: ReportingComponent['pagedGrids'][number];
  }[] }[] = [];
  selected: string | null = null;
  busy = false;
  error = '';
  status = '';

  ngOnInit() {
    void this.load();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.cancelRender();
  }

  load() {
    return this.work(async () => {
      const [catalog, saved] = await Promise.all([
        firstValueFrom(this.api.catalog()), firstValueFrom(this.api.list()),
      ]);
      if (this.destroyed) return;
      this.catalog = catalog;
      this.saved = saved;
      const requested = this.findSelection(this.requestedSelection);
      const preset = catalog.presets.find(item => item.id === this.initialPreset) ?? catalog.presets[0];
      const first = requested ?? preset ?? saved[0];
      if (first) {
        this.open(first, requested ? this.requestedSelection?.kind === 'saved' : !preset, !requested, true);
        await this.render();
      }
    });
  }

  dataset(tile: ReportTile): ReportDataset | undefined {
    return this.catalog?.datasets.find(dataset => dataset.id === tile.query.dataset);
  }

  needsDateGrouping(tile: ReportTile): boolean {
    if (tile.view !== 'timeline' && !isReportingTimeSeriesKind(tile.view)) return false;
    const grouping = this.dataset(tile)?.dimensions.find(dimension => dimension.id === tile.query.groupBy);
    return !tile.presentation?.dateField && !grouping?.dateField && grouping?.id !== 'day';
  }

  changeDataset(tile: ReportTile, id: string) {
    tile.query.dataset = id;
    tile.query.metric = this.dataset(tile)?.metrics[0]?.id ?? '';
    tile.query.groupBy = null;
    tile.query.inputs = undefined;
    tile.presentation = undefined;
    tile.inputBinding = undefined;
    if (this.draft && this.catalog) this.changeFilterDefinition(pruneReportingFilters(this.draft, this.catalog));
    else this.clearPreview();
  }

  open(report: SavedReport, saved: boolean, emit = true, restoreLayout = false) {
    this.draft = structuredClone(report.definition);
    if (emit && !restoreLayout) {
      this.currentLayoutState = {};
      this.layoutStateChange.emit({});
    }
    this.savedId = saved ? report.id : null;
    this.presetId = saved ? null : report.id;
    this.cancelRender();
    if (emit) this.selectionChange.emit({ kind: saved ? 'saved' : 'preset', id: report.id });
    this.editing = false;
    this.error = this.status = '';
    this.clearPreview();
  }

  start(kind: ReportKind) {
    if (!this.canEdit) return;
    this.currentLayoutState = {};
    this.layoutStateChange.emit({});
    const draft: ReportDefinition = { title: '', kind, tiles: [this.newTile()] };
    this.draft = this.catalog && reportingAvailableInputs(draft, this.catalog).some(input => input.role === 'Filter')
      ? { ...draft, filters: [] } : draft;
    this.savedId = null;
    this.presetId = null;
    this.selectionChange.emit(null);
    this.editing = true;
    this.error = this.status = '';
    this.clearPreview();
  }

  addTile() {
    if (!this.draft || this.draft.tiles.length >= (this.draft.layout ? 32 : 8)) return;
    const tile = this.newTile();
    if (this.draft.layout) tile.id = nextReportingId(this.draft.tiles, 'tile');
    this.draft.tiles.push(tile);
    this.clearPreview();
  }

  removeTile(index: number) {
    if (!this.draft || !this.catalog) return;
    if (this.tileReferences(this.draft.tiles[index]?.id)) return;
    const draft = { ...this.draft, tiles: this.draft.tiles.filter((_, position) => position !== index) };
    this.changeFilterDefinition(pruneReportingFilters(draft, this.catalog));
  }

  moveTile(index: number, offset: -1 | 1) {
    const tiles = this.draft?.tiles;
    if (!tiles || !tiles[index + offset]) return;
    [tiles[index], tiles[index + offset]] = [tiles[index + offset], tiles[index]];
    this.clearPreview();
  }

  get activeLayout() {
    return this.draft && resolveReportingLayout(this.draft, this.currentLayoutState);
  }

  selectMode(modeId: string): void {
    this.updateLayoutState({ modeId });
  }

  selectVariant(placementId: string, variantId: string): void {
    const modeId = this.activeLayout?.mode.id;
    if (!modeId) return;
    const variants = this.currentLayoutState.modeId === modeId ? this.currentLayoutState.variants : undefined;
    this.updateLayoutState({ modeId, variants: { ...variants, [placementId]: variantId } });
  }

  tileReferences(id: string | undefined): string {
    if (!id) return '';
    return this.draft?.layout?.modes.filter(mode => mode.placements.some(card =>
      card.tileIds?.includes(id) || card.variants?.some(variant => variant.tileIds.includes(id)),
    )).map(mode => mode.label).join(', ') ?? '';
  }

  captureLayoutDefaults(): void {
    if (this.draft && this.catalog) this.draft = applyReportingState(this.draft, this.catalog, this.state);
  }

  private updateLayoutState(state: ReportingLayoutState, emit = true): void {
    const key = (value: ReportingLayoutState) => JSON.stringify([value.modeId, Object.entries(value.variants ?? {}).sort()]);
    if (key(state) === key(this.currentLayoutState)) return;
    const previousMode = this.activeLayout;
    this.currentLayoutState = structuredClone(state);
    const nextMode = this.activeLayout;
    const calendar = (mode: typeof previousMode) => {
      const index = mode?.placements[0]?.tileIndices[0];
      const tile = index === undefined ? undefined : this.draft?.tiles[index];
      return tile ? this.dataset(tile)?.calendar?.label ?? 'UTC' : 'UTC';
    };
    if (emit && previousMode?.mode.id !== nextMode?.mode.id && calendar(previousMode) !== calendar(nextMode) && this.state.dates) {
      this.state = { ...this.state, dates: undefined };
      this.reportingStateChange.emit(structuredClone(this.state));
    }
    if (emit) this.layoutStateChange.emit(structuredClone(this.currentLayoutState));
    if (this.draft?.layout && this.catalog) this.requestRender();
  }

  get availableFilterInputs(): ReportingInput[] {
    return this.draft && this.catalog ? reportingAvailableInputs(this.draft, this.catalog)
      .filter(input => input.role === 'Filter') : [];
  }

  get draftFilters(): ReportingFilter[] {
    return this.draft && this.catalog ? reportingEditableFilters(this.draft, this.catalog) : [];
  }

  get filtersToAdd(): ReportingInput[] {
    const filters = this.draftFilters;
    return this.availableFilterInputs.filter(input => !filters.some(filter => filter.input === input.id));
  }

  filterLabel(id: string): string {
    return this.availableFilterInputs.find(input => input.id === id)?.label ?? id;
  }

  addFilter(id: string): void {
    if (this.filtersToAdd.some(input => input.id === id)) {
      this.setFilters([...this.draftFilters, { input: id }]);
    }
  }

  renameFilter(id: string, label: string): void {
    this.setFilters(this.draftFilters.map(filter => filter.input === id
      ? { input: id, label: label.trim() || undefined } : filter));
  }

  moveFilter(index: number, offset: number): void {
    const filters = [...this.draftFilters];
    if (!filters[index] || !filters[index + offset]) return;
    [filters[index], filters[index + offset]] = [filters[index + offset], filters[index]];
    this.setFilters(filters);
  }

  removeFilter(id: string): void {
    this.setFilters(this.draftFilters.filter(filter => filter.input !== id));
  }

  private setFilters(filters: ReportingFilter[]): void {
    if (!this.draft || !this.catalog) return;
    this.changeFilterDefinition(withReportingFilters(this.draft, this.catalog, filters));
  }

  private changeFilterDefinition(definition: ReportDefinition): void {
    this.draft = definition;
    const allowed = new Set(reportingWorkspaceInputs(definition, this.catalog!).map(input => input.id));
    const inputs = this.state.inputs?.filter(selection => allowed.has(selection.id));
    if (inputs?.length !== this.state.inputs?.length) {
      this.state = { ...this.state, inputs: inputs?.length ? inputs : undefined };
      this.reportingStateChange.emit(structuredClone(this.state));
    }
    this.clearPreview();
  }

  clearPreview(resetCache = true) {
    if (resetCache) this.results.clear();
    this.widgets = [];
    this.cards = [];
    this.pagedGrids = [];
    this.selected = null;
  }

  run(refresh = true) {
    if (refresh) this.results.clear();
    return this.work(async () => {
      await this.render();
      this.editing = false;
    });
  }

  save() {
    if (!this.canEdit) return;
    const draft = this.draft && this.catalog && !this.draft.layout
      ? applyReportingState(this.draft, this.catalog, this.state) : this.draft;
    if (draft?.layout && !this.catalog?.capabilities?.layouts) {
      this.error = 'This server does not support saving report layouts.';
      return;
    }
    if (!draft) return;
    return this.work(async () => {
      if (this.savedId) {
        await firstValueFrom(this.api.update(this.savedId, draft));
        const index = this.saved.findIndex(report => report.id === this.savedId);
        if (index >= 0) this.saved[index] = { id: this.savedId, definition: structuredClone(draft) };
      } else {
        const saved = await firstValueFrom(this.api.create(draft));
        this.savedId = saved.id;
        this.presetId = null;
        this.saved = [...this.saved, saved];
        this.selectionChange.emit({ kind: 'saved', id: saved.id });
      }
      this.status = 'Saved.';
    });
  }

  remove() {
    const id = this.savedId;
    if (!id || !this.canEdit) return;
    return this.work(async () => {
      await firstValueFrom(this.api.remove(id));
      this.saved = this.saved.filter(report => report.id !== id);
      this.savedId = null;
      this.selectionChange.emit(null);
      this.status = 'Deleted saved copy. You can still edit this draft.';
    });
  }

  onWidgetAction(event: { actionName: string; payload: unknown }) {
    const match = /^report-result-(\d+)$/.exec(event.actionName);
    if (!match || !isReportingAction(event.payload)) return;
    const tileIndex = Number(match[1]);
    const tile = this.draft?.tiles[tileIndex];
    if (!tile) return;

    const payload = event.payload;
    if (payload.kind === 'edit') {
      this.status = 'Cell updated in this preview. Source data is unchanged.';
    } else if (payload.kind === 'select') {
      this.selected = payload.row
        ? tile.title + ' · ' + String(payload.row['label'] ?? '')
        : tile.title + ' · ' + payload.rowIndices.length + ' selected';
    }
    this.detector.markForCheck();
    this.emitReportingAction(tile, tileIndex, payload);
  }

  onPagedRowActivate(tile: ReportTile, tileIndex: number, payload: ReportingGridRowActivation): void {
    this.emitReportingAction(tile, tileIndex, payload);
  }

  private emitReportingAction(tile: ReportTile, tileIndex: number, payload: ReportingWorkspaceAction['payload']): void {
    const snapshot = structuredClone(tile);
    const actionName = this.resolveAction?.(snapshot, tileIndex) ?? 'report-result-' + tileIndex;
    const action = { actionName, tile: snapshot, tileIndex, payload };
    this.reportingAction.emit(action);
    const binding = snapshot.inputBinding;
    if (binding && this.inputs.some(input => input.id === binding.input && input.role === 'Filter')) {
      this.updateState(applyReportingAction(this.state, action, binding, { inputs: this.inputs }));
    }
  }

  private newTile(): ReportTile {
    const first = this.catalog?.datasets[0];
    const defaults = this.catalog?.presets[0]?.definition.tiles[0]?.query;
    const today = new Date().toISOString().slice(0, 10);
    return {
      title: '', view: 'table',
      query: {
        dataset: first?.id ?? '', metric: first?.metrics[0]?.id ?? '', groupBy: null,
        from: defaults?.from ?? today, to: defaults?.to ?? today,
      },
    };
  }

  private findSelection(selection: ReportingSelection | undefined): SavedReport | undefined {
    if (!selection || !this.catalog) return undefined;
    const definitions = selection.kind === 'saved' ? this.saved : this.catalog.presets;
    return definitions.find(item => item.id === selection.id);
  }

  private restoreSelection(selection: ReportingSelection): void {
    const current = selection.kind === 'saved' ? this.savedId : this.presetId;
    const report = this.findSelection(selection);
    if (!report || current === selection.id) return;
    this.open(report, selection.kind === 'saved', false);
    this.requestRender();
  }

  updateState(value: ReportingState, emit = true): void {
    const selectionOrder = (state: ReportingState) =>
      JSON.stringify([state.dates?.from, state.dates?.to, (state.inputs ?? []).map(input => [input.id, input.value]).sort()]);
    if (selectionOrder(this.state) === selectionOrder(value)) return;

    this.state = structuredClone(value);
    this.results.clear();
    if (emit) this.reportingStateChange.emit(structuredClone(value));
    if (this.draft && this.catalog) this.requestRender();
  }

  private cancelRender(): void {
    this.renderVersion++;
    this.renderStop?.next();
    this.renderStop?.complete();
    this.renderStop = undefined;
  }

  private requestRender(): void {
    this.cancelRender();
    if (this.busy) this.renderQueued = true;
    else void this.run(false);
  }

  private async render() {
    if (!this.draft || !this.catalog || this.destroyed) return;
    this.cancelRender();
    this.clearPreview(false);
    const version = this.renderVersion;
    const stop = this.renderStop = new ReplaySubject<void>(1);
    const effective = applyReportingState(this.draft, this.catalog, this.state);
    const authored = resolveReportingLayout(effective, this.currentLayoutState);
    const visible = authored && new Set(authored.placements.flatMap(card => card.tileIndices));
    const active = visible ? { ...effective, tiles: effective.tiles.filter((_, index) => visible.has(index)) } : effective;
    const paged = new Set<ReportTile>();
    this.pagedGrids = effective.tiles.flatMap((tile, tileIndex) => {
      if (visible && !visible.has(tileIndex)) return [];
      const dimension = tile.view === 'grid' && this.dataset(tile)?.dimensions
        .find(field => field.id === tile.query.groupBy && field.grid);
      if (!dimension) return [];
      paged.add(tile);
      return [{ tile: structuredClone(tile), tileIndex, dimension }];
    });

    const [snapshot, inputs] = await Promise.all([
      paged.size === active.tiles.length ? null : composeReportingSnapshot(effective, this.catalog,
        async query => {
          const key = reportingQueryKey(query);
          const cached = authored && this.results.get(key);
          if (cached) return cached;
          const rows = await firstValueFrom(this.api.run(query).pipe(takeUntil(stop)));
          if (authored && version === this.renderVersion) this.results.set(key, rows);
          return rows;
        }, {
          includeTile: tile => !paged.has(tile),
          layoutState: this.currentLayoutState,
          describeError: error => this.message(error),
        }),
      this.loadInputs(active, stop),
    ]);
    if (this.destroyed || version !== this.renderVersion) return;
    this.widgets = snapshot && !authored ? [snapshot] : [];
    if (authored) {
      const byAction = new Map(snapshot?.children?.map(widget => [widget.action, widget]));
      this.cards = authored.placements.map(({ placement, tileIndices }) => ({
        placement,
        tiles: tileIndices.map(tileIndex => {
          const grid = this.pagedGrids.find(item => item.tileIndex === tileIndex);
          const child = byAction.get('report-result-' + tileIndex);
          const tile = effective.tiles[tileIndex];
          if (!child) return { tileIndex, grid, widgets: [] };
          const { dataSource, ...settings } = child.settings ?? {};
          const native = new ReportingWidget(child.label, child.action, child.kind, {
            settings: { ...snapshot?.settings, layout: undefined, ...settings },
            rows: dataSource ? snapshot?.sources?.[dataSource] : undefined,
            error: child.error,
            filterField: child.filterField,
          });
          const renderer = tile.renderer && Object.prototype.hasOwnProperty.call(this.tileRenderers, tile.renderer)
            ? this.tileRenderers[tile.renderer] : undefined;
          return {
            tileIndex,
            widgets: [renderer && !native.error ? renderer(native, tile) : native],
            missingRenderer: renderer ? undefined : tile.renderer,
          };
        }),
      }));
    }
    this.inputs = inputs;
    const firstIndex = authored?.placements.flatMap(placement => placement.tileIndices)[0] ?? 0;
    const first = this.draft.tiles[firstIndex];
    this.defaultDates = first ? { from: first.query.from, to: first.query.to } : undefined;
    const calendars = active.tiles.flatMap(tile => this.dataset(tile)?.calendar ?? []);
    const dateRange = calendars[0];
    this.calendar = dateRange
      ? { ...dateRange, maxDays: Math.min(...calendars.map(calendar => calendar.maxDays)) }
      : undefined;
  }

  private loadInputs(document: ReportDefinition, stop: ReplaySubject<void>): Promise<ReportingInput[]> {
    return resolveReportingControls(document, this.catalog!, (query, input) => firstValueFrom(
      this.api.inputOptions({ dataset: query.dataset, input, from: query.from, to: query.to }).pipe(takeUntil(stop)),
    ).catch(() => []));
  }

  private async work(action: () => Promise<void>) {
    if (this.busy) return;
    this.busy = true;
    this.error = this.status = '';
    try {
      await action();
    } catch (error) {
      this.error = this.message(error);
    } finally {
      this.busy = false;
      this.detector.markForCheck();
      if (!this.destroyed && this.renderQueued) {
        this.renderQueued = false;
        void this.run(false);
      }
    }
  }

  private message(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.error === 'string') return error.error.error;
      if (error.status === 401 || error.status === 403) return 'You do not have access to this reporting operation.';
      if (error.status === 404) return 'This saved item is no longer available.';
    }
    return 'The reporting request failed. Try again.';
  }
}

