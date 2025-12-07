import { ChatWidget } from '../models/ChatWidget';
import { IWidgetRenderer, SsrWidgetRenderer } from './SsrWidgetRenderer';

/**
 * Service for managing widget renderers
 */
export class WidgetRenderingService {
  private renderers: Map<string, IWidgetRenderer> = new Map();

  constructor() {
    // Register default renderer
    this.registerRenderer(new SsrWidgetRenderer());
  }

  /**
   * Register a widget renderer
   */
  registerRenderer(renderer: IWidgetRenderer): void {
    this.renderers.set(renderer.framework, renderer);
  }

  /**
   * Render a single widget
   */
  renderWidget(widget: ChatWidget, framework: string = 'SSR'): string {
    const renderer = this.renderers.get(framework);
    if (!renderer) {
      throw new Error(`No renderer registered for framework: ${framework}`);
    }
    return renderer.renderWidget(widget);
  }

  /**
   * Render multiple widgets
   */
  renderWidgets(widgets: ChatWidget[], framework: string = 'SSR'): string {
    const renderer = this.renderers.get(framework);
    if (!renderer) {
      throw new Error(`No renderer registered for framework: ${framework}`);
    }
    return widgets.map((w) => renderer.renderWidget(w)).join('');
  }

  /**
   * Get list of available frameworks
   */
  getAvailableFrameworks(): string[] {
    return Array.from(this.renderers.keys());
  }
}
