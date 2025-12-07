/**
 * ChatWidget Type Discriminator
 * Used to identify widget types in JSON serialization
 */
/**
 * ChatWidget Type Discriminator
 * Can be any string - built-in types are documented but custom types are supported at runtime
 */
export type ChatWidgetType = string;

import { customWidgetRegistry } from './CustomWidgetRegistry';

/**
 * Base class for all chat widgets
 */
export abstract class ChatWidget {
  readonly type: ChatWidgetType;
  readonly label: string;
  readonly action: string;

  constructor(type: ChatWidgetType, label: string, action: string) {
    this.type = type;
    this.label = label;
    this.action = action;
  }

  /**
   * Deserialize a widget from JSON string
   */
  static fromJson(json: string): ChatWidget | null {
    try {
      const data = JSON.parse(json);
      return ChatWidget.fromObject(data);
    } catch {
      return null;
    }
  }

  /**
   * Deserialize a widget from plain object
   */
  static fromObject(obj: any): ChatWidget | null {
    if (!obj.type) return null;

    // Try runtime-registered custom widgets first
    const factory = customWidgetRegistry.getFactory(obj.type);
    if (factory) return factory(obj);

    switch (obj.type) {
      case 'button':
        return new ButtonWidget(obj.label, obj.action);
      case 'card':
        return new CardWidget(
          obj.label,
          obj.action,
          obj.title,
          obj.description,
          obj.imageUrl
        );
      case 'input':
        return new InputWidget(obj.label, obj.action, obj.placeholder, obj.maxLength);
      case 'dropdown':
        return new DropdownWidget(obj.label, obj.action, obj.options || []);
      case 'slider':
        return new SliderWidget(
          obj.label,
          obj.action,
          obj.min,
          obj.max,
          obj.step,
          obj.default
        );
      case 'toggle':
        return new ToggleWidget(obj.label, obj.action, obj.defaultValue ?? false);
      case 'fileupload':
        return new FileUploadWidget(obj.label, obj.action, obj.accept, obj.maxBytes);
      case 'themeswitcher':
        return new ThemeSwitcherWidget(obj.label, obj.action, obj.themes || []);
      case 'datepicker':
        return new DatePickerWidget(obj.label, obj.action, obj.minDate, obj.maxDate);
      case 'multiselect':
        return new MultiSelectWidget(obj.label, obj.action, obj.options || []);
      case 'progressbar':
        return new ProgressBarWidget(obj.label, obj.action, obj.value, obj.max);
      default:
        return null;
    }
  }

  /**
   * Deserialize a list of widgets from JSON string
   */
  static listFromJson(json: string): ChatWidget[] | null {
    try {
      const data = JSON.parse(json);
      if (!Array.isArray(data)) return null;
      return data
        .map((item) => ChatWidget.fromObject(item))
        .filter((w): w is ChatWidget => w !== null);
    } catch {
      return null;
    }
  }

  /**
   * Serialize widget to JSON string
   */
  toJson(): string {
    return JSON.stringify(this.toObject());
  }

  /**
   * Serialize widget to plain object
   */
  abstract toObject(): Record<string, any>;
}

/**
 * Button widget - triggers an action on click
 */
export class ButtonWidget extends ChatWidget {
  constructor(label: string, action: string) {
    super('button', label, action);
  }

  toObject() {
    return {
      type: this.type,
      label: this.label,
      action: this.action,
    };
  }
}

/**
 * Card widget - displays rich content
 */
export class CardWidget extends ChatWidget {
  constructor(
    label: string,
    action: string,
    readonly title: string,
    readonly description?: string,
    readonly imageUrl?: string
  ) {
    super('card', label, action);
  }

  toObject() {
    return {
      type: this.type,
      label: this.label,
      action: this.action,
      title: this.title,
      description: this.description,
      imageUrl: this.imageUrl,
    };
  }
}

/**
 * Input widget - text input field
 */
export class InputWidget extends ChatWidget {
  constructor(
    label: string,
    action: string,
    readonly placeholder?: string,
    readonly maxLength?: number
  ) {
    super('input', label, action);
  }

  toObject() {
    return {
      type: this.type,
      label: this.label,
      action: this.action,
      placeholder: this.placeholder,
      maxLength: this.maxLength,
    };
  }
}

/**
 * Dropdown widget - single select from options
 */
export class DropdownWidget extends ChatWidget {
  constructor(label: string, action: string, readonly options: string[]) {
    super('dropdown', label, action);
  }

  toObject() {
    return {
      type: this.type,
      label: this.label,
      action: this.action,
      options: this.options,
    };
  }
}

/**
 * Slider widget - numeric range selection
 */
export class SliderWidget extends ChatWidget {
  constructor(
    label: string,
    action: string,
    readonly min: number,
    readonly max: number,
    readonly step: number,
    readonly default?: number
  ) {
    super('slider', label, action);
  }

  toObject() {
    return {
      type: this.type,
      label: this.label,
      action: this.action,
      min: this.min,
      max: this.max,
      step: this.step,
      default: this.default,
    };
  }
}

/**
 * Toggle widget - boolean on/off switch
 */
export class ToggleWidget extends ChatWidget {
  constructor(label: string, action: string, readonly defaultValue: boolean = false) {
    super('toggle', label, action);
  }

  toObject() {
    return {
      type: this.type,
      label: this.label,
      action: this.action,
      defaultValue: this.defaultValue,
    };
  }
}

/**
 * File upload widget - file selection input
 */
export class FileUploadWidget extends ChatWidget {
  constructor(
    label: string,
    action: string,
    readonly accept?: string,
    readonly maxBytes?: number
  ) {
    super('fileupload', label, action);
  }

  toObject() {
    return {
      type: this.type,
      label: this.label,
      action: this.action,
      accept: this.accept,
      maxBytes: this.maxBytes,
    };
  }
}

/**
 * Theme switcher widget - theme selection
 */
export class ThemeSwitcherWidget extends ChatWidget {
  constructor(label: string, action: string, readonly themes: string[]) {
    super('themeswitcher', label, action);
  }

  toObject() {
    return {
      type: this.type,
      label: this.label,
      action: this.action,
      themes: this.themes,
    };
  }
}

/**
 * Date picker widget - date selection
 */
export class DatePickerWidget extends ChatWidget {
  constructor(
    label: string,
    action: string,
    readonly minDate?: string,
    readonly maxDate?: string
  ) {
    super('datepicker', label, action);
  }

  toObject() {
    return {
      type: this.type,
      label: this.label,
      action: this.action,
      minDate: this.minDate,
      maxDate: this.maxDate,
    };
  }
}

/**
 * Multi-select widget - select multiple options
 */
export class MultiSelectWidget extends ChatWidget {
  constructor(label: string, action: string, readonly options: string[]) {
    super('multiselect', label, action);
  }

  toObject() {
    return {
      type: this.type,
      label: this.label,
      action: this.action,
      options: this.options,
    };
  }
}

/**
 * Progress bar widget - display task progress
 */
export class ProgressBarWidget extends ChatWidget {
  constructor(label: string, action: string, readonly value: number, readonly max: number) {
    super('progressbar', label, action);
  }

  toObject() {
    return {
      type: this.type,
      label: this.label,
      action: this.action,
      value: this.value,
      max: this.max,
    };
  }
}
