import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SsrWidgetRenderer, WidgetEventManager, customWidgetRegistry } from '@bbq/chatwidgets';
import type { ChatWidget } from '@bbq/chatwidgets';
import * as echarts from 'echarts';
import { EChartsWidget } from '../../widgets/EChartsWidget';
import { renderECharts } from '../../widgets/echartsRenderer';
import { ClockWidget } from '../../widgets/ClockWidget';
import { renderClock } from '../../widgets/clockRenderer';
import { WeatherWidget } from '../../widgets/WeatherWidget';
import { renderWeather } from '../../widgets/weatherRenderer';

declare global {
  interface Window {
    echarts: typeof echarts;
  }
}

let customRegistrationsDone = false;
function ensureCustomRegistrations() {
  if (customRegistrationsDone) return;
  customRegistrationsDone = true;

  // Make echarts available globally for inline scripts in rendered HTML
  window.echarts = echarts;

  // Register custom ECharts widget with factory function for proper deserialization
  customWidgetRegistry.registerFactory('echarts', (obj: any) => {
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

  // Register clock widget factory
  customWidgetRegistry.registerFactory('clock', (obj: any) => {
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

  // Register weather widget factory
  customWidgetRegistry.registerFactory('weather', (obj: any) => {
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
}

@Component({
  selector: 'app-widget-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #widgetContainer class="widgets-container" (click)="handleClick($event)">
      @for (widgetHtml of widgetHtmlList; track $index) {
        <div class="widget" [innerHTML]="widgetHtml"></div>
      }
    </div>
  `,
  styles: [`
    .widgets-container {
      margin-top: 0.5rem;
    }
    
    .widget {
      margin-bottom: 0.5rem;
    }
  `]
})
export class WidgetRendererComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() widgets: ChatWidget[] | null | undefined;
  @Output() widgetAction = new EventEmitter<{ actionName: string; payload: any }>();
  @ViewChild('widgetContainer', { static: false }) containerRef!: ElementRef<HTMLDivElement>;

  widgetHtmlList: string[] = [];
  private renderer = new SsrWidgetRenderer();
  private eventManager?: WidgetEventManager;

  ngOnInit() {
    ensureCustomRegistrations();
    this.updateWidgetHtml();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['widgets']) {
      this.updateWidgetHtml();
    }
  }

  ngAfterViewInit() {
    this.setupEventHandlers();
  }

  ngOnDestroy() {
    this.cleanupStreams();
  }

  private updateWidgetHtml() {
    if (!this.widgets || this.widgets.length === 0) {
      this.widgetHtmlList = [];
      return;
    }

    this.widgetHtmlList = this.widgets.map((widget, index) => {
      // Handle custom ECharts widget rendering
      if (widget.type === 'echarts') {
        const echartsWidget = widget as EChartsWidget;
        return renderECharts(echartsWidget);
      }

      // Handle clock widget rendering
      if (widget.type === 'clock') {
        const clockWidget = widget as ClockWidget;
        return renderClock(clockWidget);
      }

      // Handle weather widget rendering
      if (widget.type === 'weather') {
        const weatherWidget = widget as WeatherWidget;
        return renderWeather(weatherWidget);
      }

      // Render all other built-in widgets using library renderer
      return this.renderer.renderWidget(widget);
    });

    // After view updates, reinitialize widgets
    setTimeout(() => {
      this.setupEventHandlers();
    }, 0);
  }

  private setupEventHandlers() {
    if (!this.containerRef?.nativeElement) return;

    const container = this.containerRef.nativeElement;

    // Create a custom action handler that emits events
    const actionHandler = {
      handle: async (action: string, payload: any) => {
        this.widgetAction.emit({ actionName: action, payload });
      },
    };

    // Attach event handlers using WidgetEventManager
    this.eventManager = new WidgetEventManager(actionHandler);
    this.eventManager.attachHandlers(container);

    // Initialize ECharts widgets
    this.initializeECharts(container);

    // Attach ECharts click handlers
    this.attachEChartsHandlers(container, actionHandler);

    // Initialize clock widgets with SSE subscriptions
    this.initializeClockWidgets(container);

    // Initialize weather widgets with SSE subscriptions
    this.initializeWeatherWidgets(container);
  }

  handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // Only trigger actions on non-form buttons and clickable elements (cards)
    // Don't trigger on input elements or form buttons (let WidgetEventManager handle those)
    const button = target.tagName === 'BUTTON' ? target : target.closest('button');
    if (button && !button.closest('[data-widget-type="form"]')) {
      const actionName = button.getAttribute('data-action');
      if (actionName) {
        try {
          const payloadStr = button.getAttribute('data-payload');
          const payload = payloadStr ? JSON.parse(payloadStr) : {};
          this.widgetAction.emit({ actionName, payload });
        } catch (err) {
          console.error('Failed to parse widget action payload:', err);
        }
      }
    }
  }

  /**
   * Initialize ECharts widgets by parsing data attributes and rendering charts
   */
  private initializeECharts(container: HTMLElement) {
    const echartsContainers = container.querySelectorAll('[data-widget-type="echarts"]');

    echartsContainers.forEach((widget) => {
      const chartContainer = widget.querySelector('.echarts-container') as HTMLElement;
      const jsonDataStr = widget.getAttribute('data-chart-data');

      if (!chartContainer || !jsonDataStr) {
        console.error('Missing chart container or data');
        return;
      }

      try {
        // Parse the JSON data
        const options = JSON.parse(jsonDataStr);

        // Initialize the chart
        const myChart = window.echarts.init(chartContainer);
        myChart.setOption(options);

        // Store reference for resize handling
        window.addEventListener('resize', () => {
          if (myChart) myChart.resize();
        });
      } catch (e) {
        console.error('Failed to initialize ECharts:', e);
        console.error('Chart data:', jsonDataStr);
      }
    });
  }

  /**
   * Attach ECharts click event handlers
   */
  private attachEChartsHandlers(
    container: HTMLElement,
    actionHandler: { handle: (action: string, payload: any) => void }
  ) {
    const echartsContainers = container.querySelectorAll('[data-widget-type="echarts"]');

    echartsContainers.forEach((widget) => {
      const chartContainer = widget.querySelector('.echarts-container') as HTMLElement;
      if (!chartContainer) return;

      // Wait for ECharts to initialize and attach click handler
      const attachClickHandler = () => {
        if (typeof (window as any).echarts === 'undefined') {
          setTimeout(attachClickHandler, 100);
          return;
        }

        const chart = (window as any).echarts.getInstanceByDom(chartContainer);
        if (!chart) {
          setTimeout(attachClickHandler, 100);
          return;
        }

        // Handle chart click events
        chart.on('click', (params: any) => {
          const actionName = widget.getAttribute('data-action');
          if (actionName) {
            const payload = {
              seriesName: params.seriesName || '',
              value: params.value || '',
              componentType: params.componentType || '',
              name: params.name || '',
            };
            actionHandler.handle(actionName, payload);
          }
        });
      };

      attachClickHandler();
    });
  }

  /**
   * Initialize clock widgets with SSE subscriptions driven by widget metadata.
   */
  private initializeClockWidgets(container: HTMLElement) {
    const clockWidgets = container.querySelectorAll('[data-widget-type="clock"]');

    clockWidgets.forEach((widget) => {
      const streamId = widget.getAttribute('data-stream-id') || 'default-stream';
      const autoStart = widget.getAttribute('data-auto-start') === 'true';

      // If auto-start is enabled, trigger the server clock
      if (autoStart) {
        fetch(`/sample/clock/${encodeURIComponent(streamId)}/start`, { method: 'POST' }).catch(() => {
          // Ignore errors; clock may already be running or endpoint unavailable
        });
      }

      // Subscribe to SSE stream and update the clock widget
      const url = `/api/chat/widgets/streams/${encodeURIComponent(streamId)}/events`;
      const eventSource = new EventSource(url);

      eventSource.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);

          // Update the clock display if data matches this widget's ID
          if (data && data.widgetId === 'clock') {
            const timeDisplay = widget.querySelector('[data-field="timeLocal"]') as HTMLElement;
            const isoDisplay = widget.querySelector('[data-field="time"]') as HTMLElement;

            if (timeDisplay && data.timeLocal) {
              timeDisplay.textContent = String(data.timeLocal);
            }
            if (isoDisplay && data.time) {
              isoDisplay.textContent = String(data.time);
            }
          }
        } catch {
          // Ignore parse errors
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
      };

      // Store reference for cleanup if needed
      (widget as any).__eventSource = eventSource;
    });
  }

  /**
   * Initialize weather widgets with SSE subscriptions driven by widget metadata.
   */
  private initializeWeatherWidgets(container: HTMLElement) {
    const weatherWidgets = container.querySelectorAll('[data-widget-type="weather"]');

    weatherWidgets.forEach((widget) => {
      const streamId = widget.getAttribute('data-stream-id') || 'weather-stream';
      const city = widget.getAttribute('data-city') || 'London';
      const autoStart = widget.getAttribute('data-auto-start') === 'true';

      // If auto-start is enabled, trigger the server weather publisher
      if (autoStart) {
        const params = new URLSearchParams({ city });
        fetch(`/sample/weather/${encodeURIComponent(streamId)}/start?${params}`, { method: 'POST' }).catch(() => {
          // Ignore errors; weather publisher may already be running or endpoint unavailable
        });
      }

      // Subscribe to SSE stream and update the weather widget
      const url = `/api/chat/widgets/streams/${encodeURIComponent(streamId)}/events`;
      const eventSource = new EventSource(url);

      eventSource.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);

          // Update the weather display if data matches this widget's ID
          if (data && data.widgetId === 'weather') {
            const cityDisplay = widget.querySelector('[data-field="city"]') as HTMLElement;
            const conditionDisplay = widget.querySelector('[data-field="condition"]') as HTMLElement;
            const tempDisplay = widget.querySelector('[data-field="temperature"]') as HTMLElement;
            const humidityDisplay = widget.querySelector('[data-field="humidity"]') as HTMLElement;
            const windSpeedDisplay = widget.querySelector('[data-field="windSpeed"]') as HTMLElement;
            const windDirDisplay = widget.querySelector('[data-field="windDirection"]') as HTMLElement;
            const timestampDisplay = widget.querySelector('[data-field="timestamp"]') as HTMLElement;

            if (cityDisplay && data.city) {
              cityDisplay.textContent = String(data.city);
            }
            if (conditionDisplay && data.condition) {
              conditionDisplay.textContent = String(data.condition);
            }
            if (tempDisplay && data.temperature) {
              tempDisplay.textContent = `${String(data.temperature)}°C`;
            }
            if (humidityDisplay && data.humidity) {
              humidityDisplay.textContent = `${String(data.humidity)}%`;
            }
            if (windSpeedDisplay && data.windSpeed) {
              windSpeedDisplay.textContent = `${String(data.windSpeed)} km/h`;
            }
            if (windDirDisplay && data.windDirection) {
              windDirDisplay.textContent = String(data.windDirection);
            }
            if (timestampDisplay && data.timestamp) {
              const date = new Date(data.timestamp);
              timestampDisplay.textContent = date.toLocaleTimeString();
            }
          }
        } catch {
          // Ignore parse errors
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
      };

      // Store reference for cleanup if needed
      (widget as any).__eventSource = eventSource;
    });
  }

  /**
   * Close all active SSE streams for widgets.
   * This prevents memory leaks and stops server polling when widgets are destroyed.
   */
  private cleanupStreams() {
    if (!this.containerRef?.nativeElement) return;

    const container = this.containerRef.nativeElement;

    // Close clock streams
    const clockWidgets = container.querySelectorAll('[data-widget-type="clock"]');
    clockWidgets.forEach((widget) => {
      const eventSource = (widget as any).__eventSource as EventSource | undefined;
      if (eventSource) {
        eventSource.close();
        (widget as any).__eventSource = undefined;
      }
    });

    // Close weather streams
    const weatherWidgets = container.querySelectorAll('[data-widget-type="weather"]');
    weatherWidgets.forEach((widget) => {
      const eventSource = (widget as any).__eventSource as EventSource | undefined;
      if (eventSource) {
        eventSource.close();
        (widget as any).__eventSource = undefined;
      }
    });
  }
}
