import React, { useEffect, useRef } from 'react';
import { SsrWidgetRenderer, WidgetEventManager, customWidgetRegistry } from '@bbq/chatwidgets';
import type { ChatWidget } from '@bbq/chatwidgets';
import * as echarts from 'echarts';
import { EChartsWidget } from '../widgets/EChartsWidget';
import { renderECharts } from '../widgets/echartsRenderer';
import { ClockWidget } from '../widgets/ClockWidget';
import { renderClock } from '../widgets/clockRenderer';
import { WeatherWidget } from '../widgets/WeatherWidget';
import { renderWeather } from '../widgets/weatherRenderer';

// Make echarts available globally for inline scripts in rendered HTML
declare global {
  interface Window {
    echarts: typeof echarts;
  }
}
window.echarts = echarts;

interface WidgetRendererProps {
  widgets: ChatWidget[] | null | undefined;
  onWidgetAction?: (actionName: string, payload: unknown) => void;
}

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

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  widgets,
  onWidgetAction,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !onWidgetAction) return;

    // Create a custom action handler that calls onWidgetAction
    const actionHandler = {
      handle: async (action: string, payload: any) => {
        onWidgetAction(action, payload);
      },
    };

    // Attach event handlers using WidgetEventManager
    const eventManager = new WidgetEventManager(actionHandler);
    eventManager.attachHandlers(containerRef.current);
    
    // Initialize ECharts widgets
    initializeECharts(containerRef.current);
    
    // Attach ECharts click handlers
    attachEChartsHandlers(containerRef.current, actionHandler);

    // Initialize clock widgets with SSE subscriptions
    initializeClockWidgets(containerRef.current);

    // Initialize weather widgets with SSE subscriptions
    initializeWeatherWidgets(containerRef.current);

    // Cleanup function to close all SSE streams when component unmounts or widgets change
    return () => {
      closeAllClockStreams(containerRef.current);
      closeAllWeatherStreams(containerRef.current);
    };
  }, [onWidgetAction, widgets]);

  if (!widgets || widgets.length === 0) {
    return null;
  }

  const renderer = new SsrWidgetRenderer();

  return (
    <div
      ref={containerRef}
      className="widgets-container"
      onClick={(e) => {
        const target = e.target as HTMLElement;
        // Only trigger actions on non-form buttons and clickable elements (cards)
        // Don't trigger on input elements or form buttons (let WidgetEventManager handle those)
        const button = target.tagName === 'BUTTON' ? target : target.closest('button');
        if (button && !button.closest('[data-widget-type="form"]')) {
          const actionName = button.getAttribute('data-action');
          if (actionName && onWidgetAction) {
            try {
              const payloadStr = button.getAttribute('data-payload');
              const payload = payloadStr ? JSON.parse(payloadStr) : {};
              onWidgetAction(actionName, payload);
            } catch (err) {
              console.error('Failed to parse widget action payload:', err);
            }
          }
        }
      }}
    >
      {widgets.map((widget, index) => {
        // Handle custom ECharts widget rendering
        if (widget.type === 'echarts') {
          const echartsWidget = widget as EChartsWidget;
          const html = renderECharts(echartsWidget);
          const widgetId = `${widget.type}-${widget.action}-${index}`;
          return (
            <div
              key={widgetId}
              className="widget"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        // Handle clock widget rendering
        if (widget.type === 'clock') {
          const clockWidget = widget as ClockWidget;
          const html = renderClock(clockWidget);
          const widgetId = `${widget.type}-${widget.action}-${index}`;
          return (
            <div
              key={widgetId}
              className="widget"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        // Handle weather widget rendering
        if (widget.type === 'weather') {
          const weatherWidget = widget as WeatherWidget;
          const html = renderWeather(weatherWidget);
          const widgetId = `${widget.type}-${widget.action}-${index}`;
          return (
            <div
              key={widgetId}
              className="widget"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }
        
        // Render all other built-in widgets using library renderer
        const html = renderer.renderWidget(widget);
        const widgetId = `${widget.type}-${widget.action}-${index}`;
        return (
          <div
            key={widgetId}
            className="widget"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </div>
  );
};

/**
 * Initialize ECharts widgets by parsing data attributes and rendering charts
 */
function initializeECharts(
  container: HTMLElement
) {
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
function attachEChartsHandlers(
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
 * 
 * Each clock widget can specify:
 * - data-stream-id: the SSE stream to subscribe to (defaults to 'default-stream')
 * - data-auto-start: if 'true', automatically start the server clock (POST to /sample/clock/{streamId}/start)
 */
function initializeClockWidgets(container: HTMLElement) {
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
 * Close all active SSE streams for clock widgets.
 * This prevents memory leaks and stops server polling when widgets are destroyed.
 */
function closeAllClockStreams(container: HTMLElement | null) {
  if (!container) return;
  
  const clockWidgets = container.querySelectorAll('[data-widget-type="clock"]');
  
  clockWidgets.forEach((widget) => {
    const eventSource = (widget as any).__eventSource as EventSource | undefined;
    if (eventSource) {
      eventSource.close();
      (widget as any).__eventSource = undefined;
    }
  });
}
/**
 * Initialize weather widgets with SSE subscriptions driven by widget metadata.
 * 
 * Each weather widget can specify:
 * - data-stream-id: the SSE stream to subscribe to (defaults to 'weather-stream')
 * - data-city: the city for weather data (defaults to 'London')
 * - data-auto-start: if 'true', automatically start the weather publisher (POST to /sample/weather/{streamId}/start)
 */
function initializeWeatherWidgets(container: HTMLElement) {
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
 * Close all active SSE streams for weather widgets.
 * This prevents memory leaks and stops server polling when widgets are destroyed.
 */
function closeAllWeatherStreams(container: HTMLElement | null) {
  if (!container) return;
  
  const weatherWidgets = container.querySelectorAll('[data-widget-type="weather"]');
  
  weatherWidgets.forEach((widget) => {
    const eventSource = (widget as any).__eventSource as EventSource | undefined;
    if (eventSource) {
      eventSource.close();
      (widget as any).__eventSource = undefined;
    }
  });
}