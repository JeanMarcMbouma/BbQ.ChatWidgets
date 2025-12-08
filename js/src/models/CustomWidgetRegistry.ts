/**
 * Simple runtime registry for custom widget types.
 *
 * Consumers can register a factory function or a constructor/class. The registry
 * stores a factory that receives the plain object parsed from JSON and must
 * return a ChatWidget instance.
 */
import type { ChatWidget } from './ChatWidget';

type WidgetFactory = (obj: any) => ChatWidget | null;

class CustomWidgetRegistry {
  private readonly factories = new Map<string, WidgetFactory>();

  /**
   * Register a factory function for a discriminator.
   */
  registerFactory(discriminator: string, factory: WidgetFactory) {
    if (!discriminator || typeof discriminator !== 'string') {
      throw new Error('discriminator must be a non-empty string');
    }
    if (typeof factory !== 'function') {
      throw new Error('factory must be a function');
    }
    if (this.factories.has(discriminator)) {
      throw new Error(`discriminator '${discriminator}' is already registered`);
    }
    this.factories.set(discriminator, factory);
  }

  /**
   * Register a constructor/class. A default factory will create an instance by
   * assigning plain object properties to the prototype (constructor is NOT invoked).
   * This keeps registration simple for POJO-like widget classes.
   */
  registerClass(discriminator: string, ctor: any) {
    if (!ctor) throw new Error('ctor is required');
    const factory: WidgetFactory = (obj) => Object.assign(Object.create(ctor.prototype), obj);
    this.registerFactory(discriminator, factory);
  }

  /**
   * Helper: derive discriminator from a class name (lower-cased, strips 'Widget' suffix)
   */
  registerClassAuto(ctor: any) {
    if (!ctor || !ctor.name) throw new Error('ctor must have a name');
    let name = ctor.name;
    if (name.endsWith('Widget')) name = name.slice(0, -6);
    const disc = name.toLowerCase();
    this.registerClass(disc, ctor);
  }

  getFactory(discriminator: string): WidgetFactory | undefined {
    return this.factories.get(discriminator);
  }

  getAll(): Map<string, WidgetFactory> {
    return new Map(this.factories);
  }
}

export const customWidgetRegistry = new CustomWidgetRegistry();
export type { WidgetFactory };
export default CustomWidgetRegistry;
