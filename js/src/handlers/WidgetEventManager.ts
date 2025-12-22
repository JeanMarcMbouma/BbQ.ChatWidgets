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
    this.attachTextAreaHandlers(container);
    this.attachDropdownHandlers(container);
    this.attachSliderHandlers(container);
    this.attachToggleHandlers(container);
    this.attachFileUploadHandlers(container);
    this.attachMultiSelectHandlers(container);
    this.attachCardHandlers(container);
    this.attachThemeSwitcherHandlers(container);
    this.attachDatePickerHandlers(container);
    this.attachFormHandlers(container);
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

  private attachTextAreaHandlers(container: Element): void {
    container.querySelectorAll('[data-widget-type="textarea"] textarea').forEach((textarea) => {
      (textarea as HTMLTextAreaElement).addEventListener('change', (e: Event) => {
        const action = (e.target as HTMLTextAreaElement).getAttribute('data-action');
        const value = (e.target as HTMLTextAreaElement).value;
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

  private attachFormHandlers(container: Element): void {
    container.querySelectorAll('[data-widget-type="form"]').forEach((form) => {
      // Track validation state for the form
      const validationState = new Map<string, boolean>();
      let hasAttemptedSubmit = false;

      // Initialize validation state for all required fields
      const requiredFields = form.querySelectorAll('[data-required="true"]');
      requiredFields.forEach((fieldContainer) => {
        const input = fieldContainer.querySelector('input, select, textarea') as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        if (input) {
          const name = input.getAttribute('name');
          if (name) {
            // Initialize validation state based on default values
            validationState.set(name, this.isFieldValid(input));
          }
        }
      });

      // Attach change handlers to track validation state
      const inputs = form.querySelectorAll('input, select, textarea');
      inputs.forEach((input: Element) => {
        const field = input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        const name = field.getAttribute('name');
        const fieldContainer = field.closest('.bbq-form-field');

        if (!name || !fieldContainer) return;

        // Check if field is required
        const isRequired = fieldContainer.getAttribute('data-required') === 'true';

        const updateValidation = () => {
          if (isRequired) {
            const isValid = this.isFieldValid(field);
            validationState.set(name, isValid);

            // Update submit button state
            this.updateFormSubmitButton(form, validationState, hasAttemptedSubmit);
          }

          // Update slider value display if it's a slider
          if (field instanceof HTMLInputElement && field.type === 'range') {
            const valueSpan = fieldContainer.querySelector('.bbq-form-slider-value');
            if (valueSpan) {
              valueSpan.textContent = field.value;
            }
          }
        };

        // Attach appropriate event listeners
        if (field instanceof HTMLInputElement && field.type === 'range') {
          field.addEventListener('input', updateValidation);
        }
        field.addEventListener('change', updateValidation);
        field.addEventListener('blur', updateValidation);
      });

      // Attach click handlers to form buttons
      form.querySelectorAll('button[data-action]').forEach((button) => {
        button.addEventListener('click', (e: Event) => {
          e.preventDefault();
          const actionType = button.getAttribute('data-action-type');
          const action = button.getAttribute('data-action');
          if (!action) return;

          // If this is a submit action, validate the form
          if (actionType === 'submit') {
            hasAttemptedSubmit = true;

            // Check if form is valid
            if (!this.isFormValid(validationState)) {
              // Show validation message
              const validationMsg = form.querySelector('.bbq-form-validation-message') as HTMLElement;
              if (validationMsg) {
                validationMsg.style.display = 'block';
              }

              // Update submit button state
              this.updateFormSubmitButton(form, validationState, hasAttemptedSubmit);
              return; // Don't submit if invalid
            }

            // Hide validation message if it was shown
            const validationMsg = form.querySelector('.bbq-form-validation-message') as HTMLElement;
            if (validationMsg) {
              validationMsg.style.display = 'none';
            }
          }

          // Collect form data
          const payload: Record<string, any> = {};

          // Iterate over all previously collected form inputs
          inputs.forEach((input: Element) => {
            const field = input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
            const name = field.getAttribute('name');

            if (!name) return;

            // Handle different input types
            if (field instanceof HTMLInputElement) {
              if (field.type === 'checkbox') {
                payload[name] = field.checked;
              } else if (field.type === 'radio') {
                if (field.checked) {
                  payload[name] = field.value;
                }
              } else if (field.type === 'file') {
                payload[name] = field.files ? Array.from(field.files).map((f) => ({
                  name: f.name,
                  size: f.size,
                  type: f.type,
                })) : [];
              } else {
                payload[name] = field.value;
              }
            } else if (field instanceof HTMLSelectElement) {
              if (field.multiple) {
                payload[name] = Array.from(field.selectedOptions).map((o) => o.value);
              } else {
                payload[name] = field.value;
              }
            } else if (field instanceof HTMLTextAreaElement) {
              payload[name] = field.value;
            }
          });

          this.actionHandler.handle(action, payload);
        });
      });
    });
  }

  /**
   * Check if a field value is valid (not empty for required fields)
   */
  private isFieldValid(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): boolean {
    // For text inputs and textareas, check if value is not empty
    if (field instanceof HTMLInputElement) {
      if (field.type === 'checkbox' || field.type === 'radio') {
        // Checkboxes and radios are valid if checked
        return field.checked;
      } else if (field.type === 'file') {
        // File inputs are valid if at least one file is selected
        return field.files !== null && field.files.length > 0;
      } else if (field.type === 'range') {
        // Range inputs always have a value, so they're always valid
        return true;
      } else {
        // Text, email, number, date, etc. - check for non-empty value
        return field.value.trim() !== '';
      }
    } else if (field instanceof HTMLSelectElement) {
      // Selects are valid if a value is selected (not the placeholder option)
      if (field.multiple) {
        return field.selectedOptions.length > 0;
      } else {
        return field.value !== '';
      }
    } else if (field instanceof HTMLTextAreaElement) {
      // Textareas are valid if they have non-empty content
      return field.value.trim() !== '';
    }
    return false;
  }

  /**
   * Check if all required fields in the form are valid
   */
  private isFormValid(validationState: Map<string, boolean>): boolean {
    if (validationState.size === 0) {
      return true; // No required fields
    }

    // Check if all required fields are valid
    for (const [, isValid] of validationState) {
      if (!isValid) {
        return false;
      }
    }
    return true;
  }

  /**
   * Update the submit button state based on validation
   */
  private updateFormSubmitButton(
    form: Element,
    validationState: Map<string, boolean>,
    hasAttemptedSubmit: boolean
  ): void {
    const submitButton = form.querySelector('.bbq-form-submit') as HTMLButtonElement;
    if (!submitButton) return;

    const isValid = this.isFormValid(validationState);

    // Disable the submit button if validation has been attempted and form is invalid
    if (hasAttemptedSubmit && !isValid) {
      submitButton.disabled = true;
    } else {
      submitButton.disabled = false;
    }
  }
}
