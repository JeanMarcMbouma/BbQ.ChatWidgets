import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WidgetManager } from '../renderers/WidgetManager';
import { ButtonWidget } from '../models/ChatWidget';
import WidgetSseManager from './WidgetSseManager';

class FakeEventSource {
  private listeners: Record<string, Array<(e: any) => void>> = {};
  constructor(_url: string) {}
  addEventListener(name: string, cb: (e: any) => void) {
    (this.listeners[name] ||= []).push(cb);
  }
  dispatchMessage(data: any) {
    const ev = { data: JSON.stringify(data) } as any;
    (this.listeners['message'] || []).forEach((cb) => cb(ev));
  }
  close() {}
  dispatchEvent(name: string, data: any) {
    (this.listeners[name] || []).forEach((cb) => cb({ data: JSON.stringify(data) }));
  }
}

describe('WidgetSseManager', () => {
  it('ignores queued messages from disconnected sources', () => {
    const sources = [new FakeEventSource(''), new FakeEventSource('')];
    let index = 0;
    const manager = new WidgetSseManager(new WidgetManager(), {
      createEventSource: () => sources[index++] as any,
    });
    const handler = vi.fn();
    manager.registerHandler('widget', handler);
    manager.connect('/first');
    manager.connect('/second');
    sources[0].dispatchMessage({ widgetId: 'widget', payload: 'stale' });
    sources[1].dispatchMessage({ widgetId: 'widget', payload: 'current' });
    manager.disconnect();
    sources[1].dispatchMessage({ widgetId: 'widget', payload: 'closed' });
    expect(handler).toHaveBeenCalledExactlyOnceWith('current');
  });

  it('starts fresh revision and event tracking on an explicit connection', () => {
    const sources = [new FakeEventSource(''), new FakeEventSource('')];
    let index = 0;
    const widgets = new WidgetManager();
    const update = vi.spyOn(widgets, 'updateWidget');
    const manager = new WidgetSseManager(widgets, {
      createEventSource: () => sources[index++] as any,
    });
    const event = {
      protocolVersion: '1.0', eventId: '1', streamId: 'stream',
      instanceId: 'widget', revision: 1, kind: 'widget.snapshot',
      payload: { type: 'button', label: 'Hello', action: 'hello' },
    };
    manager.connect('/first');
    sources[0].dispatchEvent(event.kind, event);
    manager.connect('/second');
    sources[0].dispatchEvent(event.kind, { ...event, eventId: '2', revision: 2 });
    sources[1].dispatchEvent(event.kind, event);
    expect(update).toHaveBeenCalledTimes(2);
  });
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('updates widget DOM when SSE sends widget payload', () => {
    const wm = new WidgetManager();
    const container = document.createElement('div');
    document.body.appendChild(container);

    const widget = new ButtonWidget('Old', 'act');
    container.innerHTML = wm.renderWidget(widget);
    wm.attachHandlers(container);

    const fakeEs = new FakeEventSource('');
    const sse = new WidgetSseManager(wm, { createEventSource: () => (fakeEs as any) });
    sse.connect('/events');

    // Find rendered widget id
    const el = container.querySelector('[data-widget-id]')!;
    const wid = el.getAttribute('data-widget-id')!;

    // Send update with new widget data
    fakeEs.dispatchMessage({ widgetId: wid, widget: { type: 'button', label: 'New', action: 'act' } });

    const updated = document.querySelector(`[data-widget-id="${wid}"]`)!;
    expect(updated).toBeTruthy();
    expect(updated.textContent).toContain('New');
  });

  it('calls registered handler when present instead of DOM update', () => {
    const wm = new WidgetManager();
    const fakeEs = new FakeEventSource('');
    const sse = new WidgetSseManager(wm, { createEventSource: () => (fakeEs as any) });
    sse.connect('/events');

    let called = false;
    sse.registerHandler('my-widget', (payload) => {
      called = true;
      expect(payload.foo).toBe(42);
    });

    fakeEs.dispatchMessage({ widgetId: 'my-widget', payload: { foo: 42 } });
    expect(called).toBe(true);
  });
});
