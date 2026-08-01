import { describe, expect, it } from 'vitest';
import { WidgetStreamReducer, type WidgetStreamEvent } from './WidgetStreamReducer';

const event = (overrides: Partial<WidgetStreamEvent>): WidgetStreamEvent => ({
  protocolVersion: '1.0', eventId: crypto.randomUUID(), streamId: 'demo',
  instanceId: 'widget-1', revision: 0, kind: 'widget.snapshot', payload: { type: 'progressbar', value: 10, max: 100 },
  ...overrides,
});

describe('WidgetStreamReducer', () => {
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
});
