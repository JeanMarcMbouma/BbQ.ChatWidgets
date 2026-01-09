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
      <label *ngIf="showLabel" class="bbq-slider-label" [attr.for]="sliderId">
        {{ sliderWidget.label }}
      </label>
      <input 
        type="range" 
        [id]="sliderId"
        [ngClass]="sliderClasses"
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

  get showLabel(): boolean {
    const widget = this.sliderWidget as any;
    if (widget.hideLabel === true) {
      return false;
    }
    if (widget.showLabel === false) {
      return false;
    }
    return true;
  }

  get sliderClasses(): string[] {
    return this.isFormAppearance ? ['bbq-form-slider'] : ['bbq-slider'];
  }

  private get isFormAppearance(): boolean {
    return (this.sliderWidget as any).appearance === 'form';
  }

  ngOnInit() {
    this.sliderId = `bbq-${this.sliderWidget.action.replace(/\s+/g, '-').toLowerCase()}-slider`;
    this.value = this.sliderWidget.defaultValue ?? this.sliderWidget.min;
  }
}
