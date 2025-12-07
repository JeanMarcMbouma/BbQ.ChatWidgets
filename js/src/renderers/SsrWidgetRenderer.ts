import { ChatWidget } from '../models/ChatWidget';

/**
 * Interface for widget renderers
 */
export interface IWidgetRenderer {
  /**
   * Framework name (e.g., "SSR", "React", "Vue")
   */
  framework: string;

  /**
   * Render a widget to HTML string
   */
  renderWidget(widget: ChatWidget): string;
}

/**
 * Server-side rendering (SSR) widget renderer
 * Generates framework-agnostic HTML suitable for hydration
 */
export class SsrWidgetRenderer implements IWidgetRenderer {
  readonly framework = 'SSR';

  renderWidget(widget: ChatWidget): string {
    switch (widget.type) {
      case 'button':
        return this.renderButton(widget as any);
      case 'card':
        return this.renderCard(widget as any);
      case 'input':
        return this.renderInput(widget as any);
      case 'dropdown':
        return this.renderDropdown(widget as any);
      case 'slider':
        return this.renderSlider(widget as any);
      case 'toggle':
        return this.renderToggle(widget as any);
      case 'fileupload':
        return this.renderFileUpload(widget as any);
      case 'themeswitcher':
        return this.renderThemeSwitcher(widget as any);
      case 'datepicker':
        return this.renderDatePicker(widget as any);
      case 'multiselect':
        return this.renderMultiSelect(widget as any);
      case 'progressbar':
        return this.renderProgressBar(widget as any);
      default:
        return this.renderUnsupported(widget);
    }
  }

  private renderButton(widget: any): string {
    const action = this.escape(widget.action);
    const label = this.escape(widget.label);
    const id = this.generateId(widget.action);

    return `<button class="bbq-widget bbq-button" data-widget-id="${id}" data-widget-type="button" data-action="${action}" type="button">${label}</button>`;
  }

  private renderCard(widget: any): string {
    const action = this.escape(widget.action);
    const title = this.escape(widget.title);
    const label = this.escape(widget.label);
    const id = this.generateId(widget.action);

    let html = `<div class="bbq-widget bbq-card" data-widget-id="${id}" data-widget-type="card" data-action="${action}" role="article">`;
    html += `<h3 class="bbq-card-title">${title}</h3>`;

    if (widget.description) {
      const description = this.escape(widget.description);
      html += `<p class="bbq-card-description">${description}</p>`;
    }

    if (widget.imageUrl) {
      const imageUrl = this.escape(widget.imageUrl);
      const imageAlt = this.escape(widget.title);
      html += `<img class="bbq-card-image" src="${imageUrl}" alt="${imageAlt}" loading="lazy" />`;
    }

    html += `<button class="bbq-card-action bbq-button" data-action="${action}" type="button">${label}</button></div>`;

    return html;
  }

  private renderInput(widget: any): string {
    const label = this.escape(widget.label);
    const action = this.escape(widget.action);
    const id = this.generateId(widget.action);
    const inputId = `${id}-input`;

    let html = `<div class="bbq-widget bbq-input" data-widget-id="${id}" data-widget-type="input">`;
    html += `<label class="bbq-input-label" for="${inputId}">${label}</label>`;

    const placeholder = widget.placeholder ? ` placeholder="${this.escape(widget.placeholder)}"` : '';
    const maxLength = widget.maxLength ? ` maxlength="${widget.maxLength}"` : '';

    html += `<input type="text" id="${inputId}" class="bbq-input-field" data-action="${action}"${placeholder}${maxLength} aria-labelledby="${inputId}" />`;
    html += '</div>';

    return html;
  }

  private renderDropdown(widget: any): string {
    const label = this.escape(widget.label);
    const action = this.escape(widget.action);
    const id = this.generateId(widget.action);
    const selectId = `${id}-select`;

    let html = `<div class="bbq-widget bbq-dropdown" data-widget-id="${id}" data-widget-type="dropdown">`;
    html += `<label class="bbq-dropdown-label" for="${selectId}">${label}</label>`;
    html += `<select id="${selectId}" class="bbq-dropdown-select" data-action="${action}" aria-labelledby="${selectId}">`;

    for (const option of widget.options) {
      const escapedOption = this.escape(option);
      html += `<option value="${escapedOption}">${escapedOption}</option>`;
    }

    html += '</select></div>';

    return html;
  }

  private renderSlider(widget: any): string {
    const label = this.escape(widget.label);
    const action = this.escape(widget.action);
    const id = this.generateId(widget.action);
    const sliderId = `${id}-slider`;

    let html = `<div class="bbq-widget bbq-slider" data-widget-id="${id}" data-widget-type="slider">`;
    html += `<label class="bbq-slider-label" for="${sliderId}">${label}</label>`;

    const defaultValue = widget.default ?? widget.min;

    html += `<input type="range" id="${sliderId}" class="bbq-slider-input" min="${widget.min}" max="${widget.max}" step="${widget.step}" value="${defaultValue}" data-action="${action}" aria-label="${label}" />`;
    html += `<span class="bbq-slider-value" aria-live="polite">${defaultValue}</span>`;
    html += '</div>';

    return html;
  }

