import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WidgetRendererComponent } from '@bbq-chat/widgets-angular';
import { firstValueFrom } from 'rxjs';
import { ReportingWidget, type ReportingAction, type ReportingRow } from '@bbq-chat/widgets';
import {
  ReportCatalog, ReportDataset, ReportDefinition, ReportKind, ReportTile,
  ReportingApi, reportViews, SavedReport,
} from './reporting-api';

@Component({
  selector: 'app-reporting',
  standalone: true,
  imports: [FormsModule, WidgetRendererComponent],
  templateUrl: './reporting.component.html',
  styleUrl: './reporting.component.css',
})
export class ReportingComponent implements OnInit {
  private readonly api = inject(ReportingApi);
  private readonly detector = inject(ChangeDetectorRef);

  catalog: ReportCatalog | null = null;
  saved: SavedReport[] = [];
  draft: ReportDefinition | null = null;
  savedId: string | null = null;
  readonly views = reportViews;
  widgets: ReportingWidget[] = [];
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
      const first = catalog.presets.find(preset => preset.id === 'order-overview') ?? catalog.presets[0];
      if (first) {
        this.open(first, false);
        await this.render();
      }
    });
  }

  dataset(tile: ReportTile): ReportDataset | undefined {
    return this.catalog?.datasets.find(dataset => dataset.id === tile.query.dataset);
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
    this.error = this.status = '';
    this.clearPreview();
  }

  start(kind: ReportKind) {
    this.draft = { title: '', kind, tiles: [this.newTile()] };
    this.savedId = null;
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
    this.selected = null;
  }

  run() {
    return this.work(() => this.render());
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
    const payload = event.payload as ReportingAction;
    const tile = this.draft?.tiles[Number(event.actionName.slice('report-result-'.length))];
    if (!event.actionName.startsWith('report-result-') || !tile || payload?.kind !== 'select') return;
    this.selected = payload.row
      ? tile.title + ' · ' + String(payload.row['label'] ?? '')
      : tile.title + ' · ' + payload.rowIndices.length + ' selected';
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
    if (!this.draft) return;
    this.clearPreview();
    const requests = new Map<string, { id: string; result: Promise<{ rows: ReportingRow[]; error?: string }> }>();
    const tiles = this.draft.tiles.map(tile => {
      const key = JSON.stringify(tile.query);
      let request = requests.get(key);
      if (!request) {
        const result = firstValueFrom(this.api.run(tile.query)).then(rows => ({
          rows: rows.map((row, index) => ({ ...row, x: index + 1, date: tile.query.groupBy === 'day' ? row.label : null })),
        })).catch(error => ({ rows: [], error: this.message(error) }));
        request = { id: 'source-' + requests.size, result };
        requests.set(key, request);
      }
      return { tile, request };
    });

    const sources: Record<string, ReportingRow[]> = {};
    const filters: ReportingWidget[] = [];
    const children = await Promise.all(tiles.map(async ({ tile, request }, index) => {
      const { rows, error } = await request.result;
      return new ReportingWidget(tile.title, 'report-result-' + index, tile.view, {
        settings: { dataSource: request.id },
        filterField: tile.view === 'filter' ? 'label' : undefined,
        rows: error ? [] : undefined,
        error,
      });
    }));
    for (const { id, result } of requests.values()) {
      const { rows } = await result;
      sources[id] = rows;
      const matching = tiles.filter(({ request }) => request.id === id);
      if (rows.length > 1 && matching.length > 1 && !matching.some(({ tile }) => tile.view === 'filter')) {
        filters.push(new ReportingWidget('Filter ' + matching[0].tile.title, '', 'filter', {
          settings: { dataSource: id }, filterField: 'label',
        }));
      }
    }

    this.widgets = [new ReportingWidget(this.draft.title, '', 'dashboard', {
      settings: { categoryField: 'label', valueField: 'value', xField: 'x', dateField: 'date',
        columns: [{ field: 'label', label: 'Group' }, { field: 'value', label: 'Value' }] },
      sources,
      children: [...filters, ...children],
    })];
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
