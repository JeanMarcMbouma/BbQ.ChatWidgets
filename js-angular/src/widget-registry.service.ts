import { Injectable } from '@angular/core';
import { customWidgetRegistry, ChatWidget } from '@bbq-chat/widgets';
import { CustomWidgetRenderer } from './custom-widget-renderer.types';

/**
 * Service for registering custom widget factories and renderers
 * 
 * This service provides a centralized way to register custom widget types
 * that extend the base widget functionality, including support for
 * Angular components and templates as custom renderers.
 * 
 * @example
 * ```typescript
 * constructor(private widgetRegistry: WidgetRegistryService) {
 *   // Register a widget factory
 *   this.widgetRegistry.registerFactory('myWidget', (obj) => {
 *     if (obj.type === 'myWidget') {
 *       return new MyCustomWidget(obj.label, obj.action);
 *     }
 *     return null;
 *   });
 * 
 *   // Register a component-based renderer
 *   this.widgetRegistry.registerRenderer('myWidget', MyWidgetComponent);
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class WidgetRegistryService {
  private readonly customRenderers = new Map<string, CustomWidgetRenderer>();
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

  /**
   * Register a custom renderer for a specific widget type
   * 
   * The renderer can be:
   * - A function that returns HTML string
   * - An Angular Component class
   * - An Angular TemplateRef
   * 
   * @param type - The widget type identifier
   * @param renderer - The custom renderer (function, Component, or TemplateRef)
   * 
   * @example
   * ```typescript
   * // HTML function renderer
   * widgetRegistry.registerRenderer('weather', (widget) => `<div>${widget.label}</div>`);
   * 
   * // Component renderer
   * widgetRegistry.registerRenderer('weather', WeatherWidgetComponent);
   * 
   * // Template renderer (from @ViewChild or elsewhere)
   * widgetRegistry.registerRenderer('weather', this.weatherTemplate);
   * ```
   */
  registerRenderer(type: string, renderer: CustomWidgetRenderer): void {
    if (!type || typeof type !== 'string') {
      throw new Error('type must be a non-empty string');
    }
    if (!renderer) {
      throw new Error('renderer is required');
    }
    this.customRenderers.set(type, renderer);
  }

  /**
   * Get a custom renderer for a specific widget type
   * 
   * @param type - The widget type identifier
   * @returns The custom renderer if registered, undefined otherwise
   */
  getRenderer(type: string): CustomWidgetRenderer | undefined {
    return this.customRenderers.get(type);
  }

  /**
   * Check if a custom renderer is registered for a widget type
   * 
   * @param type - The widget type identifier
   * @returns True if a custom renderer is registered, false otherwise
   */
  hasRenderer(type: string): boolean {
    return this.customRenderers.has(type);
  }

  /**
   * Unregister a custom renderer for a widget type
   * 
   * @param type - The widget type identifier
   * @returns True if a renderer was removed, false if none was registered
   */
  unregisterRenderer(type: string): boolean {
    return this.customRenderers.delete(type);
  }
}
