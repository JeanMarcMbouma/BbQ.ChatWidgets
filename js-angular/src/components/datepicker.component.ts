import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { DatePickerWidget } from '@bbq-chat/widgets';
import { IWidgetComponent } from '../renderers/AngularWidgetRenderer';

@Component({
  selector: 'bbq-datepicker-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div 
      class="bbq-widget bbq-date-picker" 
      [attr.data-widget-type]="'datepicker'">
      <label class="bbq-date-picker-label" [attr.for]="inputId">
        {{ datePickerWidget.label }}
      </label>
      <input 
        type="date" 
        [id]="inputId"
        class="bbq-date-picker-input" 
        [attr.data-action]="datePickerWidget.action"
        [min]="datePickerWidget.minDate || ''"
        [max]="datePickerWidget.maxDate || ''"
        [attr.aria-labelledby]="inputId"
        [(ngModel)]="value" />
    </div>
  `,
  styles: []
})
export class DatePickerWidgetComponent implements IWidgetComponent, OnInit {
  @Input() widget!: any;
  widgetAction?: (actionName: string, payload: unknown) => void;
  
  value = '';
  inputId = '';

  get datePickerWidget(): DatePickerWidget {
    return this.widget as DatePickerWidget;
  }

  ngOnInit() {
    this.inputId = `bbq-${this.datePickerWidget.action.replace(/\s+/g, '-').toLowerCase()}-date`;
  }
}
