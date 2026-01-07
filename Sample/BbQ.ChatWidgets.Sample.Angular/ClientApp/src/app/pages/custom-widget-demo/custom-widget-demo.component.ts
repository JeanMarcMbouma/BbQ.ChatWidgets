import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetRegistryService, WidgetTemplateContext } from '@bbq-chat/widgets-angular';
import type { ChatWidget } from '@bbq-chat/widgets-angular';
import { DemoCustomWidgetComponent, ProductWidget } from '../../components/demo-custom-widget/demo-custom-widget.component';
import { WidgetRendererComponent } from '../../components/widget-renderer/widget-renderer.component';

/**
 * Demo page showcasing custom widget renderers
 * Demonstrates three approaches:
 * 1. HTML function renderer
 * 2. Angular component renderer
 * 3. Angular template renderer
 */
@Component({
  selector: 'app-custom-widget-demo',
  standalone: true,
  imports: [CommonModule, WidgetRendererComponent],
  template: `
    <div class="custom-widget-demo">
      <h1>Custom Widget Renderers Demo</h1>
      
      <div class="info-box">
        <h3>About This Demo</h3>
        <p>
          This page demonstrates the three types of custom widget renderers
          available in the Angular library:
        </p>
        <ol>
          <li><strong>HTML Function Renderer:</strong> Returns HTML strings (simple, no Angular features)</li>
          <li><strong>Component Renderer:</strong> Uses Angular components (full Angular features, recommended)</li>
          <li><strong>Template Renderer:</strong> Uses Angular templates (inline, good for simple cases)</li>
        </ol>
      </div>

      <div class="demo-section">
        <h2>HTML Function Renderer</h2>
        <p class="description">
          Simple function that returns HTML strings. No Angular features, but lightweight.
        </p>
        <div class="widget-container">
          <app-widget-renderer 
            [widgets]="htmlRendererWidgets"
            (widgetAction)="handleAction($event)">
          </app-widget-renderer>
        </div>
      </div>

      <div class="demo-section">
        <h2>Angular Component Renderer (Recommended)</h2>
        <p class="description">
          Uses Angular components with full features: data binding, change detection, 
          dependency injection, and more. Best for complex widgets.
        </p>
        <div class="widget-container">
          <app-widget-renderer 
            [widgets]="componentRendererWidgets"
            (widgetAction)="handleAction($event)">
          </app-widget-renderer>
        </div>
      </div>

      <div class="demo-section">
        <h2>Angular Template Renderer</h2>
        <p class="description">
          Uses inline Angular templates. Good for simple widgets that need Angular features
          but don't warrant a separate component.
        </p>
        <div class="widget-container">
          <app-widget-renderer 
            [widgets]="templateRendererWidgets"
            (widgetAction)="handleAction($event)">
          </app-widget-renderer>
        </div>
      </div>

      <div class="actions-log">
        <h3>Widget Actions Log</h3>
        <div class="log-entries">
          @if (actionLog.length === 0) {
            <p class="no-actions">No actions yet. Click on widget buttons to see actions.</p>
          } @else {
            @for (entry of actionLog; track $index) {
              <div class="log-entry">
                <span class="log-time">{{ entry.time }}</span>
                <span class="log-action">{{ entry.action }}</span>
                <span class="log-payload">{{ entry.payload }}</span>
              </div>
            }
          }
        </div>
      </div>

      <!-- Template for template-based renderer -->
      <ng-template #productTemplate let-widget let-emitAction="emitAction">
        <div class="product-template">
          <h4>{{ widget.productName }}</h4>
          <p class="price">\${{ widget.price }}</p>
          <button (click)="emitAction('template_action', { product: widget.productName })">
            Template Action
          </button>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .custom-widget-demo {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    h1 {
      color: #333;
      margin-bottom: 1rem;
    }

    .info-box {
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      padding: 1rem;
      margin-bottom: 2rem;
      border-radius: 4px;
    }

    .info-box h3 {
      margin-top: 0;
      color: #1976d2;
    }

    .demo-section {
      margin-bottom: 3rem;
      padding: 1.5rem;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .demo-section h2 {
      margin-top: 0;
      color: #555;
    }

    .description {
      color: #666;
      margin-bottom: 1rem;
    }

    .widget-container {
      background: white;
      padding: 1rem;
      border-radius: 4px;
    }

    .actions-log {
      background: #f5f5f5;
      padding: 1.5rem;
      border-radius: 8px;
    }

    .actions-log h3 {
      margin-top: 0;
    }

    .log-entries {
      max-height: 300px;
      overflow-y: auto;
    }

    .no-actions {
      color: #999;
      font-style: italic;
    }

    .log-entry {
      display: flex;
      gap: 1rem;
      padding: 0.5rem;
      margin-bottom: 0.5rem;
      background: white;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.9rem;
    }

    .log-time {
      color: #999;
      min-width: 80px;
    }

    .log-action {
      color: #2196f3;
      font-weight: bold;
      min-width: 150px;
    }

    .log-payload {
      color: #666;
      flex: 1;
    }

    .product-template {
      padding: 1rem;
      border: 2px dashed #2196f3;
      border-radius: 8px;
      background: #e3f2fd;
    }

    .product-template h4 {
      margin-top: 0;
      color: #1976d2;
    }

    .product-template .price {
      font-size: 1.25rem;
      font-weight: bold;
      color: #2196f3;
      margin: 0.5rem 0;
    }

    .product-template button {
      padding: 0.5rem 1rem;
      background: #2196f3;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }

    .product-template button:hover {
      background: #1976d2;
    }
  `]
})
export class CustomWidgetDemoComponent implements OnInit {
  @ViewChild('productTemplate', { static: true })
  productTemplate!: TemplateRef<WidgetTemplateContext>;

