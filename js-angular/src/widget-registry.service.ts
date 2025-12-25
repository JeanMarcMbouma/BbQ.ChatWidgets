import { Injectable } from '@angular/core';
import { customWidgetRegistry, ChatWidget } from '@bbq-chat/widgets';

/**
 * Service for registering custom widget factories
 * 
 * This service provides a centralized way to register custom widget types
 * that extend the base widget functionality.
 * 
 * @example
 * ```typescript
 * constructor(private widgetRegistry: WidgetRegistryService) {
 *   this.widgetRegistry.registerFactory('myWidget', (obj) => {
 *     if (obj.type === 'myWidget') {
 *       return new MyCustomWidget(obj.label, obj.action);
 *     }
 *     return null;
 *   });
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class WidgetRegistryService {
  /**
   * Register a custom widget factory function
   * 
   * @param type - The widget type identifier
   * @param factory - Factory function that creates widget instances from plain objects
   */
  registerFactory(
    type: string,
    factory: (obj: unknown) => ChatWidget | null
  ): void {
    customWidgetRegistry.registerFactory(type, factory);
  }

  /**
   * Register a widget class with automatic factory creation
   * 
   * @param type - The widget type identifier
   * @param ctor - Widget class constructor
   */
  registerClass(type: string, ctor: any): void {
    customWidgetRegistry.registerClass(type, ctor);
  }

  /**
   * Get a factory for a specific widget type
   * 
   * @param type - The widget type identifier
   * @returns The factory function if registered, undefined otherwise
   */
  getFactory(type: string): ((obj: any) => ChatWidget | null) | undefined {
    return customWidgetRegistry.getFactory(type);
  }
}
