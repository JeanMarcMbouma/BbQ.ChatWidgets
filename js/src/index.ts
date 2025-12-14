/**
 * BbQ ChatWidgets - Framework-agnostic widget library for AI chat UIs
 */

// Export models
export * from './models';

// Export renderers
export * from './renderers';
export { WidgetManager } from './renderers/WidgetManager';

// Export handlers
export * from './handlers';

// Version
export const VERSION = '1.0.0';

// Clients
export { WidgetSseManager } from './clients/WidgetSseManager';
