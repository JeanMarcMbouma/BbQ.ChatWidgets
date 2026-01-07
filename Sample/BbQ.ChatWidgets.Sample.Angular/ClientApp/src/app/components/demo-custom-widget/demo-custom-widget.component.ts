import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomWidgetComponent, ChatWidget } from '@bbq-chat/widgets-angular';

/**
 * Custom widget that represents a product card
 * Demonstrates Angular component-based custom widget rendering
 */
export class ProductWidget extends ChatWidget {
  constructor(
    type: string,
    label: string,
    action: string,
    public productName: string,
    public price: number,
    public imageUrl: string,
    public inStock: boolean
  ) {
    super(type, label, action);
  }

  override toObject(): any {
    return {
      type: this.type,
      label: this.label,
      action: this.action,
      productName: this.productName,
      price: this.price,
      imageUrl: this.imageUrl,
      inStock: this.inStock,
    };
  }
}

/**
 * Component to render ProductWidget with full Angular features
 */
@Component({
  selector: 'app-demo-custom-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="product-widget" [class.out-of-stock]="!productWidget.inStock">
      <div class="product-image">
        <img [src]="productWidget.imageUrl" [alt]="productWidget.productName" />
        @if (!productWidget.inStock) {
          <div class="out-of-stock-badge">Out of Stock</div>
        }
      </div>
      <div class="product-info">
        <h3 class="product-name">{{ productWidget.productName }}</h3>
        <p class="product-price">\${{ productWidget.price.toFixed(2) }}</p>
        <div class="product-actions">
          @if (productWidget.inStock) {
            <button class="btn-primary" (click)="onAddToCart()">
              Add to Cart
            </button>
          } @else {
            <button class="btn-secondary" (click)="onNotifyMe()">
              Notify Me
            </button>
          }
          <button class="btn-link" (click)="onViewDetails()">
            View Details
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .product-widget {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background: white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: box-shadow 0.3s ease;
    }

    .product-widget:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .product-widget.out-of-stock {
      opacity: 0.7;
    }

    .product-image {
      position: relative;
      width: 120px;
      height: 120px;
      flex-shrink: 0;
    }

    .product-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 4px;
    }

    .out-of-stock-badge {
      position: absolute;
      top: 0;
      right: 0;
      background: #f44336;
      color: white;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      font-weight: bold;
      border-radius: 4px;
    }

    .product-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .product-name {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #333;
    }

    .product-price {
      margin: 0;
      font-size: 1.5rem;
      font-weight: bold;
      color: #2196f3;
    }

    .product-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: auto;
    }

    button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #2196f3;
      color: white;
    }

    .btn-primary:hover {
      background: #1976d2;
    }

    .btn-secondary {
      background: #757575;
      color: white;
    }

    .btn-secondary:hover {
      background: #616161;
    }

    .btn-link {
      background: transparent;
      color: #2196f3;
      border: 1px solid #2196f3;
    }

    .btn-link:hover {
      background: #e3f2fd;
    }
  `]
})
export class DemoCustomWidgetComponent implements CustomWidgetComponent {
  @Input() widget!: ChatWidget;
  widgetAction?: (actionName: string, payload: unknown) => void;

  get productWidget(): ProductWidget {
    return this.widget as ProductWidget;
  }

  onAddToCart() {
    this.widgetAction?.('add_to_cart', {
      productName: this.productWidget.productName,
      price: this.productWidget.price,
    });
  }

  onNotifyMe() {
    this.widgetAction?.('notify_me', {
      productName: this.productWidget.productName,
    });
  }

  onViewDetails() {
    this.widgetAction?.('view_details', {
      productName: this.productWidget.productName,
    });
  }
}
