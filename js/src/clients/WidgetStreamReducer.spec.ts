import { describe, expect, it } from 'vitest';
import { WidgetStreamReducer, type WidgetStreamEvent } from './WidgetStreamReducer';
import { readFileSync } from 'node:fs';

const event = (overrides: Partial<WidgetStreamEvent>): WidgetStreamEvent => ({
  protocolVersion: '1.0',
  eventId: crypto.randomUUID(),
  streamId: 'demo',
  instanceId: 'widget-1',
  revision: 0,
  kind: 'widget.snapshot',
  payload: { type: 'progressbar', value: 10, max: 100 },
  ...overrides,
});

describe('WidgetStreamReducer', () => {
  it('consumes the repository shared lifecycle fixture', () => {
    const fixture = JSON.parse(
      readFileSync('../test-fixtures/schema-first-lifecycle.json', 'utf8')
    );
    const reducer = new WidgetStreamReducer();
    expect(reducer.reduce(fixture.form).status).toBe('applied');
    expect(fixture.events.map((x: WidgetStreamEvent) => reducer.reduce(x).status)).toEqual([
      'applied',
      'applied',
      'resync-required',
      'applied',
      'applied',
    ]);
  });
  it('applies snapshots and patches in revision order', () => {
    const reducer = new WidgetStreamReducer();
    expect(reducer.reduce(event({ eventId: '1' })).status).toBe('applied');
    const result = reducer.reduce(
      event({
        eventId: '2',
        kind: 'widget.patch',
        baseRevision: 0,
        revision: 1,
        payload: [{ op: 'replace', path: '/value', value: 50 }],
      })
    );
    expect(result.status).toBe('applied');
    expect(reducer.get('widget-1')?.widget.value).toBe(50);
  });

  it('ignores duplicate events and requests resync for revision gaps', () => {
    const reducer = new WidgetStreamReducer();
    reducer.reduce(event({ eventId: '1' }));
    expect(reducer.reduce(event({ eventId: '1' })).status).toBe('ignored');
    expect(
      reducer.reduce(
        event({ eventId: '2', kind: 'widget.patch', baseRevision: 4, revision: 5, payload: [] })
      ).status
    ).toBe('resync-required');
  });

  it('removes keyed widget state', () => {
    const reducer = new WidgetStreamReducer();
    reducer.reduce(event({ eventId: '1' }));
    reducer.reduce(
      event({ eventId: '2', kind: 'widget.remove', baseRevision: 0, revision: 1, payload: {} })
    );
    expect(reducer.get('widget-1')).toBeUndefined();
  });

  it('replays retained reconnect events and recovers from an intentional gap with a snapshot', () => {
    const reducer = new WidgetStreamReducer();
    reducer.reduce(event({ eventId: 'snapshot', revision: 0 }));
    expect(
      reducer.reduce(
        event({
          eventId: 'replay-1',
          kind: 'widget.patch',
          baseRevision: 0,
          revision: 1,
          payload: [{ op: 'replace', path: '/value', value: 20 }],
        })
      ).status
    ).toBe('applied');
    expect(
      reducer.reduce(
        event({
          eventId: 'replay-2',
          kind: 'widget.patch',
          baseRevision: 1,
          revision: 2,
          payload: [{ op: 'replace', path: '/value', value: 30 }],
        })
      ).status
    ).toBe('applied');

    const gap = reducer.reduce(
      event({ eventId: 'gap', kind: 'widget.patch', baseRevision: 3, revision: 4, payload: [] })
    );
    expect(gap).toEqual({ status: 'resync-required', reason: 'revision-gap' });

    const replacement = reducer.reduce(
      event({
        eventId: 'replacement',
        kind: 'widget.snapshot',
        revision: 4,
        payload: { type: 'progressbar', value: 80, max: 100 },
      })
    );
    expect(replacement.status).toBe('applied');
    expect(reducer.get('widget-1')).toEqual({
      revision: 4,
      widget: { type: 'progressbar', value: 80, max: 100 },
    });
  });
});

describe('untrusted stream patches', () => {
  it('does not mutate prototypes or existing widget state on rejected paths', () => {
    const reducer = new WidgetStreamReducer();
    reducer.reduce(event({}));
    for (const path of [
      '/__proto__/polluted',
      '/constructor/prototype/polluted',
      'value',
      '/value~2',
    ]) {
      expect(
        reducer.reduce(
          event({
            kind: 'widget.patch',
            baseRevision: 0,
            revision: 1,
            payload: [{ op: 'add', path, value: true }],
          })
        ).status
      ).toBe('resync-required');
      expect(reducer.get('widget-1')?.revision).toBe(0);
    }
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('inserts, appends, replaces and removes array values using JSON Patch semantics', () => {
    const reducer = new WidgetStreamReducer();
    reducer.reduce(event({ payload: { options: ['a', 'c'] } }));
    const result = reducer.reduce(
      event({
        kind: 'widget.patch',
        baseRevision: 0,
        revision: 1,
        payload: [
          { op: 'add', path: '/options/1', value: 'b' },
          { op: 'add', path: '/options/-', value: 'd' },
          { op: 'replace', path: '/options/0', value: 'A' },
          { op: 'remove', path: '/options/2' },
        ],
      })
    );
    expect(result.status).toBe('applied');
    expect(reducer.get('widget-1')?.widget.options).toEqual(['A', 'b', 'd']);
    expect(
      reducer.reduce(
        event({
          kind: 'widget.patch',
          baseRevision: 1,
          revision: 2,
          payload: [{ op: 'remove', path: '/options/99' }],
        })
      ).status
    ).toBe('resync-required');
  });

  it('does not resurrect a removed widget from stale snapshots', () => {
    const reducer = new WidgetStreamReducer();
    reducer.reduce(event({}));
    reducer.reduce(event({ kind: 'widget.remove', baseRevision: 0, revision: 1 }));
    expect(reducer.reduce(event({ revision: 0 })).status).toBe('ignored');
    expect(reducer.get('widget-1')).toBeUndefined();
    expect(reducer.reduce(event({ revision: 2 })).status).toBe('applied');
  });

  it('rejects malformed envelope values', () => {
    const reducer = new WidgetStreamReducer();
    for (const overrides of [
      { eventId: '' },
      { protocolVersion: '2.0' },
      { revision: -1 },
      { revision: NaN },
    ]) {
      expect(reducer.reduce(event(overrides)).status).toBe('resync-required');
    }
  });
});
