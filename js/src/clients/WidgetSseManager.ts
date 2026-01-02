import { WidgetManager } from '../renderers/WidgetManager';

export interface WidgetSseOptions {
  /**
   * Optional event source factory for tests / environments without global EventSource
   */
  createEventSource?: (url: string) => EventSource;
}

/**
 * Manages an EventSource connection and routes incoming widget update events
 * to the `WidgetManager` for DOM updates or to custom handlers.
 *
 * Expected message payload (JSON):
 * { widgetId?: string, widget?: any, type?: string, payload?: any }
 */
export class WidgetSseManager {
  private es: EventSource | null = null;
  private handlers: Map<string, (payload: any) => void> = new Map();

  constructor(private widgetManager: WidgetManager, private opts?: WidgetSseOptions) {}

  connect(url: string): void {
    this.es = this.opts?.createEventSource ? this.opts.createEventSource(url) : new EventSource(url);
    this.es.addEventListener('message', (e: MessageEvent) => this.onMessage(e));
    this.es.addEventListener('error', () => {
      // swallow for now — consumers can reconnect externally
    });
  }

  disconnect(): void {
    if (!this.es) return;
    try {
      this.es.close();
    } catch {
      // Ignore close errors
    }
    this.es = null;
  }

  registerHandler(widgetId: string, handler: (payload: any) => void): void {
    this.handlers.set(widgetId, handler);
  }

  unregisterHandler(widgetId: string): void {
    this.handlers.delete(widgetId);
  }

  private onMessage(e: MessageEvent) {
    let data: any;
    try {
      data = JSON.parse(e.data);
    } catch (err) {
      return;
    }

    const widgetId = data.widgetId as string | undefined;

    // Call any registered handler first
    if (widgetId && this.handlers.has(widgetId)) {
      const h = this.handlers.get(widgetId)!;
      h(data.payload ?? data);
      return;
    }

    // If event contains a full widget object, update the DOM by rendering the widget
    if (widgetId && data.widget) {
      const el = document.querySelector(`[data-widget-id="${widgetId}"]`);
      if (el) {
        const html = this.widgetManager.renderWidget(data.widget);
        // Replace the widget element HTML and reattach handlers within the parent
        const parent = el.parentElement;
        el.outerHTML = html;
        if (parent) {
          const newEl = parent.querySelector(`[data-widget-id="${widgetId}"]`);
          if (newEl) this.widgetManager.attachHandlers(parent);
        }
      }
    }
  }
}

export default WidgetSseManager;

/**
 * Convenience: create and connect a WidgetSseManager for a given URL.
 * Returns the manager instance so the caller can register handlers or disconnect.
 */
export function connectWidgetSse(widgetManager: import('../renderers/WidgetManager').WidgetManager, url: string, opts?: WidgetSseOptions) {
  const mgr = new WidgetSseManager(widgetManager, opts);
  mgr.connect(url);
  return mgr;
}
