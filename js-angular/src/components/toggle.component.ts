import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { ToggleWidget } from '@bbq-chat/widgets';
import { CustomWidgetComponent } from '../custom-widget-renderer.types';

@Component({
  selector: 'bbq-toggle-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div 
      class="bbq-widget bbq-toggle" 
      [attr.data-widget-type]="'toggle'">
      <label class="bbq-toggle-label" [attr.for]="checkboxId">
        <input 
          type="checkbox" 
          [id]="checkboxId"
          [ngClass]="checkboxClasses"
          [attr.data-action]="toggleWidget.action"
          [attr.aria-label]="toggleWidget.label"
          [(ngModel)]="checked" />
        <span *ngIf="showLabel" class="bbq-toggle-text">{{ toggleWidget.label }}</span>
      </label>
    </div>
  `,
  styles: []
})
export class ToggleWidgetComponent implements CustomWidgetComponent, OnInit {
  @Input() widget!: any;
  widgetAction?: (actionName: string, payload: unknown) => void;
  
  checked = false;
  checkboxId = '';

  get toggleWidget(): ToggleWidget {
    return this.widget as ToggleWidget;
  }

  get showLabel(): boolean {
    const widget = this.toggleWidget as any;
    if (widget.hideLabel === true) {
      return false;
    }
    if (widget.showLabel === false) {
      return false;
    }
    return true;
  }

  get checkboxClasses(): string[] {
    return this.isFormAppearance ? ['bbq-toggle-input', 'bbq-form-toggle'] : ['bbq-toggle-input'];
  }

  private get isFormAppearance(): boolean {
    return (this.toggleWidget as any).appearance === 'form';
  }

  ngOnInit() {
    this.checkboxId = `bbq-${this.toggleWidget.action.replace(/\s+/g, '-').toLowerCase()}-checkbox`;
    this.checked = this.toggleWidget.defaultValue ?? false;
  }
}
