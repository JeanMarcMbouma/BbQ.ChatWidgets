import { describe, it, expect } from 'vitest';
import { SsrWidgetRenderer } from './SsrWidgetRenderer';
import {
  ButtonWidget,
  CardWidget,
  InputWidget,
  DropdownWidget,
  SliderWidget,
  ToggleWidget,
  FileUploadWidget,
  ThemeSwitcherWidget,
  DatePickerWidget,
  MultiSelectWidget,
  ProgressBarWidget,
  FormWidget,
} from '../models/ChatWidget';

describe('SsrWidgetRenderer', () => {
  const renderer = new SsrWidgetRenderer();

  describe('Button rendering', () => {
    it('should render button widget', () => {
      const widget = new ButtonWidget('Click Me', 'submit');
      const html = renderer.renderWidget(widget);

      expect(html).toContain('class="bbq-widget bbq-button"');
      expect(html).toContain('data-widget-type="button"');
      expect(html).toContain('data-action="submit"');
      expect(html).toContain('Click Me');
    });
  });

  describe('Card rendering', () => {
    it('should render card with all properties', () => {
      const widget = new CardWidget(
        'View',
        'view',
        'Title',
        'Description',
        'https://example.com/image.jpg'
      );
      const html = renderer.renderWidget(widget);

      expect(html).toContain('bbq-card');
      expect(html).toContain('Title');
      expect(html).toContain('Description');
      expect(html).toContain('https://example.com/image.jpg');
    });
  });

  describe('Input rendering', () => {
    it('should render input with optional attributes', () => {
      const widget = new InputWidget('Name', 'input_name', 'Enter name', 50);
      const html = renderer.renderWidget(widget);

      expect(html).toContain('bbq-input');
      expect(html).toContain('placeholder="Enter name"');
      expect(html).toContain('maxlength="50"');
    });
  });

  describe('Dropdown rendering', () => {
    it('should render dropdown with options', () => {
      const widget = new DropdownWidget('Select', 'select', ['A', 'B', 'C']);
      const html = renderer.renderWidget(widget);

      expect(html).toContain('bbq-dropdown');
      expect(html).toContain('<option value="A">A</option>');
      expect(html).toContain('<option value="B">B</option>');
      expect(html).toContain('<option value="C">C</option>');
    });
  });

  describe('Slider rendering', () => {
    it('should render slider with range', () => {
      const widget = new SliderWidget('Volume', 'volume', 0, 100, 5, 50);
      const html = renderer.renderWidget(widget);

      expect(html).toContain('bbq-slider');
      expect(html).toContain('type="range"');
      expect(html).toContain('min="0"');
      expect(html).toContain('max="100"');
      expect(html).toContain('step="5"');
    });
  });

  describe('Toggle rendering', () => {
    it('should render toggle checked when defaultValue is true', () => {
      const widget = new ToggleWidget('Enable', 'enable', true);
      const html = renderer.renderWidget(widget);

      expect(html).toContain('bbq-toggle');
      expect(html).toContain('type="checkbox"');
      expect(html).toContain('checked');
    });

    it('should render toggle unchecked when defaultValue is false', () => {
      const widget = new ToggleWidget('Disable', 'disable', false);
      const html = renderer.renderWidget(widget);

      expect(html).toContain('bbq-toggle');
      expect(html).not.toContain(' checked');
    });
  });

  describe('File upload rendering', () => {
    it('should render file upload with restrictions', () => {
      const widget = new FileUploadWidget('Upload', 'upload', '.pdf,.docx', 5000000);
      const html = renderer.renderWidget(widget);

      expect(html).toContain('bbq-file-upload');
      expect(html).toContain('type="file"');
      expect(html).toContain('accept=".pdf,.docx"');
      expect(html).toContain('data-max-bytes="5000000"');
    });
  });

  describe('Theme switcher rendering', () => {
    it('should render theme switcher with themes', () => {
      const widget = new ThemeSwitcherWidget('Theme', 'theme', ['light', 'dark', 'auto']);
      const html = renderer.renderWidget(widget);

      expect(html).toContain('bbq-theme-switcher');
      expect(html).toContain('<option value="light">light</option>');
      expect(html).toContain('<option value="dark">dark</option>');
      expect(html).toContain('<option value="auto">auto</option>');
    });
  });

  describe('Date picker rendering', () => {
    it('should render date picker with constraints', () => {
      const widget = new DatePickerWidget(
        'Date',
        'date',
        '2024-01-01',
        '2024-12-31'
      );
      const html = renderer.renderWidget(widget);

      expect(html).toContain('bbq-date-picker');
      expect(html).toContain('type="date"');
      expect(html).toContain('min="2024-01-01"');
      expect(html).toContain('max="2024-12-31"');
    });
  });

  describe('Multi-select rendering', () => {
    it('should render multi-select with multiple attribute', () => {
      const widget = new MultiSelectWidget('Items', 'items', ['A', 'B', 'C']);
      const html = renderer.renderWidget(widget);

      expect(html).toContain('bbq-multi-select');
      expect(html).toContain('multiple');
    });
  });

  describe('Progress bar rendering', () => {
    it('should render progress bar with percentage', () => {
      const widget = new ProgressBarWidget('Progress', 'progress', 75, 100);
      const html = renderer.renderWidget(widget);

      expect(html).toContain('bbq-progress-bar');
      expect(html).toContain('<progress');
      expect(html).toContain('value="75"');
      expect(html).toContain('max="100"');
      expect(html).toContain('75%');
    });
  });

  describe('XSS Prevention', () => {
    it('should escape HTML in labels', () => {
      const widget = new ButtonWidget('<script>alert("xss")</script>', 'action');
      const html = renderer.renderWidget(widget);

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should escape HTML in action attributes', () => {
      const widget = new ButtonWidget('Button', 'action&param');
      const html = renderer.renderWidget(widget);

      expect(html).toContain('action&amp;param');
    });
  });

  describe('Framework property', () => {
    it('should return SSR as framework name', () => {
      expect(renderer.framework).toBe('SSR');
    });
  });

  describe('Form rendering', () => {
    it('should render form with fields and actions', () => {
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
            validationHint: 'Enter your username',
          },
          {
            name: 'email',
            label: 'Email',
            type: 'input',
            required: true,
            validationHint: 'Enter a valid email',
          },
          {
            name: 'bio',
            label: 'Bio',
            type: 'textarea',
            required: false,
          },
        ],
        [
          { type: 'submit', label: 'Submit' },
          { type: 'cancel', label: 'Cancel' },
        ]
      );
      const html = renderer.renderWidget(widget);

      expect(html).toContain('bbq-form');
      expect(html).toContain('data-widget-type="form"');
      expect(html).toContain('Test Form');
      expect(html).toContain('Username');
      expect(html).toContain('Email');
      expect(html).toContain('Bio');
      expect(html).toContain('Submit');
      expect(html).toContain('Cancel');
    });

    it('should mark required fields with asterisk', () => {
      const widget = new FormWidget(
        'form',
        'submit_form',
        'Form',
        [
          {
            name: 'required_field',
            label: 'Required Field',
            type: 'input',
            required: true,
          },
          {
            name: 'optional_field',
            label: 'Optional Field',
            type: 'input',
            required: false,
          },
        ],
        [{ type: 'submit', label: 'Submit' }]
      );
      const html = renderer.renderWidget(widget);

      // Check for required indicator
      expect(html).toContain('bbq-form-required');
      expect(html).toContain('*');
      expect(html).toContain('data-required="true"');
    });

    it('should include validation hints when provided', () => {
      const widget = new FormWidget(
        'form',
        'submit_form',
        'Form',
        [
          {
            name: 'field',
            label: 'Field',
            type: 'input',
            required: true,
            validationHint: 'This is a validation hint',
          },
        ],
        [{ type: 'submit', label: 'Submit' }]
      );
      const html = renderer.renderWidget(widget);

      expect(html).toContain('bbq-form-field-hint');
      expect(html).toContain('This is a validation hint');
    });

    it('should render validation message container', () => {
      const widget = new FormWidget(
        'form',
        'submit_form',
        'Form',
        [
          {
            name: 'field',
            label: 'Field',
            type: 'input',
            required: true,
          },
        ],
        [{ type: 'submit', label: 'Submit' }]
      );
      const html = renderer.renderWidget(widget);

      expect(html).toContain('bbq-form-validation-message');
      expect(html).toContain('Please fill in all required fields before submitting');
    });

    it('should render different field types correctly', () => {
      const widget = new FormWidget(
        'form',
        'submit_form',
        'Form',
        [
          {
            name: 'text',
            label: 'Text',
            type: 'input',
            required: true,
          },
          {
            name: 'dropdown',
            label: 'Dropdown',
            type: 'dropdown',
            required: true,
            options: ['Option 1', 'Option 2'],
          },
          {
            name: 'slider',
            label: 'Slider',
            type: 'slider',
            required: false,
            min: 0,
            max: 100,
            step: 5,
            default: 50,
          },
          {
            name: 'toggle',
            label: 'Toggle',
            type: 'toggle',
            required: false,
            defaultValue: true,
          },
          {
            name: 'date',
            label: 'Date',
            type: 'datepicker',
            required: true,
            minDate: '2024-01-01',
            maxDate: '2024-12-31',
          },
          {
            name: 'multi',
            label: 'Multi-select',
            type: 'multiselect',
            required: false,
            options: ['A', 'B', 'C'],
          },
        ],
        [{ type: 'submit', label: 'Submit' }]
      );
      const html = renderer.renderWidget(widget);

      expect(html).toContain('bbq-form-input');
      expect(html).toContain('bbq-form-select');
      expect(html).toContain('bbq-form-slider');
      expect(html).toContain('bbq-form-toggle');
      expect(html).toContain('bbq-form-datepicker');
      expect(html).toContain('bbq-form-multiselect');
      expect(html).toContain('Option 1');
      expect(html).toContain('Option 2');
      expect(html).toContain('min="0"');
      expect(html).toContain('max="100"');
      expect(html).toContain('value="50"');
    });

    it('should set submit and cancel button classes', () => {
      const widget = new FormWidget(
        'form',
        'submit_form',
        'Form',
        [
          {
            name: 'field',
            label: 'Field',
            type: 'input',
            required: false,
          },
        ],
        [
          { type: 'submit', label: 'Submit' },
          { type: 'cancel', label: 'Cancel' },
        ]
      );
      const html = renderer.renderWidget(widget);

      expect(html).toContain('bbq-form-submit');
      expect(html).toContain('bbq-form-cancel');
      expect(html).toContain('data-action-type="submit"');
      expect(html).toContain('data-action-type="cancel"');
    });
  });
});
