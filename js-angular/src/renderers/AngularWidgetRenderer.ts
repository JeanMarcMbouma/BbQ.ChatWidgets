import { Type } from '@angular/core';
import { IWidgetRenderer } from '@bbq-chat/widgets';
import type { ChatWidget } from '@bbq-chat/widgets';
import { CustomWidgetComponent } from '../custom-widget-renderer.types';

/**
 * Options for configuring the Angular widget renderer
 */
export interface AngularRendererOptions {
  /**
   * Per-widget-type component overrides. Key is widget.type.
   */
  components?: Partial<Record<string, Type<CustomWidgetComponent>>>;
}

/**
 * Angular widget renderer
 * Returns Angular component types for dynamic rendering
 * Provides feature parity with SsrWidgetRenderer but uses Angular components
 */
export class AngularWidgetRenderer implements IWidgetRenderer {
  readonly framework = 'Angular';
  private overrides: AngularRendererOptions['components'] | undefined;
  private componentRegistry: Map<string, Type<CustomWidgetComponent>> = new Map();

  constructor(options?: AngularRendererOptions) {
    this.overrides = options?.components;
  }

  /**
   * Register all built-in widget components
   * Must be called after components are imported to avoid circular dependencies
   */
  registerBuiltInComponents(components: Record<string, Type<CustomWidgetComponent>>) {
    for (const [type, component] of Object.entries(components)) {
      this.componentRegistry.set(type, component);
    }
  }

  /**
   * Register or override a widget component
   * Use this to replace built-in components or add custom ones
   * 
   * @example
   * ```typescript
   * renderer.registerComponent('button', MyCustomButtonComponent);
   * ```
   */
  registerComponent(type: string, component: Type<CustomWidgetComponent>) {
    this.componentRegistry.set(type, component);
  }

  /**
   * Register multiple widget components at once
   * 
   * @example
   * ```typescript
   * renderer.registerComponents({
   *   button: MyButtonComponent,
   *   card: MyCardComponent
   * });
   * ```
   */
  registerComponents(components: Record<string, Type<CustomWidgetComponent>>) {
    for (const [type, component] of Object.entries(components)) {
      this.componentRegistry.set(type, component);
    }
  }

  /**
   * Get the Angular component type for a given widget
   * Returns the component class that should be dynamically instantiated
   */
  getComponentType(widget: ChatWidget): Type<CustomWidgetComponent> | null {
    const type = widget.type;

    // Check for custom override first
    if (this.overrides && this.overrides[type]) {
      return this.overrides[type] as Type<CustomWidgetComponent>;
    }

    // Check built-in registry
    if (this.componentRegistry.has(type)) {
      return this.componentRegistry.get(type)!;
    }

    return null;
  }

  /**
   * Legacy method for IWidgetRenderer interface compatibility
   * Not used in Angular rendering but required by interface
   * @deprecated Use getComponentType() instead for Angular rendering
   */
  renderWidget(widget: ChatWidget): string {
    // This method is not used in Angular rendering
    // It's only here for interface compatibility
    return `<!-- Angular component rendering for ${widget.type} -->`;
  }
}
