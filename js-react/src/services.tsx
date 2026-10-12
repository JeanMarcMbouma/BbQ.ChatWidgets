import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  customWidgetRegistry,
  SsrWidgetRenderer,
  WidgetEventManager,
  type ChatWidget,
  type IWidgetActionHandler,
} from "@bbq-chat/widgets";
import type {
  CustomWidgetRenderer,
  CustomWidgetComponent,
  CustomWidgetHtmlRenderer,
  WidgetTemplateContext,
  FormValidationEvent,
  FormFieldComponent,
} from "./types.js";
import { ReactWidgetRenderer } from "./components.js";

export class WidgetRegistryService {
  private readonly renderers = new Map<string, CustomWidgetRenderer>();
  registerFactory(
    type: string,
    factory: (value: unknown) => ChatWidget | null,
  ): void {
    customWidgetRegistry.registerFactory(type, factory);
  }
  registerClass(
    type: string,
    ctor: new (...args: never[]) => ChatWidget,
  ): void {
    customWidgetRegistry.registerClass(type, ctor);
  }
  getFactory(type: string) {
    return customWidgetRegistry.getFactory(type);
  }
  registerRenderer(type: string, renderer: CustomWidgetRenderer): void {
    if (!type || !renderer)
      throw new Error("A widget type and renderer are required");
    this.renderers.set(type, renderer);
  }
  registerComponent(type: string, component: CustomWidgetComponent): void {
    this.registerRenderer(type, { kind: "component", component });
  }
  registerHtml(type: string, render: CustomWidgetHtmlRenderer): void {
    this.registerRenderer(type, { kind: "html", render });
  }
  registerTemplate(
    type: string,
    render: (context: WidgetTemplateContext) => ReactNode,
  ): void {
    this.registerRenderer(type, { kind: "template", render });
  }
  getRenderer(type: string) {
    return this.renderers.get(type);
  }
  hasRenderer(type: string): boolean {
    return this.renderers.has(type);
  }
  unregisterRenderer(type: string): boolean {
    return this.renderers.delete(type);
  }
}

export class FormValidationService {
  private readonly listeners = new Set<(event: FormValidationEvent) => void>();
  subscribe(listener: (event: FormValidationEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  emit(event: FormValidationEvent): void {
    for (const listener of this.listeners) listener(event);
  }
}
export type WidgetEventManagerFactory = (
  handler?: IWidgetActionHandler,
) => WidgetEventManager;
export const widgetEventManagerFactoryProvider =
  (): WidgetEventManagerFactory => (handler) =>
    new WidgetEventManager(handler);
export const ssrWidgetRendererFactory = () => new SsrWidgetRenderer();
export interface WidgetServices {
  registry: WidgetRegistryService;
  validation: FormValidationService;
  htmlRenderer: SsrWidgetRenderer;
  eventManagerFactory: WidgetEventManagerFactory;
  fieldComponents: Record<string, FormFieldComponent>;
  renderer: ReactWidgetRenderer;
}
function createServices(): WidgetServices {
  return {
    registry: new WidgetRegistryService(),
    validation: new FormValidationService(),
    htmlRenderer: ssrWidgetRendererFactory(),
    eventManagerFactory: widgetEventManagerFactoryProvider(),
    fieldComponents: {},
    renderer: new ReactWidgetRenderer(),
  };
}
const WidgetContext = createContext<WidgetServices | null>(null);
/** Per-tree services replace Angular injection tokens. No browser globals are accessed during SSR. */
export function WidgetProvider({
  children,
  ...overrides
}: Partial<WidgetServices> & { children: ReactNode }) {
  const [defaults] = useState(createServices);
  const parent = useContext(WidgetContext);
  return (
    <WidgetContext.Provider value={{ ...(parent ?? defaults), ...overrides }}>
      {children}
    </WidgetContext.Provider>
  );
}
export function useWidgetServices(): WidgetServices {
  const context = useContext(WidgetContext);
  const [local] = useState(createServices);
  return context ?? local;
}
export function useFormValidation(formId?: string): FormValidationEvent | null {
  const { validation } = useWidgetServices();
  const [event, setEvent] = useState<FormValidationEvent | null>(null);
  useEffect(() => {
    setEvent(null);
    return validation.subscribe((next) => {
      if (!formId || next.formId === formId) setEvent(next);
    });
  }, [validation, formId]);
  return event;
}
export function FormValidationListener({
  formId,
  children,
}: {
  formId?: string;
  children?: (event: FormValidationEvent | null) => ReactNode;
}) {
  const event = useFormValidation(formId);
  if (children) return <>{children(event)}</>;
  return event ? (
    <div role="status">
      {event.valid
        ? "Form is valid"
        : event.errors
            .map((error) => `${error.field}: ${error.reason}`)
            .join(", ")}
    </div>
  ) : null;
}
