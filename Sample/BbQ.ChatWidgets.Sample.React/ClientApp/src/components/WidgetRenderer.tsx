import React, { useEffect, useRef } from 'react';
import { customWidgetRegistry } from '@bbq-chat/widgets';
import { WidgetRenderer as NativeWidgetRenderer } from '@bbq-chat/widgets-react';
import type { ChatWidget } from '@bbq-chat/widgets';
import * as echarts from 'echarts';
import { EChartsWidget } from '../widgets/EChartsWidget';
import { renderECharts } from '../widgets/echartsRenderer';
import { ClockWidget } from '../widgets/ClockWidget';
import { renderClock } from '../widgets/clockRenderer';
import { WeatherWidget } from '../widgets/WeatherWidget';
import { renderWeather } from '../widgets/weatherRenderer';

declare global {
  interface Window {
    echarts: typeof echarts;
  }
}

interface WidgetRendererProps {
  widgets: ChatWidget[] | null | undefined;
  onWidgetAction?: (actionName: string, payload: unknown) => void;
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

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({ widgets, onWidgetAction }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureCustomRegistrations();

    if (!containerRef.current) return;

    // Create a custom action handler that calls onWidgetAction
    const actionHandler = {
      handle: async (action: string, payload: any) => {
        onWidgetAction?.(action, payload);
      },
    };

    // Initialize ECharts widgets
    const disposeCharts = initializeECharts(containerRef.current);

    // Attach ECharts click handlers
    attachEChartsHandlers(containerRef.current, actionHandler);

    // Initialize clock widgets with SSE subscriptions
    const closeClockStreams = initializeClockWidgets(containerRef.current);

    // Initialize weather widgets with SSE subscriptions
    const closeWeatherStreams = initializeWeatherWidgets(containerRef.current);

    // Cleanup function to close all SSE streams when component unmounts or widgets change
    return () => {
      disposeCharts();
      closeClockStreams();
      closeWeatherStreams();
    };
  }, [onWidgetAction, widgets]);

  if (!widgets || widgets.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className="widgets-container">
      {widgets.map((widget, index) => {
        // Handle custom ECharts widget rendering
        if (widget.type === 'echarts') {
          const echartsWidget = widget as EChartsWidget;
          const html = renderECharts(echartsWidget);
          const widgetId = `${widget.type}-${widget.action}-${index}`;
          return (
            <div key={widgetId} className="widget" dangerouslySetInnerHTML={{ __html: html }} />
          );
        }

        // Handle clock widget rendering
        if (widget.type === 'clock') {
          const clockWidget = widget as ClockWidget;
          const html = renderClock(clockWidget);
          const widgetId = `${widget.type}-${widget.action}-${index}`;
          return (
            <div key={widgetId} className="widget" dangerouslySetInnerHTML={{ __html: html }} />
          );
        }

        // Handle weather widget rendering
        if (widget.type === 'weather') {
          const weatherWidget = widget as WeatherWidget;
          const html = renderWeather(weatherWidget);
          const widgetId = `${widget.type}-${widget.action}-${index}`;
          return (
            <div key={widgetId} className="widget" dangerouslySetInnerHTML={{ __html: html }} />
          );
        }

        // Built-in widgets use the published native React package.
        const widgetId = `${widget.type}-${widget.action}-${index}`;
        return <div key={widgetId} className="widget"><NativeWidgetRenderer widgets={[widget]} onWidgetAction={onWidgetAction} /></div>;
      })}
    </div>
  );
};

/**
 * Initialize ECharts widgets by parsing data attributes and rendering charts
 */
function initializeECharts(container: HTMLElement) {
  const disposers: Array<() => void> = [];
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
      const resize = () => myChart.resize();
      window.addEventListener('resize', resize);
      disposers.push(() => {
        window.removeEventListener('resize', resize);
        myChart.dispose();
      });
    } catch (e) {
      console.error('Failed to initialize ECharts:', e);
      console.error('Chart data:', jsonDataStr);
    }
  });
  return () => disposers.forEach((dispose) => dispose());
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

    const chart = window.echarts.getInstanceByDom(chartContainer);
    if (!chart) return;
    // Handle chart click events
    chart.on('click', (params: any) => {
      const actionName = widget.getAttribute('data-action');
      if (actionName) {
        const payload = {
          seriesName: params.seriesName || '',
          value: params.value ?? '',
          componentType: params.componentType || '',
          name: params.name || '',
        };
        actionHandler.handle(actionName, payload);
      }
    });
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
  const streams: EventSource[] = [];
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
    streams.push(eventSource);
  });
  return () => streams.forEach((stream) => stream.close());
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
  const streams: EventSource[] = [];
  const weatherWidgets = container.querySelectorAll('[data-widget-type="weather"]');

  weatherWidgets.forEach((widget) => {
    const streamId = widget.getAttribute('data-stream-id') || 'weather-stream';
    const city = widget.getAttribute('data-city') || 'London';
    const autoStart = widget.getAttribute('data-auto-start') === 'true';

    // If auto-start is enabled, trigger the server weather publisher
    if (autoStart) {
      const params = new URLSearchParams({ city });
      fetch(`/sample/weather/${encodeURIComponent(streamId)}/start?${params}`, {
        method: 'POST',
      }).catch(() => {
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
          const windDirDisplay = widget.querySelector(
            '[data-field="windDirection"]'
          ) as HTMLElement;
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
    streams.push(eventSource);
  });
  return () => streams.forEach((stream) => stream.close());
}
