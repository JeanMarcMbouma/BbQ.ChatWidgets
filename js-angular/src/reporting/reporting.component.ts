import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, EventEmitter, inject, InjectionToken, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WidgetRendererComponent } from '../widget-renderer.component';
import { firstValueFrom, ReplaySubject, takeUntil } from 'rxjs';
import { applyReportingAction, applyReportingState, composeReportingSnapshot, isReportingAction, isReportingTimeSeriesKind,
  pruneReportingFilters, reportingAvailableInputs, reportingEditableFilters, reportingViews,
  reportingWorkspaceInputs, resolveReportingControls, withReportingFilters, type ReportingWidget } from '@bbq-chat/widgets';
import type {
  ReportingCatalog as ReportCatalog, ReportingDataset as ReportDataset,
  ReportingDocument as ReportDefinition, ReportingDocumentKind as ReportKind,
  ReportingActionResolver, ReportingCalendar, ReportingDateRange, ReportingField, ReportingGridRowActivation,
  ReportingFilter, ReportingInput, ReportingSelection, ReportingState, ReportingTile as ReportTile,
  ReportingWorkspaceAction, SavedReportingDefinition as SavedReport,
} from '@bbq-chat/widgets';
import { ReportingApi } from './reporting-api';
import { PagedReportingGridComponent } from './paged-grid.component';
import { ReportingControlsComponent } from './reporting-controls.component';

/** Optional preset to open when the reporting workspace loads. */
export const REPORTING_INITIAL_PRESET = new InjectionToken<string>('Initial reporting preset');

export type { ReportingWorkspaceAction } from '@bbq-chat/widgets';

/** Standalone workspace for authoring and viewing reports and dashboards. */
@Component({
  selector: 'bbq-reporting, app-reporting',
  standalone: true,
  imports: [FormsModule, WidgetRendererComponent, PagedReportingGridComponent, ReportingControlsComponent],
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

  private readonly api = inject(ReportingApi);
  private readonly initialPreset = inject(REPORTING_INITIAL_PRESET, { optional: true });
  private readonly detector = inject(ChangeDetectorRef);
  private requestedSelection?: ReportingSelection;
  private renderStop?: ReplaySubject<void>;
  private renderVersion = 0;
  private renderQueued = false;
  private destroyed = false;

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
        this.open(first, requested ? this.requestedSelection?.kind === 'saved' : !preset, !requested);
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

  open(report: SavedReport, saved: boolean, emit = true) {
    this.draft = structuredClone(report.definition);
    this.savedId = saved ? report.id : null;
    this.presetId = saved ? null : report.id;
    this.cancelRender();
    if (emit) this.selectionChange.emit({ kind: saved ? 'saved' : 'preset', id: report.id });
    this.editing = false;
    this.error = this.status = '';
    this.clearPreview();
  }

  start(kind: ReportKind) {
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
    this.draft?.tiles.push(this.newTile());
    this.clearPreview();
  }

  removeTile(index: number) {
    if (!this.draft || !this.catalog) return;
    const draft = { ...this.draft, tiles: this.draft.tiles.filter((_, position) => position !== index) };
    this.changeFilterDefinition(pruneReportingFilters(draft, this.catalog));
  }

  moveTile(index: number, offset: -1 | 1) {
    const tiles = this.draft?.tiles;
    if (!tiles || !tiles[index + offset]) return;
    [tiles[index], tiles[index + offset]] = [tiles[index + offset], tiles[index]];
    this.clearPreview();
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

  clearPreview() {
    this.widgets = [];
    this.pagedGrids = [];
    this.selected = null;
  }

  run() {
    return this.work(async () => {
      await this.render();
      this.editing = false;
    });
  }

  save() {
    const draft = this.draft && this.catalog ? applyReportingState(this.draft, this.catalog, this.state) : this.draft;
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
    if (!id) return;
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
    else void this.run();
  }

  private async render() {
    if (!this.draft || !this.catalog || this.destroyed) return;
    this.cancelRender();
    this.clearPreview();
    const version = this.renderVersion;
    const stop = this.renderStop = new ReplaySubject<void>(1);
    const effective = applyReportingState(this.draft, this.catalog, this.state);
    const paged = new Set<ReportTile>();
    this.pagedGrids = effective.tiles.flatMap((tile, tileIndex) => {
      const dimension = tile.view === 'grid' && this.dataset(tile)?.dimensions
        .find(field => field.id === tile.query.groupBy && field.grid);
      if (!dimension) return [];
      paged.add(tile);
      return [{ tile: structuredClone(tile), tileIndex, dimension }];
    });

    const [snapshot, inputs] = await Promise.all([
      paged.size === effective.tiles.length ? null : composeReportingSnapshot(effective, this.catalog,
        query => firstValueFrom(this.api.run(query).pipe(takeUntil(stop))), {
          includeTile: tile => !paged.has(tile),
          describeError: error => this.message(error),
        }),
      this.loadInputs(effective, stop),
    ]);
    if (this.destroyed || version !== this.renderVersion) return;
    this.widgets = snapshot ? [snapshot] : [];
    this.inputs = inputs;
    const first = this.draft.tiles[0];
    this.defaultDates = first ? { from: first.query.from, to: first.query.to } : undefined;
    const calendars = effective.tiles.flatMap(tile => this.dataset(tile)?.calendar ?? []);
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
        void this.run();
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

