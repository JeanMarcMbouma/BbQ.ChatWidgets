import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { TextAreaWidget } from '@bbq-chat/widgets';
import { IWidgetComponent } from '../renderers/AngularWidgetRenderer';

@Component({
  selector: 'bbq-textarea-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div 
      class="bbq-widget bbq-textarea" 
      [attr.data-widget-type]="'textarea'">
      <label class="bbq-textarea-label" [attr.for]="textareaId">
        {{ textareaWidget.label }}
      </label>
      <textarea 
        [id]="textareaId"
        class="bbq-textarea-field" 
        [attr.data-action]="textareaWidget.action"
        [placeholder]="textareaWidget.placeholder || ''"
        [maxLength]="textareaWidget.maxLength || 0"
        [rows]="textareaWidget.rows || 4"
        [(ngModel)]="value"></textarea>
    </div>
  `,
  styles: []
})
export class TextAreaWidgetComponent implements IWidgetComponent, OnInit {
  @Input() widget!: any;
  widgetAction?: (actionName: string, payload: unknown) => void;
  
  value = '';
  textareaId = '';

  get textareaWidget(): TextAreaWidget {
    return this.widget as TextAreaWidget;
  }

  ngOnInit() {
    this.textareaId = `bbq-${this.textareaWidget.action.replace(/\s+/g, '-').toLowerCase()}-textarea`;
  }
}
