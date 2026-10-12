import { useSyncExternalStore } from "react";
import {
  WidgetStreamReducer,
  type WidgetStreamEvent,
  type WidgetManager,
} from "@bbq-chat/widgets";
import type { WidgetData } from "./types.js";

/** Framework adapter matching AngularSchemaFirstWidgetConsumer. */
export class ReactSchemaFirstWidgetConsumer {
  constructor(
    private readonly manager: WidgetManager,
    private readonly reducer = new WidgetStreamReducer(),
    private readonly requestResync: (reason: string) => void = () => {},
  ) {}
  consume(event: WidgetStreamEvent): void {
    const result = this.reducer.reduce(event);
    if (result.status === "resync-required") this.requestResync(result.reason);
    if (result.status === "applied") {
      if (result.state)
        this.manager.updateWidget(
          result.instanceId,
          result.state.widget,
          "React",
        );
      else this.manager.unmountWidget(result.instanceId);
    }
  }
}
/** One store per stream; immutable snapshots preserve React component identity across patches. */
export class WidgetStreamStore {
  private readonly reducer = new WidgetStreamReducer();
  private readonly listeners = new Set<() => void>();
  private snapshot: readonly WidgetData[] = [];
  constructor(
    private readonly requestResync: (reason: string) => void = () => {},
  ) {}
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getSnapshot = () => this.snapshot;
  consume = (event: WidgetStreamEvent): void => {
    const result = this.reducer.reduce(event);
    if (result.status === "resync-required") this.requestResync(result.reason);
    if (result.status === "applied") {
      this.snapshot = Array.from(
        this.reducer.values(),
        ([instanceId, state]) => ({ ...state.widget, instanceId }),
      );
      this.listeners.forEach((listener) => listener());
    }
  };
}
export function useWidgetStream(
  store: WidgetStreamStore,
): readonly WidgetData[] {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
}
