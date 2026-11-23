import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { reportingDatePreset, setReportingInput } from '@bbq-chat/widgets';
import type { ReportingCalendar, ReportingDateRange, ReportingInput, ReportingInputValue, ReportingState } from '@bbq-chat/widgets';

/** Optional shared single-choice inputs and calendar controls for a reporting workspace. */
@Component({
  selector: 'bbq-reporting-controls',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fieldset class="filter-panel" aria-label="Report filters" [disabled]="disabled">
      <header class="filter-header">
        <div>
          <h3>Report filters</h3>
          @if (calendar?.label; as label) { <p>{{ label }}</p> }
        </div>
        <button class="clear-filters" type="button" (click)="stateChange.emit({})">Clear all filters</button>
      </header>

      <div class="filter-fields">
        @for (input of inputs; track input.id) {
          <label>
            {{ input.label }}
            <select [disabled]="!input.options?.length" [ngModel]="selected(input)" (ngModelChange)="select(input, $event)">
              <option [ngValue]="undefined">Use report setting</option>
              @for (option of input.options ?? []; track option.value) {
                <option [ngValue]="option.value">{{ option.label }}</option>
              }
            </select>
          </label>
        }
        @if (calendar) {
          <form class="date-fields" (ngSubmit)="applyDates()">
            <label>From <input type="date" name="from" required [(ngModel)]="from" /></label>
            <label>Through <input type="date" name="to" required [min]="from" [(ngModel)]="to" /></label>
            <button class="apply-dates" type="submit" [disabled]="!range">Apply dates</button>
          </form>
        }
      </div>

      @if (calendar && from && to && !range) {
        <p class="date-error" role="status">Choose an inclusive date range of up to {{ calendar.maxDays }} days.</p>
      }
    </fieldset>
  `,
  styleUrl: './reporting-controls.component.css',
})
export class ReportingControlsComponent implements OnChanges {
  @Input() inputs: readonly ReportingInput[] = [];
  @Input() calendar?: ReportingCalendar;
  @Input() defaultDates?: ReportingDateRange;
  @Input() state: ReportingState = {};
  @Input() disabled = false;

  @Output() readonly stateChange = new EventEmitter<ReportingState>();

  from = '';
  to = '';

  ngOnChanges(): void {
    const dates = this.state.dates ?? this.defaultDates;
    this.from = dates?.from ?? '';
    this.to = dates?.to ?? '';
  }

  selected(input: ReportingInput): ReportingInputValue | undefined {
    return this.state.inputs?.find(selection => selection.id === input.id)?.value;
  }

  select(input: ReportingInput, value: ReportingInputValue | undefined): void {
    const next = setReportingInput(this.state, input, value);
    if (next !== this.state) this.stateChange.emit(next);
  }

  get range(): ReportingDateRange | undefined {
    if (!this.calendar || !this.from || !this.to || this.from > this.to) return undefined;
    const days = Math.round((Date.parse(this.to) - Date.parse(this.from)) / 86_400_000) + 1;
    const range = reportingDatePreset({ ...this.calendar, today: this.to }, days);
    return range?.from === this.from ? range : undefined;
  }

  applyDates(): void {
    if (this.range) this.stateChange.emit({ ...this.state, dates: this.range });
  }
}
