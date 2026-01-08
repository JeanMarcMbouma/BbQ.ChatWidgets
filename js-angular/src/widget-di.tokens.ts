import { InjectionToken } from '@angular/core';
import { SsrWidgetRenderer, WidgetEventManager, IWidgetActionHandler } from '@bbq-chat/widgets';

/**
 * Injection token for WidgetEventManager factory
 * 
 * Use this token to inject a factory function that creates WidgetEventManager instances.
 * The factory accepts an optional action handler to configure the manager.
 * 
 * @example
 * ```typescript
 * constructor(@Inject(WIDGET_EVENT_MANAGER_FACTORY) private eventManagerFactory: WidgetEventManagerFactory) {
 *   const actionHandler = { handle: async (action, payload) => { ... } };
 *   this.eventManager = this.eventManagerFactory(actionHandler);
 * }
 * ```
 */
export type WidgetEventManagerFactory = (actionHandler?: IWidgetActionHandler) => WidgetEventManager;

export const WIDGET_EVENT_MANAGER_FACTORY = new InjectionToken<WidgetEventManagerFactory>(
  'WIDGET_EVENT_MANAGER_FACTORY'
);

/**
 * Injection token for SsrWidgetRenderer
 * 
 * Use this token to inject a SsrWidgetRenderer instance in your components.
 * By default, WidgetRendererComponent provides this token with a factory that creates
 * a new instance for each component.
 * 
 * @example
 * ```typescript
 * constructor(@Inject(SSR_WIDGET_RENDERER) private renderer: SsrWidgetRenderer) {}
 * ```
 */
export const SSR_WIDGET_RENDERER = new InjectionToken<SsrWidgetRenderer>(
  'SSR_WIDGET_RENDERER'
);

/**
 * Factory function for creating WidgetEventManager instances
 * 
 * This factory is used by default in WidgetRendererComponent's providers array.
 * You can override this in your own providers if you need custom initialization.
 * 
 * @returns A factory function that creates WidgetEventManager instances
 */
export function widgetEventManagerFactoryProvider(): WidgetEventManagerFactory {
  return (actionHandler?: IWidgetActionHandler) => new WidgetEventManager(actionHandler);
}

/**
 * Factory function for creating SsrWidgetRenderer instances
 * 
 * This factory is used by default in WidgetRendererComponent's providers array.
 * You can override this in your own providers if you need custom initialization
 * or custom rendering options.
 * 
 * @returns A new SsrWidgetRenderer instance
 */
export function ssrWidgetRendererFactory(): SsrWidgetRenderer {
  return new SsrWidgetRenderer();
}
