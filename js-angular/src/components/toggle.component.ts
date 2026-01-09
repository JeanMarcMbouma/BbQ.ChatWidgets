import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { ToggleWidget } from '@bbq-chat/widgets';
import { IWidgetComponent } from '../renderers/AngularWidgetRenderer';

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
          class="bbq-toggle-input" 
          [attr.data-action]="toggleWidget.action"
          [attr.aria-label]="toggleWidget.label"
          [(ngModel)]="checked" />
        <span class="bbq-toggle-text">{{ toggleWidget.label }}</span>
      </label>
    </div>
  `,
  styles: []
})
export class ToggleWidgetComponent implements IWidgetComponent, OnInit {
  @Input() widget!: any;
  widgetAction?: (actionName: string, payload: unknown) => void;
  
  checked = false;
  checkboxId = '';

  get toggleWidget(): ToggleWidget {
    return this.widget as ToggleWidget;
  }

  ngOnInit() {
    this.checkboxId = `bbq-${this.toggleWidget.action.replace(/\s+/g, '-').toLowerCase()}-checkbox`;
    this.checked = this.toggleWidget.defaultValue ?? false;
  }
}
