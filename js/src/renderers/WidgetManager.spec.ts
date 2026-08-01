import { describe, it, expect } from 'vitest';
import { WidgetManager } from './WidgetManager';
import { ButtonWidget, InputWidget, ProgressBarWidget } from '../models/ChatWidget';
import type { IWidgetActionHandler } from '../handlers/WidgetEventManager';

class TestHandler implements IWidgetActionHandler {
  public calls: Array<{ action: string; payload: any }> = [];
  async handle(action: string, payload: any): Promise<void> {
    this.calls.push({ action, payload });
  }
}

describe('WidgetManager integration', () => {
  it('renders into container and wires up event handlers', async () => {
    const handler = new TestHandler();
    const manager = new WidgetManager({ actionHandler: handler });

    const container = global.document.createElement('div');
    const widget = new ButtonWidget('Click', 'doAction');

    manager.renderInto(container, widget);

    const btn = container.querySelector('button');
    expect(btn).toBeTruthy();

    // simulate click
    (btn as HTMLButtonElement).click();

    // allow microtask to complete
    await Promise.resolve();

    expect(handler.calls.length).toBeGreaterThanOrEqual(1);
    expect(handler.calls[0].action).toBe('doAction');
  });

  it('orders lifecycle callbacks, preserves unrelated focused DOM state, and removes by instance ID', () => {
    document.body.innerHTML = '<div data-widget-stream></div>';
    const calls: string[] = [];
    const manager = new WidgetManager({
      lifecycle: {
        mount: id => calls.push(`mount:${id}`),
        update: (id, element, widget) => {
          calls.push(`update:${id}`);
          if (widget instanceof ProgressBarWidget) {
            element.querySelector('progress')?.setAttribute('value', String(widget.value));
            return true;
          }
        },
        unmount: id => calls.push(`unmount:${id}`),
      },
    });

    manager.updateWidget('form-field', new InputWidget('Name', 'name'));
    manager.updateWidget('progress', new ProgressBarWidget('Upload', 'progress', 10, 100));
    const input = document.querySelector('[data-widget-instance-id="form-field"] input') as HTMLInputElement;
    const progress = document.querySelector('[data-widget-instance-id="progress"]') as Element;
    input.value = 'unsent text';
    input.focus();
    input.setSelectionRange(3, 7);

    manager.updateWidget('progress', new ProgressBarWidget('Upload', 'progress', 75, 100));

    expect(document.querySelector('[data-widget-instance-id="form-field"] input')).toBe(input);
    expect(document.querySelector('[data-widget-instance-id="progress"]')).toBe(progress);
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('unsent text');
    expect([input.selectionStart, input.selectionEnd]).toEqual([3, 7]);
    expect(progress.querySelector('progress')?.getAttribute('value')).toBe('75');

    manager.unmountWidget('progress');
    expect(document.querySelector('[data-widget-instance-id="progress"]')).toBeNull();
    expect(calls).toEqual(['mount:form-field', 'mount:progress', 'update:progress', 'unmount:progress']);
  });
});
