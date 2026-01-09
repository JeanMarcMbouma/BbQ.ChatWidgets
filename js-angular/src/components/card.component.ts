import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { CardWidget } from '@bbq-chat/widgets';
import { CustomWidgetComponent } from '../custom-widget-renderer.types';

@Component({
  selector: 'bbq-card-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="bbq-widget bbq-card" 
      [attr.data-widget-type]="'card'"
      [attr.data-action]="cardWidget.action"
      role="article">
      <h3 class="bbq-card-title">{{ cardWidget.title }}</h3>
      @if (cardWidget.description) {
        <p class="bbq-card-description">{{ cardWidget.description }}</p>
      }
      @if (cardWidget.imageUrl) {
        <img 
          class="bbq-card-image" 
          [src]="cardWidget.imageUrl" 
          [alt]="cardWidget.title"
          loading="lazy"
          style="display:block;max-width:100%;height:auto;object-fit:cover;max-height:200px;border-radius:6px;margin-bottom:12px;" />
      }
      <button 
        class="bbq-card-action bbq-button" 
        [attr.data-action]="cardWidget.action"
        type="button"
        (click)="onClick()">
        {{ cardWidget.label }}
      </button>
    </div>
  `,
  styles: []
})
export class CardWidgetComponent implements CustomWidgetComponent {
  @Input() widget!: any;
  widgetAction?: (actionName: string, payload: unknown) => void;

  get cardWidget(): CardWidget {
    return this.widget as CardWidget;
  }

  onClick() {
    if (this.widgetAction) {
      this.widgetAction(this.cardWidget.action, {});
    }
  }
}
