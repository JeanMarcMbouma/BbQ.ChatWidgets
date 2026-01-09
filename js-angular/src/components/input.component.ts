import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { InputWidget } from '@bbq-chat/widgets';
import { CustomWidgetComponent } from '../custom-widget-renderer.types';

@Component({
  selector: 'bbq-input-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div 
      class="bbq-widget bbq-input" 
      [attr.data-widget-type]="'input'">
      <label *ngIf="showLabel" class="bbq-input-label" [attr.for]="inputId">
        {{ inputWidget.label }}
      </label>
      <input 
        type="text" 
        [id]="inputId"
        [ngClass]="inputClasses"
        [attr.data-action]="inputWidget.action"
        [placeholder]="inputWidget.placeholder || ''"
        [maxLength]="inputWidget.maxLength || 0"
        [(ngModel)]="value" />
    </div>
  `,
  styles: []
})
export class InputWidgetComponent implements CustomWidgetComponent, OnInit {
  @Input() widget!: any;
  widgetAction?: (actionName: string, payload: unknown) => void;
  
  value = '';
  inputId = '';

  get inputWidget(): InputWidget {
    return this.widget as InputWidget;
  }

  get showLabel(): boolean {
    const widget = this.inputWidget as any;
    if (widget.hideLabel === true) {
      return false;
    }
    if (widget.showLabel === false) {
      return false;
    }
    return true;
  }

  get inputClasses(): string[] {
    return this.isFormAppearance ? ['bbq-form-input'] : ['bbq-input'];
  }

  private get isFormAppearance(): boolean {
    return (this.inputWidget as any).appearance === 'form';
  }

  ngOnInit() {
    this.inputId = `bbq-${this.inputWidget.action.replace(/\s+/g, '-').toLowerCase()}-input`;
  }
}
