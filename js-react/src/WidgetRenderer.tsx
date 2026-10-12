import { useEffect, useRef } from "react";
import type { ChatWidget } from "@bbq-chat/widgets";
import { useWidgetServices } from "./services.js";
import type { WidgetData, WidgetProps, WidgetActionHandler } from "./types.js";

function HtmlWidget({
  html,
  onWidgetAction,
}: {
  html: string;
  onWidgetAction?: WidgetActionHandler;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const callback = useRef(onWidgetAction);
  callback.current = onWidgetAction;
  const { eventManagerFactory } = useWidgetServices();
  useEffect(() => {
    const container = ref.current!;
    const manager = eventManagerFactory({
      handle: async (action, payload) => {
        callback.current?.(action, payload);
      },
    });
    manager.attachHandlers(container);
    return () => manager.detachHandlers(container);
  }, [html, eventManagerFactory]);
  return <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}
export function Widget({
  widget,
  onWidgetAction,
  onValidationState,
  disabled,
}: WidgetProps) {
  const { registry, htmlRenderer, renderer } = useWidgetServices();
  const custom = registry.getRenderer(widget.type);
  const props = { widget, onWidgetAction, onValidationState, disabled };
  if (custom?.kind === "component") {
    const Component = custom.component;
    return <Component {...props} />;
  }
  if (custom?.kind === "template")
    return (
      <>
        {custom.render({
          ...props,
          emitAction: (action, payload) => onWidgetAction?.(action, payload),
        })}
      </>
    );
  if (custom?.kind === "html")
    return (
      <HtmlWidget
        html={custom.render(widget)}
        onWidgetAction={onWidgetAction}
      />
    );
  const Component = renderer.getComponentType(widget.type);
  if (Component) return <Component {...props} />;
  return (
    <HtmlWidget
      html={htmlRenderer.renderWidget(widget as ChatWidget)}
      onWidgetAction={onWidgetAction}
    />
  );
}
export interface WidgetRendererProps extends Omit<WidgetProps, "widget"> {
  widgets?: readonly WidgetData[] | null;
}
export function WidgetRenderer({ widgets, ...props }: WidgetRendererProps) {
  return (
    <>
      {widgets?.map((widget, index) => (
        <Widget
          key={widget.instanceId ?? `${widget.type}:${widget.action}:${index}`}
          widget={widget}
          {...props}
        />
      ))}
    </>
  );
}
