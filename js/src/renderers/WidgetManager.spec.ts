import { describe, it, expect } from 'vitest';
import { WidgetManager } from './WidgetManager';
import { ButtonWidget } from '../models/ChatWidget';
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
});
