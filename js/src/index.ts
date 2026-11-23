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
export const VERSION = '1.2.1';

// Clients
export { WidgetSseManager } from './clients/WidgetSseManager';
export * from './clients/WidgetStreamReducer';
export * from './reporting/api';
export * from './reporting/compose';
export * from './reporting/paging';
export * from './reporting/inputs';
export * from './reporting/filters';
export * from './reporting/presentation';
