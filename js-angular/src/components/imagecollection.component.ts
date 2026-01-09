import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ImageCollectionWidget } from '@bbq-chat/widgets';
import { CustomWidgetComponent } from '../custom-widget-renderer.types';

@Component({
  selector: 'bbq-imagecollection-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="bbq-widget bbq-image-collection" 
      [attr.data-widget-type]="'imagecollection'"
      [attr.data-action]="imageCollectionWidget.action">
      <div class="bbq-image-collection-grid">
        @for (image of imageCollectionWidget.images; track image.imageUrl) {
          <div class="bbq-image-collection-item">
            <img 
              class="bbq-image-collection-img" 
              [src]="image.imageUrl" 
              [alt]="image.alt || 'Image'"
              [style.width]="image.width ? image.width + 'px' : 'auto'"
              [style.height]="image.height ? image.height + 'px' : 'auto'"
              loading="lazy" />
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class ImageCollectionWidgetComponent implements CustomWidgetComponent {
  @Input() widget!: any;
  widgetAction?: (actionName: string, payload: unknown) => void;

  get imageCollectionWidget(): ImageCollectionWidget {
    return this.widget as ImageCollectionWidget;
  }
}
