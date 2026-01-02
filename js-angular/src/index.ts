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

// Re-export commonly used types from core package
export type {
  ChatWidget,
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
export const VERSION = '1.0.0';
