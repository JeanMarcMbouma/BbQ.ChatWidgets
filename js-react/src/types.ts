import type { ComponentType, ReactNode } from "react";
import type {
  ChatWidget,
  FormField,
  FormAction,
  ImageItem,
} from "@bbq-chat/widgets";

/** Accepts model instances and JSON wire objects without requiring class methods. */
export interface WidgetData extends Pick<
  ChatWidget,
  "type" | "label" | "action"
> {
  instanceId?: string;
  hideLabel?: boolean;
  showLabel?: boolean;
  appearance?: "form";
  title?: string;
  description?: string;
  imageUrl?: string;
  alt?: string;
  width?: number;
  height?: number;
  images?: ImageItem[];
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  options?: string[];
  themes?: string[];
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  defaultValue?: unknown;
  minDate?: string;
  maxDate?: string;
  accept?: string;
  maxBytes?: number;
  fields?: FormField[];
  actions?: FormAction[];
}
export type WidgetActionHandler = (
  actionName: string,
  payload: unknown,
) => void;
export interface WidgetProps<W extends WidgetData = WidgetData> {
  widget: W;
  onWidgetAction?: WidgetActionHandler;
  onValidationState?: (event: FormValidationEvent) => void;
  disabled?: boolean;
}
export type CustomWidgetComponent = ComponentType<WidgetProps>;
export interface WidgetTemplateContext extends WidgetProps {
  emitAction: WidgetActionHandler;
}
export type CustomWidgetHtmlRenderer = (widget: WidgetData) => string;
/** Explicit kinds avoid confusing React function components with HTML render functions. */
export type CustomWidgetRenderer =
  | { kind: "component"; component: CustomWidgetComponent }
  | { kind: "template"; render: (context: WidgetTemplateContext) => ReactNode }
  | { kind: "html"; render: CustomWidgetHtmlRenderer };
export interface CustomWidgetRendererConfig {
  type: string;
  renderer: CustomWidgetRenderer;
}
export interface FormFieldProps {
  field: FormField;
  id: string;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled: boolean;
  invalid: boolean;
}
export type FormFieldComponent = ComponentType<FormFieldProps>;
export interface FormValidationEvent {
  formId: string;
  valid: boolean;
  errors: Array<{ field: string; reason?: string }>;
}
export const isHtmlRenderer = (
  renderer: CustomWidgetRenderer,
): renderer is Extract<CustomWidgetRenderer, { kind: "html" }> =>
  renderer.kind === "html";
export const isComponentRenderer = (
  renderer: CustomWidgetRenderer,
): renderer is Extract<CustomWidgetRenderer, { kind: "component" }> =>
  renderer.kind === "component";
export const isTemplateRenderer = (
  renderer: CustomWidgetRenderer,
): renderer is Extract<CustomWidgetRenderer, { kind: "template" }> =>
  renderer.kind === "template";
