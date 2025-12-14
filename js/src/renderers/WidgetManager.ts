import { ChatWidget } from '../models/ChatWidget';
import { WidgetRenderingService } from './WidgetRenderingService';
import { IWidgetRenderer } from './SsrWidgetRenderer';
import { WidgetEventManager, IWidgetActionHandler, DefaultWidgetActionHandler } from '../handlers/WidgetEventManager';

export interface WidgetManagerOptions {
  framework?: string;
  actionHandler?: IWidgetActionHandler;
}

/**
 * High-level manager that ties rendering and event handling together.
 * Developers can register custom renderers and provide their own action handler.
 */
export class WidgetManager {
  private renderingService: WidgetRenderingService;
  private eventManager: WidgetEventManager;
  private framework: string;

  constructor(options?: WidgetManagerOptions) {
    this.renderingService = new WidgetRenderingService();
    this.framework = options?.framework ?? 'SSR';
    this.eventManager = new WidgetEventManager(options?.actionHandler ?? new DefaultWidgetActionHandler());
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

  /**
   * Get list of available frameworks (renderers)
   */
  getAvailableFrameworks(): string[] {
    return this.renderingService.getAvailableFrameworks();
  }
}

export default WidgetManager;
