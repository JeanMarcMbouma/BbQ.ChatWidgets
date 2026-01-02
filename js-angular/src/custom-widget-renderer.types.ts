import { Type, TemplateRef } from '@angular/core';
import { ChatWidget } from '@bbq-chat/widgets';

/**
 * Context provided to template-based custom widget renderers
 */
export interface WidgetTemplateContext {
  /**
   * The widget instance being rendered
   */
  $implicit: ChatWidget;
  
  /**
   * The widget instance (alternative access)
   */
  widget: ChatWidget;
  
  /**
   * Emit a widget action
   */
  emitAction: (actionName: string, payload: unknown) => void;
}

/**
 * Interface for component-based custom widget renderers
 */
export interface CustomWidgetComponent {
  /**
   * The widget instance to render
   */
  widget: ChatWidget;
  
  /**
   * Event emitter for widget actions (optional, will be set by the renderer)
   */
  widgetAction?: (actionName: string, payload: unknown) => void;
}

/**
 * Type for custom widget renderer functions that return HTML strings
 */
export type CustomWidgetHtmlRenderer = (widget: ChatWidget) => string;

/**
 * Type for custom widget renderer configurations
 */
export type CustomWidgetRenderer =
  | CustomWidgetHtmlRenderer
  | Type<CustomWidgetComponent>
  | TemplateRef<WidgetTemplateContext>;

/**
 * Configuration for registering a custom widget renderer
 */
export interface CustomWidgetRendererConfig {
  /**
   * The widget type identifier
   */
  type: string;
  
  /**
   * The renderer: can be a function returning HTML, an Angular Component class, or a TemplateRef
   */
  renderer: CustomWidgetRenderer;
}

/**
 * Type guard to check if a renderer is an HTML function
 */
export function isHtmlRenderer(
  renderer: CustomWidgetRenderer
): renderer is CustomWidgetHtmlRenderer {
  return typeof renderer === 'function' && !('ɵcmp' in renderer);
}

/**
 * Type guard to check if a renderer is an Angular Component
 */
export function isComponentRenderer(
  renderer: CustomWidgetRenderer
): renderer is Type<CustomWidgetComponent> {
  return typeof renderer === 'function' && 'ɵcmp' in renderer;
}

/**
 * Type guard to check if a renderer is a TemplateRef
 */
export function isTemplateRenderer(
  renderer: CustomWidgetRenderer
): renderer is TemplateRef<WidgetTemplateContext> {
  return (
    renderer !== null &&
    typeof renderer === 'object' &&
    'createEmbeddedView' in renderer
  );
}
