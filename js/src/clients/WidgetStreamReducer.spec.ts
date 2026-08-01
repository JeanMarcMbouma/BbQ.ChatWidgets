import { describe, expect, it } from 'vitest';
import { WidgetStreamReducer, type WidgetStreamEvent } from './WidgetStreamReducer';
import { readFileSync } from 'node:fs';

const event = (overrides: Partial<WidgetStreamEvent>): WidgetStreamEvent => ({
  protocolVersion: '1.0', eventId: crypto.randomUUID(), streamId: 'demo',
  instanceId: 'widget-1', revision: 0, kind: 'widget.snapshot', payload: { type: 'progressbar', value: 10, max: 100 },
  ...overrides,
});

describe('WidgetStreamReducer', () => {
  it('consumes the repository shared lifecycle fixture', () => {
    const fixture = JSON.parse(readFileSync('../test-fixtures/schema-first-lifecycle.json', 'utf8'));
    const reducer = new WidgetStreamReducer();
    expect(reducer.reduce(fixture.form).status).toBe('applied');
    expect(fixture.events.map((x: WidgetStreamEvent) => reducer.reduce(x).status)).toEqual(['applied', 'applied', 'resync-required', 'applied', 'applied']);
  });
  it('applies snapshots and patches in revision order', () => {
    const reducer = new WidgetStreamReducer();
    expect(reducer.reduce(event({ eventId: '1' })).status).toBe('applied');
    const result = reducer.reduce(event({ eventId: '2', kind: 'widget.patch', baseRevision: 0, revision: 1, payload: [{ op: 'replace', path: '/value', value: 50 }] }));
    expect(result.status).toBe('applied');
    expect(reducer.get('widget-1')?.widget.value).toBe(50);
  });

  it('ignores duplicate events and requests resync for revision gaps', () => {
    const reducer = new WidgetStreamReducer();
    reducer.reduce(event({ eventId: '1' }));
    expect(reducer.reduce(event({ eventId: '1' })).status).toBe('ignored');
    expect(reducer.reduce(event({ eventId: '2', kind: 'widget.patch', baseRevision: 4, revision: 5, payload: [] })).status).toBe('resync-required');
  });

  it('removes keyed widget state', () => {
    const reducer = new WidgetStreamReducer();
    reducer.reduce(event({ eventId: '1' }));
    reducer.reduce(event({ eventId: '2', kind: 'widget.remove', baseRevision: 0, revision: 1, payload: {} }));
    expect(reducer.get('widget-1')).toBeUndefined();
  });

  it('replays retained reconnect events and recovers from an intentional gap with a snapshot', () => {
    const reducer = new WidgetStreamReducer();
    reducer.reduce(event({ eventId: 'snapshot', revision: 0 }));
    expect(reducer.reduce(event({ eventId: 'replay-1', kind: 'widget.patch', baseRevision: 0, revision: 1, payload: [{ op: 'replace', path: '/value', value: 20 }] })).status).toBe('applied');
    expect(reducer.reduce(event({ eventId: 'replay-2', kind: 'widget.patch', baseRevision: 1, revision: 2, payload: [{ op: 'replace', path: '/value', value: 30 }] })).status).toBe('applied');

    const gap = reducer.reduce(event({ eventId: 'gap', kind: 'widget.patch', baseRevision: 3, revision: 4, payload: [] }));
    expect(gap).toEqual({ status: 'resync-required', reason: 'revision-gap' });

    const replacement = reducer.reduce(event({ eventId: 'replacement', kind: 'widget.snapshot', revision: 4, payload: { type: 'progressbar', value: 80, max: 100 } }));
    expect(replacement.status).toBe('applied');
    expect(reducer.get('widget-1')).toEqual({ revision: 4, widget: { type: 'progressbar', value: 80, max: 100 } });
  });
});
