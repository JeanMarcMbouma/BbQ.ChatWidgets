import { ChatWidget } from '../models/ChatWidget';
import { WidgetRenderingService } from './WidgetRenderingService';
import { IWidgetRenderer } from './SsrWidgetRenderer';
import { WidgetEventManager, IWidgetActionHandler, DefaultWidgetActionHandler } from '../handlers/WidgetEventManager';

export interface WidgetManagerOptions {
  framework?: string;
  actionHandler?: IWidgetActionHandler;
  lifecycle?: WidgetRendererLifecycle;
}

export interface WidgetRendererLifecycle {
  mount?(instanceId: string, element: Element): void;
  update?(instanceId: string, element: Element, widget: ChatWidget): boolean | void;
  unmount?(instanceId: string, element: Element): void;
}

/**
 * High-level manager that ties rendering and event handling together.
 * Developers can register custom renderers and provide their own action handler.
 */
export class WidgetManager {
  private renderingService: WidgetRenderingService;
  private eventManager: WidgetEventManager;
  private framework: string;
  private lifecycle?: WidgetRendererLifecycle;

  constructor(options?: WidgetManagerOptions) {
    this.renderingService = new WidgetRenderingService();
    this.framework = options?.framework ?? 'SSR';
    this.eventManager = new WidgetEventManager(options?.actionHandler ?? new DefaultWidgetActionHandler());
    this.lifecycle = options?.lifecycle;
  }

  /**
   * Register a custom renderer (override default for a framework)
   */
  registerRenderer(renderer: IWidgetRenderer): void {
    this.renderingService.registerRenderer(renderer);
  }

  /**
   * Replace the action handler used for dispatched widget events
   */
  setActionHandler(handler: IWidgetActionHandler): void {
    this.eventManager = new WidgetEventManager(handler);
  }

  /**
   * Render a single widget to HTML using the configured framework
   */
  renderWidget(widget: ChatWidget, framework?: string): string {
    return this.renderingService.renderWidget(widget, framework ?? this.framework);
  }

  /**
   * Render multiple widgets
   */
  renderWidgets(widgets: ChatWidget[], framework?: string): string {
    return this.renderingService.renderWidgets(widgets, framework ?? this.framework);
  }

  /**
   * Attach event handlers to DOM container. Useful after inserting rendered HTML.
   */
  attachHandlers(container: Element): void {
    this.eventManager.attachHandlers(container);
  }

  /**
   * Render widgets into a container element (replaces content) and attach handlers.
   * This is a convenience for SSR hydration: render server-side HTML, insert on client,
   * then call this to wire up events.
   */
  renderInto(container: Element, widgets: ChatWidget[] | ChatWidget, framework?: string): void {
    const html = Array.isArray(widgets) ? this.renderWidgets(widgets, framework) : this.renderWidget(widgets, framework);
    container.innerHTML = html;
    this.attachHandlers(container);
  }

  /** Mounts or replaces one protocol widget while leaving unrelated DOM/state intact. */
  updateWidget(instanceId: string, value: unknown, framework?: string): void {
    const widget = value instanceof ChatWidget ? value : ChatWidget.fromObject(value);
    if (!widget) return;
    const existing = document.querySelector(`[data-widget-instance-id="${instanceId}"]`);
    if (existing && this.lifecycle?.update?.(instanceId, existing, widget) === true) return;
    const template = document.createElement('template');
    template.innerHTML = this.renderWidget(widget, framework).trim();
    const next = template.content.firstElementChild;
    if (!next) return;
    next.setAttribute('data-widget-instance-id', instanceId);
    if (existing) { this.lifecycle?.unmount?.(instanceId, existing); existing.replaceWith(next); }
    else document.querySelector('[data-widget-stream]')?.appendChild(next);
    this.attachHandlers(next);
    this.lifecycle?.mount?.(instanceId, next);
  }

  unmountWidget(instanceId: string): void {
    const existing = document.querySelector(`[data-widget-instance-id="${instanceId}"]`);
    if (!existing) return;
    this.lifecycle?.unmount?.(instanceId, existing);
    existing.remove();
  }

  /**
   * Get list of available frameworks (renderers)
   */
  getAvailableFrameworks(): string[] {
    return this.renderingService.getAvailableFrameworks();
  }
}

export default WidgetManager;
