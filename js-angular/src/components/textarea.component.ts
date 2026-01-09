import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { TextAreaWidget } from '@bbq-chat/widgets';
import { CustomWidgetComponent } from '../custom-widget-renderer.types';

@Component({
  selector: 'bbq-textarea-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div 
      class="bbq-widget bbq-textarea" 
      [attr.data-widget-type]="'textarea'">
      <label *ngIf="showLabel" class="bbq-textarea-label" [attr.for]="textareaId">
        {{ textareaWidget.label }}
      </label>
      <textarea 
        [id]="textareaId"
        [ngClass]="textareaClasses"
        [attr.data-action]="textareaWidget.action"
        [placeholder]="textareaWidget.placeholder || ''"
        [maxLength]="textareaWidget.maxLength || 0"
        [rows]="textareaWidget.rows || 4"
        [(ngModel)]="value"></textarea>
    </div>
  `,
  styles: []
})
export class TextAreaWidgetComponent implements CustomWidgetComponent, OnInit {
  @Input() widget!: any;
  widgetAction?: (actionName: string, payload: unknown) => void;
  
  value = '';
  textareaId = '';

  get textareaWidget(): TextAreaWidget {
    return this.widget as TextAreaWidget;
  }

  get showLabel(): boolean {
    const widget = this.textareaWidget as any;
    if (widget.hideLabel === true) {
      return false;
    }
    if (widget.showLabel === false) {
      return false;
    }
    return true;
  }

  get textareaClasses(): string[] {
    return this.isFormAppearance ? ['bbq-form-textarea'] : ['bbq-form-textarea', 'bbq-input'];
  }

  private get isFormAppearance(): boolean {
    return (this.textareaWidget as any).appearance === 'form';
  }

  ngOnInit() {
    this.textareaId = `bbq-${this.textareaWidget.action.replace(/\s+/g, '-').toLowerCase()}-textarea`;
  }
}
