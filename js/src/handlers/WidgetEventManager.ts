/**
 * Interface for handling widget actions
 */
export interface IWidgetActionHandler {
  /**
   * Handle a widget action
   * @param action - The action identifier
   * @param payload - The action payload
   */
  handle(action: string, payload: any): Promise<void>;
}

/**
 * Default widget action handler using fetch API
 */
export class DefaultWidgetActionHandler implements IWidgetActionHandler {
  constructor(private apiUrl: string = '/api/chat/action') {}

  async handle(action: string, payload: any): Promise<void> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          payload,
        }),
      });

      if (!response.ok) {
        console.error(`Action ${action} failed:`, response.statusText);
      }
    } catch (error) {
      console.error(`Error handling action ${action}:`, error);
    }
  }
}

/**
 * Widget event manager for automatic action dispatch
 */
export class WidgetEventManager {
  constructor(
    private actionHandler: IWidgetActionHandler = new DefaultWidgetActionHandler()
  ) {}

  /**
   * Attach event listeners to widgets in a container
   */
  attachHandlers(container: Element): void {
    this.attachButtonHandlers(container);
    this.attachInputHandlers(container);
    this.attachDropdownHandlers(container);
    this.attachSliderHandlers(container);
    this.attachToggleHandlers(container);
    this.attachFileUploadHandlers(container);
    this.attachMultiSelectHandlers(container);
    this.attachCardHandlers(container);
    this.attachThemeSwitcherHandlers(container);
    this.attachDatePickerHandlers(container);
  }

  private attachButtonHandlers(container: Element): void {
    container.querySelectorAll('[data-widget-type="button"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        if (action) this.actionHandler.handle(action, {});
      });
    });
  }

  private attachInputHandlers(container: Element): void {
    container.querySelectorAll('[data-widget-type="input"] input[type="text"]').forEach((input) => {
      (input as HTMLInputElement).addEventListener('change', (e: Event) => {
        const action = (e.target as HTMLInputElement).getAttribute('data-action');
        const value = (e.target as HTMLInputElement).value;
        if (action) this.actionHandler.handle(action, { value });
      });
    });
  }

  private attachDropdownHandlers(container: Element): void {
    container.querySelectorAll('[data-widget-type="dropdown"] select').forEach((select) => {
      (select as HTMLSelectElement).addEventListener('change', (e: Event) => {
        const action = (e.target as HTMLSelectElement).getAttribute('data-action');
        const value = (e.target as HTMLSelectElement).value;
        if (action) this.actionHandler.handle(action, { value });
      });
    });
  }

  private attachSliderHandlers(container: Element): void {
    container
      .querySelectorAll('[data-widget-type="slider"] input[type="range"]')
      .forEach((slider) => {
        (slider as HTMLInputElement).addEventListener('change', (e: Event) => {
          const action = (e.target as HTMLInputElement).getAttribute('data-action');
          const value = parseInt((e.target as HTMLInputElement).value, 10);

          // Update display value
          const valueSpan = (e.target as HTMLInputElement)
            .parentElement?.querySelector('.bbq-slider-value');
          if (valueSpan) valueSpan.textContent = value.toString();

          if (action) this.actionHandler.handle(action, { value });
        });

        // Real-time value display
        (slider as HTMLInputElement).addEventListener('input', (e: Event) => {
          const valueSpan = (e.target as HTMLInputElement)
            .parentElement?.querySelector('.bbq-slider-value');
          if (valueSpan) valueSpan.textContent = (e.target as HTMLInputElement).value;
        });
      });
  }

  private attachToggleHandlers(container: Element): void {
    container
      .querySelectorAll('[data-widget-type="toggle"] input[type="checkbox"]')
      .forEach((toggle) => {
        (toggle as HTMLInputElement).addEventListener('change', (e: Event) => {
          const action = (e.target as HTMLInputElement).getAttribute('data-action');
          const checked = (e.target as HTMLInputElement).checked;
          if (action) this.actionHandler.handle(action, { checked });
        });
      });
  }

  private attachFileUploadHandlers(container: Element): void {
    container
      .querySelectorAll('[data-widget-type="fileupload"] input[type="file"]')
      .forEach((fileInput) => {
        (fileInput as HTMLInputElement).addEventListener('change', (e: Event) => {
          const action = (e.target as HTMLInputElement).getAttribute('data-action');
          const files = (e.target as HTMLInputElement).files;
          if (action && files) {
            const fileInfo = Array.from(files).map((f) => ({
              name: f.name,
              size: f.size,
              type: f.type,
            }));
            this.actionHandler.handle(action, { files: fileInfo });
          }
        });
      });
  }

  private attachMultiSelectHandlers(container: Element): void {
    container.querySelectorAll('[data-widget-type="multiselect"] select').forEach((select) => {
      (select as HTMLSelectElement).addEventListener('change', (e: Event) => {
        const action = (e.target as HTMLSelectElement).getAttribute('data-action');
        const selected = Array.from((e.target as HTMLSelectElement).selectedOptions).map(
          (o) => o.value
        );
        if (action) this.actionHandler.handle(action, { items: selected });
      });
    });
  }

  private attachCardHandlers(container: Element): void {
    container.querySelectorAll('[data-widget-type="card"] button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        if (action) this.actionHandler.handle(action, {});
      });
    });
  }

  private attachThemeSwitcherHandlers(container: Element): void {
    container
      .querySelectorAll('[data-widget-type="themeswitcher"] select')
      .forEach((select) => {
        (select as HTMLSelectElement).addEventListener('change', (e: Event) => {
          const action = (e.target as HTMLSelectElement).getAttribute('data-action');
          const theme = (e.target as HTMLSelectElement).value;
          if (action) this.actionHandler.handle(action, { theme });
        });
      });
  }

  private attachDatePickerHandlers(container: Element): void {
    container
      .querySelectorAll('[data-widget-type="datepicker"] input[type="date"]')
      .forEach((input) => {
        (input as HTMLInputElement).addEventListener('change', (e: Event) => {
          const action = (e.target as HTMLInputElement).getAttribute('data-action');
          const date = (e.target as HTMLInputElement).value;
          if (action) this.actionHandler.handle(action, { date });
        });
      });
  }
}
