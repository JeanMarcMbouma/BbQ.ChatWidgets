import React, { useEffect, useRef } from 'react';
import { SsrWidgetRenderer, WidgetEventManager } from '@bbq/chatwidgets';
import type { ChatWidget } from '@bbq/chatwidgets';

interface WidgetRendererProps {
  widgets: ChatWidget[] | null | undefined;
  onWidgetAction?: (actionName: string, payload: unknown) => void;
}

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
  }, [onWidgetAction]);

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
