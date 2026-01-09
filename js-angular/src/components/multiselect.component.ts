import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { MultiSelectWidget } from '@bbq-chat/widgets';
import { CustomWidgetComponent } from '../custom-widget-renderer.types';

@Component({
  selector: 'bbq-multiselect-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div 
      class="bbq-widget bbq-multi-select" 
      [attr.data-widget-type]="'multiselect'">
      <label *ngIf="showLabel" class="bbq-multi-select-label" [attr.for]="selectId">
        {{ multiSelectWidget.label }}
      </label>
      <select 
        [id]="selectId"
        [ngClass]="selectClasses"
        [attr.data-action]="multiSelectWidget.action"
        multiple
        [(ngModel)]="values">
        @for (option of multiSelectWidget.options; track option) {
          <option [value]="option">{{ option }}</option>
        }
      </select>
    </div>
  `,
  styles: []
})
export class MultiSelectWidgetComponent implements CustomWidgetComponent, OnInit {
  @Input() widget!: any;
  widgetAction?: (actionName: string, payload: unknown) => void;
  
  values: string[] = [];
  selectId = '';

  get multiSelectWidget(): MultiSelectWidget {
    return this.widget as MultiSelectWidget;
  }

  get showLabel(): boolean {
    const widget = this.multiSelectWidget as any;
    if (widget.hideLabel === true) {
      return false;
    }
    if (widget.showLabel === false) {
      return false;
    }
    return true;
  }

  get selectClasses(): string[] {
    return this.isFormAppearance 
      ? ['bbq-form-multiselect', 'bbq-form-select']
      : ['bbq-form-multiselect', 'bbq-form-select'];
  }

  private get isFormAppearance(): boolean {
    return (this.multiSelectWidget as any).appearance === 'form';
  }

  ngOnInit() {
    this.selectId = `bbq-${this.multiSelectWidget.action.replace(/\s+/g, '-').toLowerCase()}-select`;
  }
}
