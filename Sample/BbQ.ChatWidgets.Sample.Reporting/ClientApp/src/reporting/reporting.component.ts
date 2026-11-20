import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WidgetRendererComponent } from '@bbq-chat/widgets-angular';
import { firstValueFrom } from 'rxjs';
import { registerReportResultWidget, ReportResultWidget } from './report-result.widget';
import {
  ReportCatalog, ReportDataset, ReportDefinition, ReportKind, ReportTile,
  ReportingApi, SavedReport,
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
  widgets: ReportResultWidget[][] = [];
  selected: string | null = null;
  busy = false;
  error = '';
  status = '';

  constructor() {
    registerReportResultWidget();
  }

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
      const first = catalog.presets.find(preset => preset.definition.kind === 'dashboard') ?? catalog.presets[0];
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
    if (event.actionName !== 'report-row-selected') return;
    const payload = event.payload as { tile: string; row: { label: string } | null };
    this.selected = payload.row ? payload.tile + ' · ' + payload.row.label : null;
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
    this.widgets = await Promise.all(this.draft.tiles.map(async tile => {
      try {
        const rows = await firstValueFrom(this.api.run(tile.query));
        return [new ReportResultWidget(tile.title, tile.view, rows)];
      } catch (error) {
        return [new ReportResultWidget(tile.title, tile.view, [], this.message(error))];
      }
    }));
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
