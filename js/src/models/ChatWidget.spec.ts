import { describe, it, expect } from 'vitest';
import {
  ChatWidget,
  ButtonWidget,
  CardWidget,
  InputWidget,
  DropdownWidget,
  SliderWidget,
  ToggleWidget,
  FileUploadWidget,
  DatePickerWidget,
  MultiSelectWidget,
  ProgressBarWidget,
} from '../src/models/ChatWidget';

describe('ChatWidget Serialization', () => {
  describe('ButtonWidget', () => {
    it('should serialize and deserialize correctly', () => {
      const widget = new ButtonWidget('Click Me', 'submit');
      const json = widget.toJson();
      const deserialized = ChatWidget.fromJson(json);

      expect(deserialized).toBeInstanceOf(ButtonWidget);
      expect(deserialized?.label).toBe('Click Me');
      expect(deserialized?.action).toBe('submit');
    });
  });

  describe('CardWidget', () => {
    it('should serialize with optional properties', () => {
      const widget = new CardWidget(
        'View',
        'view_product',
        'Product',
        'A great product',
        'https://example.com/image.jpg'
      );
      const json = widget.toJson();
      const deserialized = ChatWidget.fromJson(json) as CardWidget;

      expect(deserialized).toBeInstanceOf(CardWidget);
      expect(deserialized.title).toBe('Product');
      expect(deserialized.description).toBe('A great product');
      expect(deserialized.imageUrl).toBe('https://example.com/image.jpg');
    });
  });

  describe('InputWidget', () => {
    it('should serialize with optional properties', () => {
      const widget = new InputWidget('Your Name', 'input_name', 'Enter your name', 50);
      const json = widget.toJson();
      const deserialized = ChatWidget.fromJson(json) as InputWidget;

      expect(deserialized).toBeInstanceOf(InputWidget);
      expect(deserialized.placeholder).toBe('Enter your name');
      expect(deserialized.maxLength).toBe(50);
    });
  });

  describe('DropdownWidget', () => {
    it('should serialize with options array', () => {
      const widget = new DropdownWidget('Choose Size', 'select_size', [
        'Small',
        'Medium',
        'Large',
      ]);
      const json = widget.toJson();
      const deserialized = ChatWidget.fromJson(json) as DropdownWidget;

      expect(deserialized).toBeInstanceOf(DropdownWidget);
      expect(deserialized.options).toEqual(['Small', 'Medium', 'Large']);
    });
  });

  describe('SliderWidget', () => {
    it('should serialize with numeric properties', () => {
      const widget = new SliderWidget('Volume', 'set_volume', 0, 100, 5, 50);
      const json = widget.toJson();
      const deserialized = ChatWidget.fromJson(json) as SliderWidget;

      expect(deserialized).toBeInstanceOf(SliderWidget);
      expect(deserialized.min).toBe(0);
      expect(deserialized.max).toBe(100);
      expect(deserialized.step).toBe(5);
      expect(deserialized.default).toBe(50);
    });
  });

  describe('ToggleWidget', () => {
    it('should serialize with default value', () => {
      const widget = new ToggleWidget('Enable Notifications', 'toggle_notifications', true);
      const json = widget.toJson();
      const deserialized = ChatWidget.fromJson(json) as ToggleWidget;

      expect(deserialized).toBeInstanceOf(ToggleWidget);
      expect(deserialized.defaultValue).toBe(true);
    });
  });

  describe('FileUploadWidget', () => {
    it('should serialize with optional properties', () => {
      const widget = new FileUploadWidget(
        'Upload Document',
        'upload_file',
        '.pdf,.docx',
        5000000
      );
      const json = widget.toJson();
      const deserialized = ChatWidget.fromJson(json) as FileUploadWidget;

      expect(deserialized).toBeInstanceOf(FileUploadWidget);
      expect(deserialized.accept).toBe('.pdf,.docx');
      expect(deserialized.maxBytes).toBe(5000000);
    });
  });

  describe('DatePickerWidget', () => {
    it('should serialize with date range', () => {
      const widget = new DatePickerWidget(
        'Select Date',
        'pick_date',
        '2024-01-01',
        '2024-12-31'
      );
      const json = widget.toJson();
      const deserialized = ChatWidget.fromJson(json) as DatePickerWidget;

      expect(deserialized).toBeInstanceOf(DatePickerWidget);
      expect(deserialized.minDate).toBe('2024-01-01');
      expect(deserialized.maxDate).toBe('2024-12-31');
    });
  });

  describe('MultiSelectWidget', () => {
    it('should serialize with options array', () => {
      const widget = new MultiSelectWidget('Select Items', 'select_items', [
        'Item1',
        'Item2',
        'Item3',
      ]);
      const json = widget.toJson();
      const deserialized = ChatWidget.fromJson(json) as MultiSelectWidget;

      expect(deserialized).toBeInstanceOf(MultiSelectWidget);
      expect(deserialized.options).toEqual(['Item1', 'Item2', 'Item3']);
    });
  });

  describe('ProgressBarWidget', () => {
    it('should serialize with value and max', () => {
      const widget = new ProgressBarWidget('Upload Progress', 'upload_progress', 75, 100);
      const json = widget.toJson();
      const deserialized = ChatWidget.fromJson(json) as ProgressBarWidget;

      expect(deserialized).toBeInstanceOf(ProgressBarWidget);
      expect(deserialized.value).toBe(75);
      expect(deserialized.max).toBe(100);
    });
  });

  describe('List serialization', () => {
    it('should serialize and deserialize widget list', () => {
      const widgets = [
        new ButtonWidget('Button', 'action1'),
        new InputWidget('Input', 'action2'),
        new DropdownWidget('Dropdown', 'action3', ['A', 'B']),
      ];

      const json = JSON.stringify(widgets.map((w) => w.toObject()));
      const deserialized = ChatWidget.listFromJson(json);

      expect(deserialized).toHaveLength(3);
      expect(deserialized?.[0]).toBeInstanceOf(ButtonWidget);
      expect(deserialized?.[1]).toBeInstanceOf(InputWidget);
      expect(deserialized?.[2]).toBeInstanceOf(DropdownWidget);
    });
  });

  describe('Invalid JSON handling', () => {
    it('should return null for invalid JSON', () => {
      const result = ChatWidget.fromJson('invalid json');
      expect(result).toBeNull();
    });

    it('should return null for unknown widget type', () => {
      const result = ChatWidget.fromJson('{"type":"unknown","label":"test","action":"test"}');
      expect(result).toBeNull();
    });
  });
});
