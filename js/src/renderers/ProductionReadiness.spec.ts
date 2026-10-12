import { describe, expect, it } from 'vitest';
import { ButtonWidget, ChatWidget, FormWidget, ImageWidget } from '../models/ChatWidget';
import { WidgetManager } from './WidgetManager';
import { SsrWidgetRenderer } from './SsrWidgetRenderer';

describe('production widget integration', () => {
  it('hydrates a streamed root button once, even after repeated attachment and manager replacement', () => {
    const container = document.createElement('div');
    const calls: string[] = [];
    const manager = new WidgetManager({
      container,
      actionHandler: {
        handle: async (action) => {
          calls.push(action);
        },
      },
    });
    manager.updateWidget('id"[]', new ButtonWidget('Go', 'go'));
    manager.attachHandlers(container);
    manager.attachHandlers(container);
    (container.querySelector('button') as HTMLButtonElement).click();
    expect(calls).toEqual(['go']);
    const replacement = new WidgetManager({
      container,
      actionHandler: {
        handle: async (action) => {
          calls.push(`new:${action}`);
        },
      },
    });
    replacement.attachHandlers(container);
    (container.querySelector('button') as HTMLButtonElement).click();
    expect(calls).toEqual(['go', 'new:go']);
    replacement.detachHandlers(container);
    (container.querySelector('button') as HTMLButtonElement).click();
    expect(calls).toHaveLength(2);
    manager.unmountWidget('id"[]');
    expect(container.children).toHaveLength(0);
  });

  it('keeps matching widget IDs in independent conversations isolated', () => {
    const a = document.createElement('div');
    const b = document.createElement('div');
    const first = new WidgetManager({ container: a });
    const second = new WidgetManager({ container: b });
    first.updateWidget('shared', new ButtonWidget('First', 'go'));
    second.updateWidget('shared', new ButtonWidget('Second', 'go'));
    first.updateWidget('shared', new ButtonWidget('Updated', 'go'));
    expect(a.textContent).toBe('Updated');
    expect(b.textContent).toBe('Second');
  });

  it('rejects invalid email input and dispatches a corrected form exactly once', () => {
    const calls: unknown[] = [];
    const container = document.createElement('div');
    const manager = new WidgetManager({
      actionHandler: {
        handle: async (_action, payload) => {
          calls.push(payload);
        },
      },
    });
    manager.renderInto(
      container,
      new FormWidget(
        'Contact',
        'contact',
        'Contact',
        [{ name: 'email', label: 'Email', type: 'email', required: true }],
        [{ label: 'Submit', type: 'submit' }]
      )
    );
    const input = container.querySelector('input')!;
    const button = container.querySelector('button')!;
    input.value = 'invalid';
    input.dispatchEvent(new Event('change'));
    button.click();
    expect(calls).toEqual([]);
    input.value = 'person@example.com';
    input.dispatchEvent(new Event('change'));
    button.click();
    expect(calls).toEqual([{ email: 'person@example.com' }]);
  });

  it('deserializes image models without CommonJS and ignores null model input', () => {
    expect(ChatWidget.fromObject(null)).toBeNull();
    expect(ChatWidget.fromObject({ type: 'image', imageUrl: '/image.png' })).toBeInstanceOf(
      ImageWidget
    );
  });

  it('escapes numeric attributes supplied as malicious runtime values', () => {
    const renderer = new SsrWidgetRenderer();
    const container = document.createElement('div');
    const attack = '1" onerror="alert(1)" onfocus="alert(1)';
    for (const widget of [
      { type: 'image', label: 'Image', action: 'view', imageUrl: '/image.png', width: attack },
      { type: 'input', label: 'Input', action: 'save', maxLength: attack },
      { type: 'slider', label: 'Slider', action: 'save', min: attack, max: 100, step: 1 },
      { type: 'progressbar', label: 'Progress', action: 'save', value: attack, max: 100 },
    ]) {
      container.innerHTML = renderer.renderWidget(widget as ChatWidget);
      expect(container.querySelector('[onerror], [onfocus]')).toBeNull();
    }
  });
});
