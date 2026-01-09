/**
 * @bbq-chat/widgets-angular
 * 
 * Angular components and services for BbQ ChatWidgets
 * 
 * This package provides Angular-native components and services that wrap
 * the core @bbq-chat/widgets library, making it easy to integrate chat
 * widgets into Angular applications.
 * 
 * @packageDocumentation
 */

// Export components
export { WidgetRendererComponent } from './widget-renderer.component';

// Export services
export { WidgetRegistryService } from './widget-registry.service';

// Export DI tokens and factories
export {
  WIDGET_EVENT_MANAGER_FACTORY,
  SSR_WIDGET_RENDERER,
  ANGULAR_WIDGET_RENDERER,
  widgetEventManagerFactoryProvider,
  ssrWidgetRendererFactory,
  angularWidgetRendererFactory,
} from './widget-di.tokens';

export type { WidgetEventManagerFactory } from './widget-di.tokens';

// Export custom widget renderer types
export type {
  CustomWidgetComponent,
  CustomWidgetRenderer,
  CustomWidgetHtmlRenderer,
  CustomWidgetRendererConfig,
  WidgetTemplateContext,
} from './custom-widget-renderer.types';

export {
  isHtmlRenderer,
  isComponentRenderer,
  isTemplateRenderer,
} from './custom-widget-renderer.types';

// Export Angular renderer and built-in components
export {
  AngularWidgetRenderer,
  ButtonWidgetComponent,
  CardWidgetComponent,
  InputWidgetComponent,
  TextAreaWidgetComponent,
  DropdownWidgetComponent,
  SliderWidgetComponent,
  ToggleWidgetComponent,
  FileUploadWidgetComponent,
  ThemeSwitcherWidgetComponent,
  DatePickerWidgetComponent,
  MultiSelectWidgetComponent,
  ProgressBarWidgetComponent,
  FormWidgetComponent,
  ImageWidgetComponent,
  ImageCollectionWidgetComponent,
} from './renderers';

export type {
  AngularRendererOptions,
} from './renderers';

export { BUILT_IN_WIDGET_COMPONENTS } from './renderers/built-in-components';

// Re-export commonly used types and classes from core package
export {
  ChatWidget,
} from '@bbq-chat/widgets';

export type {
  ButtonWidget,
  CardWidget,
  FormWidget,
  InputWidget,
  TextAreaWidget,
  DropdownWidget,
  SliderWidget,
  ToggleWidget,
  FileUploadWidget,
  DatePickerWidget,
  MultiSelectWidget,
  ProgressBarWidget,
  ThemeSwitcherWidget,
  ImageWidget,
  ImageCollectionWidget,
} from '@bbq-chat/widgets';

// Re-export utilities
export {
  SsrWidgetRenderer,
  WidgetEventManager,
  customWidgetRegistry,
} from '@bbq-chat/widgets';

// Version
export const VERSION = '1.0.5';
