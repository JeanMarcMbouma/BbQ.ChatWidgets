import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, EventEmitter, inject, InjectionToken, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WidgetRendererComponent } from '../widget-renderer.component';
import { firstValueFrom } from 'rxjs';
import { composeReportingSnapshot, isReportingAction, isReportingTimeSeriesKind, reportingViews, type ReportingWidget } from '@bbq-chat/widgets';
import type {
  ReportingCatalog as ReportCatalog, ReportingDataset as ReportDataset,
  ReportingDocument as ReportDefinition, ReportingDocumentKind as ReportKind,
  ReportingActionResolver, ReportingField, ReportingGridRowActivation, ReportingTile as ReportTile,
  ReportingWorkspaceAction, SavedReportingDefinition as SavedReport,
} from '@bbq-chat/widgets';
import { ReportingApi } from './reporting-api';
import { PagedReportingGridComponent } from './paged-grid.component';

/** Optional preset to open when the reporting workspace loads. */
export const REPORTING_INITIAL_PRESET = new InjectionToken<string>('Initial reporting preset');

export type { ReportingWorkspaceAction } from '@bbq-chat/widgets';

/** Standalone workspace for authoring and viewing reports and dashboards. */
@Component({
  selector: 'bbq-reporting, app-reporting',
  standalone: true,
  imports: [FormsModule, WidgetRendererComponent, PagedReportingGridComponent],
  providers: [ReportingApi],
  templateUrl: './reporting.component.html',
  styleUrl: './reporting.component.css',
})
export class ReportingComponent implements OnInit {
  /** Optionally map a tile to a host action name. The default is report-result-<tile index>. */
  @Input() resolveAction?: ReportingActionResolver;

  /** Routes renderer and server-paged grid interactions to the host application. */
  @Output() readonly reportingAction = new EventEmitter<ReportingWorkspaceAction>();

  private readonly api = inject(ReportingApi);
  private readonly initialPreset = inject(REPORTING_INITIAL_PRESET, { optional: true });
  private readonly detector = inject(ChangeDetectorRef);

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

  load() {
    return this.work(async () => {
      const [catalog, saved] = await Promise.all([
        firstValueFrom(this.api.catalog()), firstValueFrom(this.api.list()),
      ]);
      this.catalog = catalog;
      this.saved = saved;
      const preset = catalog.presets.find(item => item.id === this.initialPreset) ?? catalog.presets[0];
      const first = preset ?? saved[0];
      if (first) {
        this.open(first, !preset);
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
    return !grouping?.dateField && grouping?.id !== 'day';
  }

  changeDataset(tile: ReportTile, id: string) {
    tile.query.dataset = id;
    tile.query.metric = this.dataset(tile)?.metrics[0]?.id ?? '';
    tile.query.groupBy = null;
    this.clearPreview();
  }

  open(report: SavedReport, saved: boolean) {
    this.draft = structuredClone(report.definition);
    this.savedId = saved ? report.id : null;
    this.presetId = saved ? null : report.id;
    this.editing = false;
    this.error = this.status = '';
    this.clearPreview();
  }

  start(kind: ReportKind) {
    this.draft = { title: '', kind, tiles: [this.newTile()] };
    this.savedId = null;
    this.presetId = null;
    this.editing = true;
    this.error = this.status = '';
    this.clearPreview();
  }

  addTile() {
    this.draft?.tiles.push(this.newTile());
    this.clearPreview();
  }

  removeTile(index: number) {
    this.draft?.tiles.splice(index, 1);
    this.clearPreview();
  }

  moveTile(index: number, offset: -1 | 1) {
    const tiles = this.draft?.tiles;
    if (!tiles || !tiles[index + offset]) return;
    [tiles[index], tiles[index + offset]] = [tiles[index + offset], tiles[index]];
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
    const draft = this.draft;
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
    this.reportingAction.emit({ actionName, tile: snapshot, tileIndex, payload });
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

  private async render() {
    if (!this.draft || !this.catalog) return;
    this.clearPreview();
    const paged = new Set<ReportTile>();
    this.pagedGrids = this.draft.tiles.flatMap((tile, tileIndex) => {
      const dimension = tile.view === 'grid' && this.dataset(tile)?.dimensions
        .find(field => field.id === tile.query.groupBy && field.grid);
      if (!dimension) return [];
      paged.add(tile);
      return [{ tile: structuredClone(tile), tileIndex, dimension }];
    });
    if (paged.size === this.draft.tiles.length) return;

    const snapshot = await composeReportingSnapshot(this.draft, this.catalog, query => firstValueFrom(this.api.run(query)), {
      includeTile: tile => !paged.has(tile),
      describeError: error => this.message(error),
    });
    this.widgets = [snapshot];
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

