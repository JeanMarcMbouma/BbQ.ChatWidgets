import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { MultiSelectWidget } from '@bbq-chat/widgets';
import { IWidgetComponent } from '../renderers/AngularWidgetRenderer';

@Component({
  selector: 'bbq-multiselect-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div 
      class="bbq-widget bbq-multi-select" 
      [attr.data-widget-type]="'multiselect'">
      <label class="bbq-multi-select-label" [attr.for]="selectId">
        {{ multiSelectWidget.label }}
      </label>
      <select 
        [id]="selectId"
        class="bbq-multi-select-select" 
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
export class MultiSelectWidgetComponent implements IWidgetComponent, OnInit {
  @Input() widget!: any;
  widgetAction?: (actionName: string, payload: unknown) => void;
  
  values: string[] = [];
  selectId = '';

  get multiSelectWidget(): MultiSelectWidget {
    return this.widget as MultiSelectWidget;
  }

  ngOnInit() {
    this.selectId = `bbq-${this.multiSelectWidget.action.replace(/\s+/g, '-').toLowerCase()}-select`;
  }
}
