import { DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ChatWidget } from '@bbq-chat/widgets';
import { WidgetRegistryService } from '@bbq-chat/widgets-angular';
import type { ReportRow, ReportView } from './reporting-api';

const resultType = 'app-report-result';

export class ReportResultWidget extends ChatWidget {
  constructor(
    label: string,
    readonly view: ReportView,
    readonly rows: readonly ReportRow[],
    readonly error?: string,
  ) {
    super(resultType, label, 'report-row-selected');
  }

  toObject() {
    return { type: this.type, label: this.label, action: this.action, view: this.view, rows: this.rows, error: this.error };
  }
}

@Component({
  selector: 'app-report-result',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './report-result.widget.html',
  styles: [`
    :host { display: block; min-width: 0; }
    h3 { margin: 0 0 .7rem; }
    .result-actions { display: flex; flex-wrap: wrap; gap: .5rem; margin: .5rem 0; }
    .result-actions button, td button {
      color: #234f89; background: #fff; padding: .3rem .55rem;
      border: 1px solid #879ab5; border-radius: .35rem; cursor: pointer;
    }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    td, th { padding: .35rem .4rem; border-bottom: 1px solid #e1e8f0; overflow-wrap: anywhere; }
    td:last-child, th:last-child { text-align: right; }
    tr[data-selected="true"] { background: #eaf2ff; }
    .plot { max-height: 21rem; overflow: auto; padding: .15rem; }
    .plot button {
      width: 100%; display: grid; grid-template-columns: minmax(0, 1fr) 2fr auto;
      gap: .45rem; align-items: center; text-align: left;
      padding: .45rem; background: white; color: #17233a;
      border: 1px solid transparent; cursor: pointer;
    }
    .plot button:hover, .plot button[aria-pressed="true"] { background: #eaf2ff; border-color: #abc3e7; }
    .plot span { overflow-wrap: anywhere; }
    svg { display: block; width: 100%; height: .8rem; background: #edf1f7; border-radius: .2rem; }
    .error { color: #982829; }
  `],
})
export class ReportResultComponent {
  // ChatWidgets 1.1.1 renders this component as an independent Angular view.
  private readonly detector = inject(ChangeDetectorRef);
  widget!: ReportResultWidget;
  widgetAction?: (action: string, payload: unknown) => void;
  selected: ReportRow | null = null;
  viewOverride: ReportView | null = null;
  highestFirst = false;

  get view() { return this.viewOverride ?? this.widget.view; }

  get rows() {
    return this.highestFirst ? [...this.widget.rows].sort((a, b) => b.value - a.value) : this.widget.rows;
  }

  get scale() {
    const values = this.widget.rows.map(row => row.value);
    const low = Math.min(0, ...values);
    const high = Math.max(0, ...values);
    return { low, span: high - low || 1 };
  }

  toggleView() {
    this.viewOverride = this.view === 'bar' ? 'table' : 'bar';
    this.detector.detectChanges();
  }

  toggleSort() {
    this.highestFirst = !this.highestFirst;
    this.detector.detectChanges();
  }

  select(row: ReportRow) {
    this.selected = this.selected === row ? null : row;
    this.detector.detectChanges();
    this.widgetAction?.(this.widget.action, { tile: this.widget.label, row: this.selected });
  }
}

export function registerReportResultWidget(registry = inject(WidgetRegistryService)) {
  registry.registerRenderer(resultType, ReportResultComponent);
}
