import { describe, it, expect, afterEach } from 'vitest';
import { WidgetEventManager, DefaultWidgetActionHandler } from './WidgetEventManager';
import { SsrWidgetRenderer } from '../renderers/SsrWidgetRenderer';
import { ButtonWidget, InputWidget, DropdownWidget, FormWidget } from '../models/ChatWidget';

describe('WidgetEventManager', () => {
  let container: HTMLDivElement;

  const setupContainer = () => {
    container = document.createElement('div');
    document.body.appendChild(container);
  };

  const teardown = () => {
    if (container && container.parentNode === document.body) {
      document.body.removeChild(container);
    }
    container = null as any;
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

  describe('Form validation', () => {
    it('should prevent submission when required fields are empty', async () => {
      setupContainer();
      const renderer = new SsrWidgetRenderer();
      const widget = new FormWidget(
        'form',
        'submit_form',
        'Test Form',
        [
          {
            name: 'username',
            label: 'Username',
            type: 'input',
            required: true,
          },
        ],
        [{ type: 'submit', label: 'Submit' }]
      );
      container.innerHTML = renderer.renderWidget(widget);

      let actionCalled = false;

      const handler = {
        handle: async (action: string, payload: any) => {
          actionCalled = true;
        },
      };

      const manager = new WidgetEventManager(handler);
      manager.attachHandlers(container);

      const submitButton = container.querySelector('.bbq-form-submit') as HTMLButtonElement;
      submitButton?.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should not call handler when form is invalid
      expect(actionCalled).toBe(false);
      
      // Should show validation message
      const validationMsg = container.querySelector('.bbq-form-validation-message') as HTMLElement;
      expect(validationMsg?.style.display).not.toBe('none');
    });

    it('should allow submission when required fields are filled', async () => {
      setupContainer();
      const renderer = new SsrWidgetRenderer();
      const widget = new FormWidget(
        'form',
        'submit_form',
        'Test Form',
        [
          {
            name: 'username',
            label: 'Username',
            type: 'input',
            required: true,
          },
        ],
        [{ type: 'submit', label: 'Submit' }]
      );
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

      // Fill in the required field
      const input = container.querySelector('input[name="username"]') as HTMLInputElement;
      input.value = 'testuser';
      input.dispatchEvent(new Event('change', { bubbles: true }));

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Now submit
      const submitButton = container.querySelector('.bbq-form-submit') as HTMLButtonElement;
      submitButton?.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should call handler when form is valid
      expect(actionCalled).toBe(true);
      expect(capturedPayload.username).toBe('testuser');
    });

    it('should handle forms with mixed required and optional fields', async () => {
      setupContainer();
      const renderer = new SsrWidgetRenderer();
      const widget = new FormWidget(
        'form',
        'submit_form',
        'Test Form',
        [
          {
            name: 'required_field',
            label: 'Required',
            type: 'input',
            required: true,
          },
          {
            name: 'optional_field',
            label: 'Optional',
            type: 'input',
            required: false,
          },
        ],
        [{ type: 'submit', label: 'Submit' }]
      );
      container.innerHTML = renderer.renderWidget(widget);

      let actionCalled = false;

      const handler = {
        handle: async (action: string, payload: any) => {
          actionCalled = true;
        },
      };

      const manager = new WidgetEventManager(handler);
      manager.attachHandlers(container);

      // Fill in only the required field
      const requiredInput = container.querySelector('input[name="required_field"]') as HTMLInputElement;
      requiredInput.value = 'value';
      requiredInput.dispatchEvent(new Event('change', { bubbles: true }));

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Submit should work even though optional field is empty
      const submitButton = container.querySelector('.bbq-form-submit') as HTMLButtonElement;
      submitButton?.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(actionCalled).toBe(true);
    });

    it('should handle cancel action without validation', async () => {
      setupContainer();
      const renderer = new SsrWidgetRenderer();
      const widget = new FormWidget(
        'form',
        'submit_form',
        'Test Form',
        [
          {
            name: 'username',
            label: 'Username',
            type: 'input',
            required: true,
          },
        ],
        [
          { type: 'submit', label: 'Submit' },
          { type: 'cancel', label: 'Cancel' },
        ]
      );
      container.innerHTML = renderer.renderWidget(widget);

      let actionCalled = false;

      const handler = {
        handle: async (action: string, payload: any) => {
          actionCalled = true;
        },
      };

      const manager = new WidgetEventManager(handler);
      manager.attachHandlers(container);

      // Click cancel without filling in fields
      const cancelButton = container.querySelector('.bbq-form-cancel') as HTMLButtonElement;
      cancelButton?.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Cancel should work even when form is invalid
      expect(actionCalled).toBe(true);
    });

    it('should validate required checkbox fields', async () => {
      setupContainer();
      const renderer = new SsrWidgetRenderer();
      const widget = new FormWidget(
        'form',
        'submit_form',
        'Test Form',
        [
          {
            name: 'accept_terms',
            label: 'Accept Terms',
            type: 'checkbox',
            required: true,
          },
        ],
        [{ type: 'submit', label: 'Submit' }]
      );
      container.innerHTML = renderer.renderWidget(widget);

      let actionCalled = false;

      const handler = {
        handle: async (action: string, payload: any) => {
          actionCalled = true;
        },
      };

      const manager = new WidgetEventManager(handler);
      manager.attachHandlers(container);

      // Try to submit without checking the checkbox
      const submitButton = container.querySelector('.bbq-form-submit') as HTMLButtonElement;
      submitButton?.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should not submit when checkbox is unchecked
      expect(actionCalled).toBe(false);

      // Check the checkbox
      const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Now submit should work
      submitButton?.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(actionCalled).toBe(true);
    });

    it('should validate required file upload fields', async () => {
      setupContainer();
      const renderer = new SsrWidgetRenderer();
      const widget = new FormWidget(
        'form',
        'submit_form',
        'Test Form',
        [
          {
            name: 'document',
            label: 'Upload Document',
            type: 'fileupload',
            required: true,
          },
        ],
        [{ type: 'submit', label: 'Submit' }]
      );
      container.innerHTML = renderer.renderWidget(widget);

      let actionCalled = false;

      const handler = {
        handle: async (action: string, payload: any) => {
          actionCalled = true;
        },
      };

      const manager = new WidgetEventManager(handler);
      manager.attachHandlers(container);

      // Try to submit without selecting a file
      const submitButton = container.querySelector('.bbq-form-submit') as HTMLButtonElement;
      submitButton?.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should not submit when no file is selected
      expect(actionCalled).toBe(false);

      // Mock file selection by directly setting the files property
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      // Create a mock FileList
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Now submit should work
      submitButton?.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(actionCalled).toBe(true);
    });

    it('should validate required multiselect fields', async () => {
      setupContainer();
      const renderer = new SsrWidgetRenderer();
      const widget = new FormWidget(
        'form',
        'submit_form',
        'Test Form',
        [
          {
            name: 'tags',
            label: 'Select Tags',
            type: 'multiselect',
            required: true,
            options: ['Tag1', 'Tag2', 'Tag3'],
          },
        ],
        [{ type: 'submit', label: 'Submit' }]
      );
      container.innerHTML = renderer.renderWidget(widget);

      let actionCalled = false;

      const handler = {
        handle: async (action: string, payload: any) => {
          actionCalled = true;
        },
      };

      const manager = new WidgetEventManager(handler);
      manager.attachHandlers(container);

      // Try to submit without selecting any options
      const submitButton = container.querySelector('.bbq-form-submit') as HTMLButtonElement;
      submitButton?.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should not submit when no options are selected
      expect(actionCalled).toBe(false);

      // Select at least one option
      const multiselect = container.querySelector('select[multiple]') as HTMLSelectElement;
      multiselect.options[0].selected = true;
      multiselect.dispatchEvent(new Event('change', { bubbles: true }));

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Now submit should work
      submitButton?.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(actionCalled).toBe(true);
    });

    it('should update slider value display in real-time', async () => {
      setupContainer();
      const renderer = new SsrWidgetRenderer();
      const widget = new FormWidget(
        'form',
        'submit_form',
        'Test Form',
        [
          {
            name: 'rating',
            label: 'Rating',
            type: 'slider',
            required: false,
            min: 1,
            max: 5,
            step: 1,
            default: 3,
          },
        ],
        [{ type: 'submit', label: 'Submit' }]
      );
      container.innerHTML = renderer.renderWidget(widget);

      const manager = new WidgetEventManager({
        handle: async () => {},
      });
      manager.attachHandlers(container);

      const slider = container.querySelector('input[type="range"]') as HTMLInputElement;
      const valueSpan = container.querySelector('.bbq-form-slider-value');

      // Initial value should be 3
      expect(valueSpan?.textContent).toBe('3');

      // Change slider value
      slider.value = '5';
      slider.dispatchEvent(new Event('input', { bubbles: true }));

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Value display should update
      expect(valueSpan?.textContent).toBe('5');
    });
  });
});