  private renderToggle(widget: any): string {
    const label = this.escape(widget.label);
    const action = this.escape(widget.action);
    const id = this.generateId(widget.action);
    const checkboxId = `${id}-checkbox`;
    const checked = widget.defaultValue ? ' checked' : '';

    let html = `<div class="bbq-widget bbq-toggle" data-widget-id="${id}" data-widget-type="toggle">`;
    html += `<label class="bbq-toggle-label" for="${checkboxId}">`;
    html += `<input type="checkbox" id="${checkboxId}" class="bbq-toggle-input" data-action="${action}"${checked} aria-label="${label}" />`;
    html += `<span class="bbq-toggle-text">${label}</span>`;
    html += '</label></div>';

    return html;
  }

  private renderFileUpload(widget: any): string {
    const label = this.escape(widget.label);
    const action = this.escape(widget.action);
    const id = this.generateId(widget.action);
    const inputId = `${id}-file`;

    let html = `<div class="bbq-widget bbq-file-upload" data-widget-id="${id}" data-widget-type="fileupload">`;
    html += `<label class="bbq-file-label" for="${inputId}">${label}</label>`;

    const accept = widget.accept ? ` accept="${this.escape(widget.accept)}"` : '';
    const maxBytes = widget.maxBytes ? ` data-max-bytes="${widget.maxBytes}"` : '';

    html += `<input type="file" id="${inputId}" class="bbq-file-input" data-action="${action}"${accept}${maxBytes} aria-labelledby="${inputId}" />`;
    html += '</div>';

    return html;
  }

  private renderThemeSwitcher(widget: any): string {
    const label = this.escape(widget.label);
    const action = this.escape(widget.action);
    const id = this.generateId(widget.action);
    const selectId = `${id}-select`;

    let html = `<div class="bbq-widget bbq-theme-switcher" data-widget-id="${id}" data-widget-type="themeswitcher">`;
    html += `<label class="bbq-theme-switcher-label" for="${selectId}">${label}</label>`;
    html += `<select id="${selectId}" class="bbq-theme-switcher-select" data-action="${action}" aria-labelledby="${selectId}">`;

    for (const theme of widget.themes) {
      const escapedTheme = this.escape(theme);
      html += `<option value="${escapedTheme}">${escapedTheme}</option>`;
    }

    html += '</select></div>';

    return html;
  }

  private renderDatePicker(widget: any): string {
    const label = this.escape(widget.label);
    const action = this.escape(widget.action);
    const id = this.generateId(widget.action);
    const inputId = `${id}-date`;

    let html = `<div class="bbq-widget bbq-date-picker" data-widget-id="${id}" data-widget-type="datepicker">`;
    html += `<label class="bbq-date-picker-label" for="${inputId}">${label}</label>`;

    const minDate = widget.minDate ? ` min="${this.escape(widget.minDate)}"` : '';
    const maxDate = widget.maxDate ? ` max="${this.escape(widget.maxDate)}"` : '';

    html += `<input type="date" id="${inputId}" class="bbq-date-picker-input" data-action="${action}"${minDate}${maxDate} aria-labelledby="${inputId}" />`;
    html += '</div>';

    return html;
  }

  private renderMultiSelect(widget: any): string {
    const label = this.escape(widget.label);
    const action = this.escape(widget.action);
    const id = this.generateId(widget.action);
    const selectId = `${id}-select`;

    let html = `<div class="bbq-widget bbq-multi-select" data-widget-id="${id}" data-widget-type="multiselect">`;
    html += `<label class="bbq-multi-select-label" for="${selectId}">${label}</label>`;
    html += `<select id="${selectId}" class="bbq-multi-select-select" data-action="${action}" multiple aria-labelledby="${selectId}">`;

    for (const option of widget.options) {
      const escapedOption = this.escape(option);
      html += `<option value="${escapedOption}">${escapedOption}</option>`;
    }

    html += '</select></div>';

    return html;
  }

  private renderProgressBar(widget: any): string {
    const label = this.escape(widget.label);
    const action = this.escape(widget.action);
    const id = this.generateId(widget.action);
    const percentage = widget.max > 0 ? Math.floor((widget.value * 100) / widget.max) : 0;

    let html = `<div class="bbq-widget bbq-progress-bar" data-widget-id="${id}" data-widget-type="progressbar">`;
    html += `<label class="bbq-progress-bar-label" for="${id}-progress">${label}</label>`;
    html += `<progress id="${id}-progress" class="bbq-progress-bar-element" value="${widget.value}" max="${widget.max}" data-action="${action}" aria-label="${label}" aria-valuenow="${widget.value}" aria-valuemin="0" aria-valuemax="${widget.max}">${percentage}%</progress>`;
    html += `<span class="bbq-progress-bar-value" aria-live="polite">${percentage}%</span>`;
    html += '</div>';

    return html;
  }

  private renderUnsupported(widget: ChatWidget): string {
    const type = this.escape(widget.type);
    return `<div class="bbq-widget bbq-unsupported" role="alert">Unsupported widget type: ${type}</div>`;
  }

  /**
   * Escape HTML content to prevent XSS attacks
   */
  private escape(value: string | undefined): string {
    if (!value) return '';
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return value.replace(/[&<>"']/g, (char) => map[char]);
  }

  /**
   * Generate unique ID from action string
   */
  private generateId(action: string): string {
    return `bbq-${this.escape(action).replace(/\s+/g, '-').toLowerCase()}`;
  }
}
