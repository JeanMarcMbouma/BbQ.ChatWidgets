import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { SliderWidget } from '@bbq-chat/widgets';
import { CustomWidgetComponent } from '../custom-widget-renderer.types';

@Component({
  selector: 'bbq-slider-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div 
      class="bbq-widget bbq-slider" 
      [attr.data-widget-type]="'slider'">
      <label class="bbq-slider-label" [attr.for]="sliderId">
        {{ sliderWidget.label }}
      </label>
      <input 
        type="range" 
        [id]="sliderId"
        class="bbq-slider-input" 
        [min]="sliderWidget.min"
        [max]="sliderWidget.max"
        [step]="sliderWidget.step"
        [attr.data-action]="sliderWidget.action"
        [attr.aria-label]="sliderWidget.label"
        [(ngModel)]="value" />
      <span class="bbq-slider-value" aria-live="polite">{{ value }}</span>
    </div>
  `,
  styles: []
})
export class SliderWidgetComponent implements CustomWidgetComponent, OnInit {
  @Input() widget!: any;
  widgetAction?: (actionName: string, payload: unknown) => void;
  
  value: number = 0;
  sliderId = '';

  get sliderWidget(): SliderWidget {
    return this.widget as SliderWidget;
  }

  ngOnInit() {
    this.sliderId = `bbq-${this.sliderWidget.action.replace(/\s+/g, '-').toLowerCase()}-slider`;
    this.value = this.sliderWidget.defaultValue ?? this.sliderWidget.min;
  }
}
