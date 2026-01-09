import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ProgressBarWidget } from '@bbq-chat/widgets';
import { IWidgetComponent } from '../renderers/AngularWidgetRenderer';

@Component({
  selector: 'bbq-progressbar-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="bbq-widget bbq-progress-bar" 
      [attr.data-widget-type]="'progressbar'">
      <label class="bbq-progress-bar-label" [attr.for]="progressId">
        {{ progressBarWidget.label }}
      </label>
      <progress 
        [id]="progressId"
        class="bbq-progress-bar-element" 
        [value]="progressBarWidget.value"
        [max]="progressBarWidget.max"
        [attr.data-action]="progressBarWidget.action"
        [attr.aria-label]="progressBarWidget.label"
        [attr.aria-valuenow]="progressBarWidget.value"
        [attr.aria-valuemin]="0"
        [attr.aria-valuemax]="progressBarWidget.max">
        {{ percentage }}%
      </progress>
      <span class="bbq-progress-bar-value" aria-live="polite">{{ percentage }}%</span>
    </div>
  `,
  styles: []
})
export class ProgressBarWidgetComponent implements IWidgetComponent, OnInit {
  @Input() widget!: any;
  widgetAction?: (actionName: string, payload: unknown) => void;
  
  progressId = '';
  percentage = 0;

  get progressBarWidget(): ProgressBarWidget {
    return this.widget as ProgressBarWidget;
  }

  ngOnInit() {
    this.progressId = `bbq-${this.progressBarWidget.action.replace(/\s+/g, '-').toLowerCase()}-progress`;
    const max = this.progressBarWidget.max;
    this.percentage = max > 0 ? Math.floor((this.progressBarWidget.value * 100) / max) : 0;
  }
}
