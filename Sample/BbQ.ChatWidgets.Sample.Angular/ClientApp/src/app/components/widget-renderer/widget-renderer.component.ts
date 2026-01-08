import {
  Component,
  OnInit,
  inject,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetRendererComponent as BaseWidgetRendererComponent, WidgetRegistryService } from '@bbq-chat/widgets-angular';
import type { ChatWidget } from '@bbq-chat/widgets-angular';
import { EChartsWidget } from '../../widgets/EChartsWidget';
import { ClockWidget } from '../../widgets/ClockWidget';
import { WeatherWidget } from '../../widgets/WeatherWidget';
import { EChartsWidgetComponent } from '../echarts-widget/echarts-widget.component';
import { ClockWidgetComponent } from '../clock-widget/clock-widget.component';
import { WeatherWidgetComponent } from '../weather-widget/weather-widget.component';

/**
 * Extended WidgetRendererComponent that registers custom widget renderers
 * using the new component-based renderer API.
 * 
 * This component demonstrates the new approach:
 * - ECharts: Component renderer (complex widget with lifecycle)
 * - Clock: Component renderer (SSE-based widget)
 * - Weather: Component renderer (SSE-based widget)
 */
@Component({
  selector: 'app-widget-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #widgetContainer class="bbq-widgets-container" (click)="handleClick($event)">
      @for (item of widgetItems; track item.index) {
        @if (item.isHtml) {
          <div class="bbq-widget" [innerHTML]="item.html"></div>
        } @else {
          <div class="bbq-widget" #dynamicWidget></div>
        }
      }
    </div>
  `,
  styles: [
    `
      .bbq-widgets-container {
        margin-top: 0.5rem;
      }

      .bbq-widget {
        margin-bottom: 0.5rem;
      }
    `,
  ],
})
export class WidgetRendererComponent extends BaseWidgetRendererComponent implements OnInit {
  constructor() {
    super();
  }



  override ngOnInit() {
    this.registerCustomWidgets();
    super.ngOnInit();
  }

  /**
   * Register custom widget factories and renderers using the new API
   */
  private registerCustomWidgets() {
    // Register widget factories for deserialization
    this.widgetRegistry.registerFactory('echarts', (obj: any) => {
      if (obj.type === 'echarts') {
        return new EChartsWidget(
          obj.label || '',
          obj.action || '',
          obj.chartType || 'bar',
          obj.jsonData || '{}'
        );
      }
      return null;
    });

    this.widgetRegistry.registerFactory('clock', (obj: any) => {
      if (obj.type === 'clock') {
        return new ClockWidget(
          obj.label || 'Clock',
          obj.action || 'clock_tick',
          obj.timezone,
          obj.streamId
        );
      }
      return null;
    });

    this.widgetRegistry.registerFactory('weather', (obj: any) => {
      if (obj.type === 'weather') {
        return new WeatherWidget(
          obj.label || 'Weather',
          obj.action || 'weather_update',
          obj.city,
          obj.streamId
        );
      }
      return null;
    });

    // Register component-based renderers using the new API
    // ECharts: Complex widget with chart initialization, event handlers, resize listeners
    this.widgetRegistry.registerRenderer('echarts', EChartsWidgetComponent);
    
    // Clock: SSE-based widget with real-time updates
    this.widgetRegistry.registerRenderer('clock', ClockWidgetComponent);
    
    // Weather: SSE-based widget with real-time weather data
    this.widgetRegistry.registerRenderer('weather', WeatherWidgetComponent);
  }
}
