import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { InputWidget } from '@bbq-chat/widgets';
import { IWidgetComponent } from '../renderers/AngularWidgetRenderer';

@Component({
  selector: 'bbq-input-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div 
      class="bbq-widget bbq-input" 
      [attr.data-widget-type]="'input'">
      <label class="bbq-input-label" [attr.for]="inputId">
        {{ inputWidget.label }}
      </label>
      <input 
        type="text" 
        [id]="inputId"
        class="bbq-input-field" 
        [attr.data-action]="inputWidget.action"
        [placeholder]="inputWidget.placeholder || ''"
        [maxLength]="inputWidget.maxLength || 0"
        [attr.aria-labelledby]="inputId"
        [(ngModel)]="value" />
    </div>
  `,
  styles: []
})
export class InputWidgetComponent implements IWidgetComponent, OnInit {
  @Input() widget!: any;
  widgetAction?: (actionName: string, payload: unknown) => void;
  
  value = '';
  inputId = '';

  get inputWidget(): InputWidget {
    return this.widget as InputWidget;
  }

  ngOnInit() {
    this.inputId = `bbq-${this.inputWidget.action.replace(/\s+/g, '-').toLowerCase()}-input`;
  }
}
