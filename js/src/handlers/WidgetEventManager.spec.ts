import { describe, it, expect, afterEach } from 'vitest';
import { WidgetEventManager, DefaultWidgetActionHandler } from '../src/handlers/WidgetEventManager';
import { SsrWidgetRenderer } from '../src/renderers/SsrWidgetRenderer';
import { ButtonWidget, InputWidget, DropdownWidget } from '../src/models/ChatWidget';

describe('WidgetEventManager', () => {
  let container: HTMLDivElement;

  const setupContainer = () => {
    container = document.createElement('div');
    document.body.appendChild(container);
  };

  const teardown = () => {
    if (container) {
      document.body.removeChild(container);
    }
  };

  afterEach(teardown);

  describe('Button event attachment', () => {
    it('should attach click listener to button widget', () => {
      setupContainer();
      const renderer = new SsrWidgetRenderer();
      const widget = new ButtonWidget('Click', 'submit');
      container.innerHTML = renderer.renderWidget(widget);

      let actionCalled = false;
      let capturedAction = '';

      const handler = {
        handle: async (action: string) => {
          actionCalled = true;
          capturedAction = action;
        },
      };

      const manager = new WidgetEventManager(handler);
      manager.attachHandlers(container);

      const button = container.querySelector('button');
      button?.click();

      expect(actionCalled).toBe(true);
      expect(capturedAction).toBe('submit');
    });
  });

  describe('Input event attachment', () => {
    it('should attach change listener to input widget', async () => {
      setupContainer();
      const renderer = new SsrWidgetRenderer();
      const widget = new InputWidget('Name', 'input_name');
      container.innerHTML = renderer.renderWidget(widget);

      let actionCalled = false;
      let capturedPayload: any;

      const handler = {
        handle: async (action: string, payload: any) => {
          actionCalled = true;
          capturedPayload = payload;
        },
      };

      const manager = new WidgetEventManager(handler);
      manager.attachHandlers(container);

      const input = container.querySelector('input') as HTMLInputElement;
      input.value = 'test value';
      input.dispatchEvent(new Event('change', { bubbles: true }));

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(actionCalled).toBe(true);
      expect(capturedPayload.value).toBe('test value');
    });
  });

  describe('Dropdown event attachment', () => {
    it('should attach change listener to dropdown widget', async () => {
      setupContainer();
      const renderer = new SsrWidgetRenderer();
      const widget = new DropdownWidget('Select', 'select_option', ['A', 'B', 'C']);
      container.innerHTML = renderer.renderWidget(widget);

      let capturedPayload: any;

      const handler = {
        handle: async (action: string, payload: any) => {
          capturedPayload = payload;
        },
      };

      const manager = new WidgetEventManager(handler);
      manager.attachHandlers(container);

      const select = container.querySelector('select') as HTMLSelectElement;
      select.value = 'B';
      select.dispatchEvent(new Event('change', { bubbles: true }));

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(capturedPayload.value).toBe('B');
    });
  });

  describe('DefaultWidgetActionHandler', () => {
    it('should make fetch request with action and payload', async () => {
      const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = fetchSpy;

      const handler = new DefaultWidgetActionHandler('/api/action');
      await handler.handle('test_action', { key: 'value' });

      expect(fetchSpy).toHaveBeenCalledWith('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_action',
          payload: { key: 'value' },
        }),
      });
    });
  });
});
