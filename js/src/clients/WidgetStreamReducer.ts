export type WidgetStreamEventKind =
  | 'widget.snapshot' | 'widget.upsert' | 'widget.patch' | 'widget.remove'
  | 'widget.status' | 'widget.action-result' | 'stream.resync-required' | 'stream.heartbeat';

export interface WidgetStreamEvent {
  protocolVersion: string;
  eventId: string;
  streamId: string;
  instanceId?: string;
  baseRevision?: number;
  revision?: number;
  kind: WidgetStreamEventKind;
  payload: any;
}

export interface WidgetState { revision: number; widget: any; }
export type WidgetStreamReduction =
  | { status: 'applied'; instanceId: string; state?: WidgetState }
  | { status: 'ignored' }
  | { status: 'resync-required'; reason: string };

/** Deterministic client-side reconciliation keyed by server-owned widget instance ID. */
export class WidgetStreamReducer {
  private readonly widgets = new Map<string, WidgetState>();
  private readonly eventIds = new Set<string>();

  get(instanceId: string): WidgetState | undefined { return this.widgets.get(instanceId); }
  values(): ReadonlyMap<string, WidgetState> { return this.widgets; }

  reduce(event: WidgetStreamEvent): WidgetStreamReduction {
    if (this.eventIds.has(event.eventId)) return { status: 'ignored' };
    this.eventIds.add(event.eventId);
    if (event.kind === 'stream.heartbeat') return { status: 'ignored' };
    if (event.kind === 'stream.resync-required') return { status: 'resync-required', reason: 'server-requested' };
    if (!event.instanceId || event.revision === undefined) return { status: 'resync-required', reason: 'invalid-envelope' };

    const current = this.widgets.get(event.instanceId);
    if (current && event.revision <= current.revision) return { status: 'ignored' };
    if (event.kind === 'widget.snapshot' || event.kind === 'widget.upsert') {
      const state = { revision: event.revision, widget: structuredClone(event.payload) };
      this.widgets.set(event.instanceId, state);
      return { status: 'applied', instanceId: event.instanceId, state };
    }
    if (event.baseRevision === undefined || !current || current.revision !== event.baseRevision)
      return { status: 'resync-required', reason: 'revision-gap' };
    if (event.kind === 'widget.remove') {
      this.widgets.delete(event.instanceId);
      return { status: 'applied', instanceId: event.instanceId };
    }
    if (event.kind !== 'widget.patch') return { status: 'ignored' };
    try {
      const widget = applyPatch(current.widget, event.payload);
      const state = { revision: event.revision, widget };
      this.widgets.set(event.instanceId, state);
      return { status: 'applied', instanceId: event.instanceId, state };
    } catch {
      return { status: 'resync-required', reason: 'invalid-patch' };
    }
  }
}

function applyPatch(source: any, operations: any[]): any {
  if (!Array.isArray(operations)) throw new Error('Patch must be an array');
  const result = structuredClone(source);
  for (const operation of operations) {
    if (!operation || !['add', 'replace', 'remove'].includes(operation.op) || typeof operation.path !== 'string') throw new Error('Unsupported patch');
    const parts = operation.path.split('/').slice(1).map((x: string) => x.replace(/~1/g, '/').replace(/~0/g, '~'));
    if (!parts.length) throw new Error('Root patches are unsupported');
    let target = result;
    for (const part of parts.slice(0, -1)) {
      if (target === null || typeof target !== 'object' || !(part in target)) throw new Error('Invalid path');
      target = target[part];
    }
    const key = parts[parts.length - 1];
    if (operation.op === 'remove') {
      if (!(key in target)) throw new Error('Invalid path');
      if (Array.isArray(target)) {
        target.splice(Number(key), 1);
      } else {
        delete target[key];
      }
    } else {
      if (operation.op === 'replace' && !(key in target)) throw new Error('Invalid path');
      target[key] = structuredClone(operation.value);
    }
  }
  return result;
}
