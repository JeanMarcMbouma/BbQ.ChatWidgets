import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ImageWidget } from '@bbq-chat/widgets';
import { IWidgetComponent } from '../renderers/AngularWidgetRenderer';

@Component({
  selector: 'bbq-image-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="bbq-widget bbq-image" 
      [attr.data-widget-type]="'image'"
      [attr.data-action]="imageWidget.action">
      <img 
        class="bbq-image-img" 
        [src]="imageWidget.imageUrl" 
        [alt]="imageWidget.alt || 'Image'"
        [style.width]="imageWidget.width ? imageWidget.width + 'px' : 'auto'"
        [style.height]="imageWidget.height ? imageWidget.height + 'px' : 'auto'"
        loading="lazy" />
    </div>
  `,
  styles: []
})
export class ImageWidgetComponent implements IWidgetComponent {
  @Input() widget!: any;
  widgetAction?: (actionName: string, payload: unknown) => void;

  get imageWidget(): ImageWidget {
    return this.widget as ImageWidget;
  }
}
