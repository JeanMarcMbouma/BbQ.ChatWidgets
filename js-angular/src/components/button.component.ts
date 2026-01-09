import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ButtonWidget } from '@bbq-chat/widgets';
import { CustomWidgetComponent } from '../custom-widget-renderer.types';

@Component({
  selector: 'bbq-button-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      class="bbq-widget bbq-button" 
      [attr.data-widget-type]="'button'"
      [attr.data-action]="buttonWidget.action"
      type="button"
      (click)="onClick()">
      {{ buttonWidget.label }}
    </button>
  `,
  styles: []
})
export class ButtonWidgetComponent implements CustomWidgetComponent {
  @Input() widget!: any;
  widgetAction?: (actionName: string, payload: unknown) => void;

  get buttonWidget(): ButtonWidget {
    return this.widget as ButtonWidget;
  }

  onClick() {
    if (this.widgetAction) {
      this.widgetAction(this.buttonWidget.action, {});
    }
  }
}