  htmlRendererWidgets: ChatWidget[] = [];
  componentRendererWidgets: ChatWidget[] = [];
  templateRendererWidgets: ChatWidget[] = [];

  actionLog: Array<{ time: string; action: string; payload: string }> = [];

  constructor(private widgetRegistry: WidgetRegistryService) {}

  ngOnInit() {
    this.registerCustomWidgets();
    this.setupDemoWidgets();
  }

  private registerCustomWidgets() {
    // Register the ProductWidget factory for all product types
    const productFactory = (obj: any) => {
      if (obj.type && obj.type.startsWith('product')) {
        return new ProductWidget(
          obj.type,
          obj.label,
          obj.action,
          obj.productName,
          obj.price,
          obj.imageUrl,
          obj.inStock
        );
      }
      return null;
    };
    
    this.widgetRegistry.registerFactory('product-html', productFactory);
    this.widgetRegistry.registerFactory('product-component', productFactory);
    this.widgetRegistry.registerFactory('product-template', productFactory);

    // Register different renderers for different demo types
    
    // 1. HTML Function Renderer - simple product card
    this.widgetRegistry.registerRenderer('product-html', (widget: ChatWidget) => {
      const w = widget as ProductWidget;
      return `
        <div style="border: 1px solid #ddd; padding: 1rem; border-radius: 8px; background: white;">
          <h3 style="margin-top: 0;">${w.productName}</h3>
          <p style="font-size: 1.25rem; color: #2196f3; font-weight: bold;">$${w.price}</p>
          <p style="color: ${w.inStock ? 'green' : 'red'};">
            ${w.inStock ? 'In Stock' : 'Out of Stock'}
          </p>
          <button 
            data-action="${w.action}" 
            data-payload='{"type":"html", "product":"${w.productName}"}'
            style="padding: 0.5rem 1rem; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer;">
            HTML Function Action
          </button>
        </div>
      `;
    });

    // 2. Component Renderer - full Angular component
    this.widgetRegistry.registerRenderer('product-component', DemoCustomWidgetComponent);

    // 3. Template Renderer - inline template
    this.widgetRegistry.registerRenderer('product-template', this.productTemplate);
  }

  private setupDemoWidgets() {
    // HTML Function Renderer example
    const htmlWidget = new ProductWidget(
      'product-html',
      'HTML Product',
      'html_action',
      'Wireless Headphones',
      79.99,
      'https://via.placeholder.com/120',
      true
    );
    this.htmlRendererWidgets = [htmlWidget];

    // Component Renderer example
    const componentWidget1 = new ProductWidget(
      'product-component',
      'Component Product 1',
      'component_action',
      'Smart Watch',
      299.99,
      'https://via.placeholder.com/120',
      true
    );

    const componentWidget2 = new ProductWidget(
      'product-component',
      'Component Product 2',
      'component_action',
      'Bluetooth Speaker',
      49.99,
      'https://via.placeholder.com/120',
      false
    );

    this.componentRendererWidgets = [componentWidget1, componentWidget2];

    // Template Renderer example
    const templateWidget = new ProductWidget(
      'product-template',
      'Template Product',
      'template_action',
      'USB-C Cable',
      12.99,
      'https://via.placeholder.com/120',
      true
    );
    this.templateRendererWidgets = [templateWidget];
  }

  handleAction(event: { actionName: string; payload: any }) {
    const time = new Date().toLocaleTimeString();
    const payload = JSON.stringify(event.payload);
    
    this.actionLog.unshift({
      time,
      action: event.actionName,
      payload,
    });

    // Keep only last 20 actions
    if (this.actionLog.length > 20) {
      this.actionLog = this.actionLog.slice(0, 20);
    }

    console.log('Widget action:', event);
  }
}
