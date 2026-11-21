import { mountReporting } from './engine';
import type { ReportingAction, ReportingDefinition } from './types';

interface BlazorCallback {
  invokeMethodAsync(method: 'DispatchReportAction', action: string, payload: ReportingAction): Promise<void>;
}

const disposers = new WeakMap<Element, () => void>();

export function mount(element: Element, json: string, callback: BlazorCallback): void {
  unmount(element);
  const definition: ReportingDefinition = JSON.parse(json);
  disposers.set(element, mountReporting(element, definition,
    (action, payload) => { void callback.invokeMethodAsync('DispatchReportAction', action, payload); }));
}

export function unmount(element: Element): void {
  disposers.get(element)?.();
  disposers.delete(element);
}
