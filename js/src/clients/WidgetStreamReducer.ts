export type WidgetStreamEventKind =
  | 'widget.snapshot'
  | 'widget.upsert'
  | 'widget.patch'
  | 'widget.remove'
  | 'widget.status'
  | 'widget.action-result'
  | 'stream.resync-required'
  | 'stream.heartbeat';

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

export interface WidgetState {
  revision: number;
  widget: any;
}
export type WidgetStreamReduction =
  | { status: 'applied'; instanceId: string; state?: WidgetState }
  | { status: 'ignored' }
  | { status: 'resync-required'; reason: string };

/** Deterministic client-side reconciliation keyed by server-owned widget instance ID. */
export class WidgetStreamReducer {
  private readonly widgets = new Map<string, WidgetState>();
  private readonly removed = new Map<string, number>();
  private readonly eventIds = new Set<string>();

  get(instanceId: string): WidgetState | undefined {
    return this.widgets.get(instanceId);
  }
  values(): ReadonlyMap<string, WidgetState> {
    return this.widgets;
  }

  reduce(event: WidgetStreamEvent): WidgetStreamReduction {
    if (
      !event ||
      event.protocolVersion !== '1.0' ||
      typeof event.eventId !== 'string' ||
      !event.eventId ||
      typeof event.streamId !== 'string' ||
      !event.streamId
    )
      return { status: 'resync-required', reason: 'invalid-envelope' };
    if (this.eventIds.has(event.eventId)) return { status: 'ignored' };
    this.eventIds.add(event.eventId);
    if (this.eventIds.size > 1024) this.eventIds.delete(this.eventIds.values().next().value!);
    if (event.kind === 'stream.heartbeat') return { status: 'ignored' };
    if (event.kind === 'stream.resync-required')
      return { status: 'resync-required', reason: 'server-requested' };
    if (
      typeof event.instanceId !== 'string' ||
      !event.instanceId ||
      !Number.isSafeInteger(event.revision) ||
      event.revision! < 0
    )
      return { status: 'resync-required', reason: 'invalid-envelope' };

    const current = this.widgets.get(event.instanceId);
    if (event.revision! <= (this.removed.get(event.instanceId) ?? -1)) return { status: 'ignored' };
    if (current && event.revision! <= current.revision) return { status: 'ignored' };
    if (event.kind === 'widget.snapshot' || event.kind === 'widget.upsert') {
      const state = { revision: event.revision!, widget: structuredClone(event.payload) };
      this.removed.delete(event.instanceId);
      this.widgets.set(event.instanceId, state);
      return { status: 'applied', instanceId: event.instanceId, state };
    }
    if (event.baseRevision === undefined || !current || current.revision !== event.baseRevision)
      return { status: 'resync-required', reason: 'revision-gap' };
    if (event.kind === 'widget.remove') {
      this.widgets.delete(event.instanceId);
      this.removed.set(event.instanceId, event.revision!);
      return { status: 'applied', instanceId: event.instanceId };
    }
    if (event.kind !== 'widget.patch') return { status: 'ignored' };
    try {
      const widget = applyPatch(current.widget, event.payload);
      const state = { revision: event.revision!, widget };
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
    if (
      !operation ||
      !['add', 'replace', 'remove'].includes(operation.op) ||
      typeof operation.path !== 'string' ||
      !operation.path.startsWith('/')
    )
      throw new Error('Unsupported patch');
    if (/~(?![01])/.test(operation.path)) throw new Error('Invalid pointer');
    const parts = operation.path
      .slice(1)
      .split('/')
      .map((x: string) => x.replace(/~1/g, '/').replace(/~0/g, '~'));
    if (parts.some((part: string) => ['__proto__', 'constructor', 'prototype'].includes(part)))
      throw new Error('Unsafe path');
    let target = result;
    for (const part of parts.slice(0, -1)) {
      if (
        target === null ||
        typeof target !== 'object' ||
        !Object.prototype.hasOwnProperty.call(target, part)
      )
        throw new Error('Invalid path');
      target = target[part];
    }
    if (target === null || typeof target !== 'object') throw new Error('Invalid target');
    const key = parts[parts.length - 1];
    if (Array.isArray(target)) {
      const append = key === '-' && operation.op === 'add';
      if (!append && !/^(0|[1-9]\d*)$/.test(key)) throw new Error('Invalid index');
      const index = append ? target.length : Number(key);
      if (
        !Number.isSafeInteger(index) ||
        index > target.length ||
        (operation.op !== 'add' && index === target.length)
      )
        throw new Error('Invalid index');
      if (operation.op === 'remove') target.splice(index, 1);
      else if (operation.op === 'add') target.splice(index, 0, structuredClone(operation.value));
      else target[index] = structuredClone(operation.value);
    } else {
      if (operation.op !== 'add' && !Object.prototype.hasOwnProperty.call(target, key))
        throw new Error('Invalid path');
      if (operation.op === 'remove') delete target[key];
      else target[key] = structuredClone(operation.value);
    }
  }
  return result;
}
