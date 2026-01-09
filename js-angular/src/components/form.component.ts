import { Component, Input, OnInit, AfterViewInit, ViewChildren, QueryList, ViewContainerRef, ComponentRef, Injector, EnvironmentInjector, createComponent, Type, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { FormWidget, ChatWidget } from '@bbq-chat/widgets';
import { CustomWidgetComponent } from '../custom-widget-renderer.types';
import { InputWidgetComponent } from './input.component';
import { TextAreaWidgetComponent } from './textarea.component';
import { DropdownWidgetComponent } from './dropdown.component';
import { SliderWidgetComponent } from './slider.component';
import { ToggleWidgetComponent } from './toggle.component';
import { DatePickerWidgetComponent } from './datepicker.component';
import { MultiSelectWidgetComponent } from './multiselect.component';
import { FileUploadWidgetComponent } from './fileupload.component';

/**
 * Helper class to wrap form fields as widgets for dynamic rendering
 */
class FormFieldWidget implements ChatWidget {
  readonly type: string;
  readonly label: string;
  readonly action: string;
  readonly appearance = 'form';
  readonly hideLabel = true;

  constructor(
    public field: any,
    public formId: string
  ) {
    this.type = this.mapFieldTypeToWidgetType(field.type);
    this.label = field.label;
    this.action = `${formId}_${field.name}`;
  }

  private mapFieldTypeToWidgetType(fieldType: string): string {
    const typeMap: Record<string, string> = {
      'input': 'input',
      'text': 'input',
      'email': 'input',
      'number': 'input',
      'password': 'input',
      'textarea': 'textarea',
      'dropdown': 'dropdown',
      'select': 'dropdown',
      'slider': 'slider',
      'toggle': 'toggle',
      'datepicker': 'datepicker',
      'multiselect': 'multiselect',
      'fileupload': 'fileupload'
    };
    return typeMap[fieldType] || 'input';
  }

  // Map field properties to widget properties
  get placeholder(): string | undefined {
    return this.field.placeholder ?? undefined;
  }

  get maxLength(): number | undefined {
    return this.field['maxLength'];
  }

  get rows(): number | undefined {
    return this.field['rows'];
  }

  get options(): string[] {
    return this.field['options'] || [];
  }

  get min(): number {
    return this.field['min'] ?? 0;
  }

  get max(): number {
    return this.field['max'] ?? 100;
  }

  get step(): number {
    return this.field['step'] ?? 1;
  }

  get defaultValue(): any {
    return this.field['defaultValue'] ?? (this.type === 'slider' ? this.min : undefined);
  }

  get minDate(): string | undefined {
    return this.field['minDate'];
  }

  get maxDate(): string | undefined {
    return this.field['maxDate'];
  }

  get accept(): string | undefined {
    return this.field['accept'];
  }

  get maxBytes(): number | undefined {
    return this.field['maxBytes'];
  }

  // ChatWidget interface methods
  toJson(): string {
    return JSON.stringify(this.toObject());
  }

  toObject(): any {
    return {
      type: this.type,
      label: this.label,
      action: this.action,
      ...this.field
    };
  }
}

@Component({
  selector: 'bbq-form-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div 
      class="bbq-widget bbq-form" 
      [attr.data-widget-id]="formId"
      [attr.data-widget-type]="'form'"
      [attr.data-action]="formWidget.action">
      <fieldset class="bbq-form-fieldset">
        <legend class="bbq-form-title">{{ formWidget.title }}</legend>

        @for (field of formWidget.fields; track field.name) {
          <div 
            class="bbq-form-field"
            [class.bbq-form-field-required]="field.required"
            [attr.data-required]="field.required ? 'true' : null">
            <label class="bbq-form-field-label" [attr.for]="getFieldId(field.name)">
              {{ field.label }}
              @if (field.required) {
                <span class="bbq-form-required">*</span>
              }
            </label>

            <div #fieldContainer class="bbq-form-field-widget"></div>

            @if (getFieldProp(field, 'validationHint')) {
              <span class="bbq-form-field-hint">{{ getFieldProp(field, 'validationHint') }}</span>
            }
          </div>
        }

        <div class="bbq-form-validation-message" [style.display]="showValidationMessage ? 'block' : 'none'">
          Please fill in all required fields before submitting.
        </div>

        @if (formWidget.actions && formWidget.actions.length > 0) {
          <div class="bbq-form-actions">
            @for (action of formWidget.actions; track action.label) {
              <button 
                type="button" 
                class="bbq-form-button"
                [class.bbq-form-submit]="action.type === 'submit'"
                [class.bbq-form-cancel]="action.type !== 'submit'"
                [attr.data-action]="formWidget.action"
                [attr.data-action-type]="action.type"
                (click)="onActionClick(action.type)">
                {{ action.label }}
              </button>
            }
          </div>
        }
      </fieldset>
    </div>
  `,
  styles: [`
    .bbq-form-field-widget {
      display: contents;
    }
  `]
})
export class FormWidgetComponent implements CustomWidgetComponent, OnInit, AfterViewInit, OnDestroy {
  @Input() widget!: any;
  widgetAction?: (actionName: string, payload: unknown) => void;
  
  @ViewChildren('fieldContainer', { read: ViewContainerRef }) 
  fieldContainers!: QueryList<ViewContainerRef>;

  formId = '';
  formData: Record<string, any> = {};
  showValidationMessage = false;
  private componentRefs: ComponentRef<any>[] = [];

  // Component registry for field types
  private fieldComponentRegistry: Record<string, Type<CustomWidgetComponent>> = {
    'input': InputWidgetComponent,
    'text': InputWidgetComponent,
    'email': InputWidgetComponent,
    'number': InputWidgetComponent,
    'password': InputWidgetComponent,
    'textarea': TextAreaWidgetComponent,
    'dropdown': DropdownWidgetComponent,
    'select': DropdownWidgetComponent,
    'slider': SliderWidgetComponent,
    'toggle': ToggleWidgetComponent,
    'datepicker': DatePickerWidgetComponent,
    'multiselect': MultiSelectWidgetComponent,
    'fileupload': FileUploadWidgetComponent,
    'checkbox': ToggleWidgetComponent,
    'radio': ToggleWidgetComponent,
  };

  get formWidget(): FormWidget {
    return this.widget as FormWidget;
  }

  constructor(
    private injector: Injector,
    private environmentInjector: EnvironmentInjector
  ) {}

  ngOnInit() {
    this.formId = `bbq-${this.formWidget.action.replace(/\s+/g, '-').toLowerCase()}`;
    
    // Initialize form data with default values
    for (const field of this.formWidget.fields || []) {
      if (field.type === 'slider') {
        this.formData[field.name] = field['default'] ?? field['defaultValue'] ?? field['min'] ?? 0;
      } else if (field.type === 'toggle' || field.type === 'checkbox') {
        this.formData[field.name] = field['defaultValue'] ?? false;
      } else if (field.type === 'multiselect') {
        this.formData[field.name] = [];
      } else {
        this.formData[field.name] = '';
      }
    }
  }

  ngAfterViewInit() {
    // Render field widgets dynamically
    setTimeout(() => this.renderFieldWidgets(), 0);
  }

  ngOnDestroy() {
    // Clean up component refs
    this.componentRefs.forEach(ref => ref.destroy());
    this.componentRefs = [];
  }

  private renderFieldWidgets() {
    const containers = this.fieldContainers.toArray();
    const fields = this.formWidget.fields || [];

    fields.forEach((field: any, index: number) => {
      const container = containers[index];
      if (!container) return;

      const componentType = this.fieldComponentRegistry[field.type];
      if (!componentType) {
        // Fallback to input for unknown types
        this.renderInputFallback(container, field);
        return;
      }

      // Create the field widget
      const fieldWidget = new FormFieldWidget(field, this.formId);
      
      // Create the component
      const componentRef = createComponent(componentType, {
        environmentInjector: this.environmentInjector,
        elementInjector: this.injector,
      });

      // Set component inputs
      const instance = componentRef.instance as any;
      instance['widget'] = fieldWidget;
      
      // Connect to form data via widgetAction
      instance['widgetAction'] = (actionName: string, payload: unknown) => {
        // Handle field value changes - for now, we'll sync via the rendered widget's internal state
        // The actual form submission will gather values from the DOM
      };

      // Attach to container
      container.insert(componentRef.hostView);
      this.componentRefs.push(componentRef);

      // Trigger change detection
      componentRef.changeDetectorRef.detectChanges();
    });
  }

  private renderInputFallback(container: ViewContainerRef, field: any) {
    // For unsupported field types, render a basic input
    const fieldWidget = new FormFieldWidget(field, this.formId);
    const componentRef = createComponent(InputWidgetComponent, {
      environmentInjector: this.environmentInjector,
      elementInjector: this.injector,
    });

    const instance = componentRef.instance as any;
    instance['widget'] = fieldWidget;

    container.insert(componentRef.hostView);
    this.componentRefs.push(componentRef);
    componentRef.changeDetectorRef.detectChanges();
  }

  getFieldId(fieldName: string): string {
    // Match the ID format used by dynamically rendered input widgets
    return `bbq-${this.formId}_${fieldName}-input`;
  }

  getFieldProp(field: any, prop: string): any {
    return field[prop];
  }

  onActionClick(actionType: string) {
    if (actionType === 'submit') {
      // Validate required fields
      const hasErrors = this.validateForm();
      
      if (hasErrors) {
        this.showValidationMessage = true;
        return;
      }
      
      this.showValidationMessage = false;
      
      // Gather form data from the DOM (since widgets manage their own state)
      this.gatherFormData();
      
      if (this.widgetAction) {
        this.widgetAction(this.formWidget.action, this.formData);
      }
    } else {
      // Cancel or other actions
      if (this.widgetAction) {
        this.widgetAction(this.formWidget.action, { actionType });
      }
    }
  }

  private validateForm(): boolean {
    for (const field of this.formWidget.fields || []) {
      if (field.required) {
        const value = this.formData[field.name];
        if (value === undefined || value === null || value === '' || 
            (Array.isArray(value) && value.length === 0)) {
          return true; // Has errors
        }
      }
    }
    return false; // No errors
  }

  private gatherFormData() {
    // Gather data from the rendered field widgets
    // Since each widget component manages its own state via ngModel,
    // we need to query the DOM to get the current values
    const fields = this.formWidget.fields || [];
    
    fields.forEach((field: any) => {
      const fieldId = this.getFieldId(field.name);
      const element = document.getElementById(fieldId) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      
      if (element) {
        if (element.type === 'checkbox') {
          this.formData[field.name] = (element as HTMLInputElement).checked;
        } else if (element.type === 'file') {
          this.formData[field.name] = (element as HTMLInputElement).files?.[0];
        } else if (element.tagName === 'SELECT' && (element as HTMLSelectElement).multiple) {
          const select = element as HTMLSelectElement;
          this.formData[field.name] = Array.from(select.selectedOptions).map(opt => opt.value);
        } else {
          this.formData[field.name] = element.value;
        }
      }
    });
  }
}
