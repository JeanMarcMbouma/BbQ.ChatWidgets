import React, { useEffect, useRef } from 'react';
import { SsrWidgetRenderer, WidgetEventManager, customWidgetRegistry } from '@bbq/chatwidgets';
import type { ChatWidget } from '@bbq/chatwidgets';
import * as echarts from 'echarts';
import { EChartsWidget } from '../widgets/EChartsWidget';
import { renderECharts } from '../widgets/echartsRenderer';

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
