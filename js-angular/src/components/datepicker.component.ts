import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { DatePickerWidget } from '@bbq-chat/widgets';
import { CustomWidgetComponent } from '../custom-widget-renderer.types';
import { typeMap } from './typeMap';

@Component({
  selector: 'bbq-datepicker-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div 
      class="bbq-widget bbq-date-picker" 
      [attr.data-widget-type]="'datepicker'">
      <label *ngIf="showLabel" class="bbq-date-picker-label" [attr.for]="inputId">
        {{ datePickerWidget.label }}
      </label>
      <input 
        type="date" 
        [id]="inputId"
        [ngClass]="inputClasses"
        [attr.data-action]="datePickerWidget.action"
        [min]="datePickerWidget.minDate || ''"
        [max]="datePickerWidget.maxDate || ''"
        [(ngModel)]="value" />
    </div>
  `,
  styles: []
})
export class DatePickerWidgetComponent implements CustomWidgetComponent, OnInit {
  @Input() widget!: any;
  widgetAction?: (actionName: string, payload: unknown) => void;
  
  value = '';
  inputId = '';

  get datePickerWidget(): DatePickerWidget {
    return this.widget as DatePickerWidget;
  }

  get showLabel(): boolean {
    const widget = this.datePickerWidget as any;
    if (widget.hideLabel === true) {
      return false;
    }
    if (widget.showLabel === false) {
      return false;
    }
    return true;
  }

  get inputClasses(): string[] {
    return this.isFormAppearance ? ['bbq-form-datepicker'] : ['bbq-form-datepicker', 'bbq-input'];
  }

  private get isFormAppearance(): boolean {
    return (this.datePickerWidget as any).appearance === 'form';
  }

  ngOnInit() {
    const type = typeMap[this.datePickerWidget.type] || 'date';
    this.inputId = `bbq-${this.datePickerWidget.action.replace(/\s+/g, '-').toLowerCase()}-${type}`;
    this.value = (this.datePickerWidget as any).defaultValue ?? '';
  }
}
