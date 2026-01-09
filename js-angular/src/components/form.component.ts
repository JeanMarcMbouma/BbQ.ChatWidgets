import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { FormWidget } from '@bbq-chat/widgets';
import { IWidgetComponent } from '../renderers/AngularWidgetRenderer';

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

            @switch (field.type) {
              @case ('input') {
                <input 
                  type="text" 
                  [id]="getFieldId(field.name)"
                  class="bbq-form-input" 
                  [name]="field.name"
                  [placeholder]="field.label"
                  [required]="field.required || false"
                  [attr.data-field-type]="field.type"
                  [(ngModel)]="formData[field.name]" />
              }
              @case ('text') {
                <input 
                  type="text" 
                  [id]="getFieldId(field.name)"
                  class="bbq-form-input" 
                  [name]="field.name"
                  [placeholder]="field.label"
                  [required]="field.required || false"
                  [attr.data-field-type]="field.type"
                  [(ngModel)]="formData[field.name]" />
              }
              @case ('email') {
                <input 
                  type="email" 
                  [id]="getFieldId(field.name)"
                  class="bbq-form-input" 
                  [name]="field.name"
                  [placeholder]="field.label"
                  [required]="field.required || false"
                  [attr.data-field-type]="field.type"
                  [(ngModel)]="formData[field.name]" />
              }
              @case ('number') {
                <input 
                  type="number" 
                  [id]="getFieldId(field.name)"
                  class="bbq-form-input" 
                  [name]="field.name"
                  [placeholder]="field.label"
                  [required]="field.required || false"
                  [attr.data-field-type]="field.type"
                  [(ngModel)]="formData[field.name]" />
              }
              @case ('password') {
                <input 
                  type="password" 
                  [id]="getFieldId(field.name)"
                  class="bbq-form-input" 
                  [name]="field.name"
                  [placeholder]="field.label"
                  [required]="field.required || false"
                  [attr.data-field-type]="field.type"
                  [(ngModel)]="formData[field.name]" />
              }
              @case ('textarea') {
                <textarea 
                  [id]="getFieldId(field.name)"
                  class="bbq-form-textarea" 
                  [name]="field.name"
                  [placeholder]="field.label"
                  [required]="field.required || false"
                  [attr.data-field-type]="field.type"
                  [(ngModel)]="formData[field.name]"></textarea>
              }
              @case ('dropdown') {
                <select 
                  [id]="getFieldId(field.name)"
                  class="bbq-form-select" 
                  [name]="field.name"
                  [required]="field.required || false"
                  [attr.data-field-type]="field.type"
                  [(ngModel)]="formData[field.name]">
                  <option value="">Select...</option>
                  @for (option of getFieldProp(field, 'options') || []; track option) {
                    <option [value]="option">{{ option }}</option>
                  }
                </select>
              }
              @case ('select') {
                <select 
                  [id]="getFieldId(field.name)"
                  class="bbq-form-select" 
                  [name]="field.name"
                  [required]="field.required || false"
                  [attr.data-field-type]="field.type"
                  [(ngModel)]="formData[field.name]">
                  <option value="">Select...</option>
                  @for (option of getFieldProp(field, 'options') || []; track option) {
                    <option [value]="option">{{ option }}</option>
                  }
                </select>
              }
              @case ('checkbox') {
                <input 
                  type="checkbox" 
                  [id]="getFieldId(field.name)"
                  class="bbq-form-checkbox" 
                  [name]="field.name"
                  [attr.data-field-type]="field.type"
                  [(ngModel)]="formData[field.name]" />
              }
              @case ('radio') {
                <input 
                  type="radio" 
                  [id]="getFieldId(field.name)"
                  class="bbq-form-radio" 
                  [name]="field.name"
                  [attr.data-field-type]="field.type"
                  [(ngModel)]="formData[field.name]" />
              }
              @case ('slider') {
                <input 
                  type="range" 
                  [id]="getFieldId(field.name)"
                  class="bbq-form-slider" 
                  [name]="field.name"
                  [min]="getFieldProp(field, 'min') || 0"
                  [max]="getFieldProp(field, 'max') || 100"
                  [step]="getFieldProp(field, 'step') || 1"
                  [required]="field.required || false"
                  [attr.data-field-type]="field.type"
                  [(ngModel)]="formData[field.name]" />
                <span class="bbq-form-slider-value" aria-live="polite">{{ formData[field.name] }}</span>
              }
              @case ('toggle') {
                <input 
                  type="checkbox" 
                  [id]="getFieldId(field.name)"
                  class="bbq-form-toggle" 
                  [name]="field.name"
                  [attr.data-field-type]="field.type"
                  [(ngModel)]="formData[field.name]" />
              }
              @case ('datepicker') {
                <input 
                  type="date" 
                  [id]="getFieldId(field.name)"
                  class="bbq-form-datepicker" 
                  [name]="field.name"
                  [min]="getFieldProp(field, 'minDate') || ''"
                  [max]="getFieldProp(field, 'maxDate') || ''"
                  [required]="field.required || false"
                  [attr.data-field-type]="field.type"
                  [(ngModel)]="formData[field.name]" />
              }
              @case ('multiselect') {
                <select 
                  [id]="getFieldId(field.name)"
                  class="bbq-form-multiselect" 
                  [name]="field.name"
                  [required]="field.required || false"
                  [attr.data-field-type]="field.type"
                  multiple
                  [(ngModel)]="formData[field.name]">
                  @for (option of getFieldProp(field, 'options') || []; track option) {
                    <option [value]="option">{{ option }}</option>
                  }
                </select>
              }
              @case ('fileupload') {
                <input 
                  type="file" 
                  [id]="getFieldId(field.name)"
                  class="bbq-form-fileupload" 
                  [name]="field.name"
                  [accept]="getFieldProp(field, 'accept') || ''"
                  [attr.data-max-bytes]="getFieldProp(field, 'maxBytes')"
                  [required]="field.required || false"
                  [attr.data-field-type]="field.type"
                  (change)="onFileChange($event, field.name)" />
              }
              @default {
                <input 
                  type="text" 
                  [id]="getFieldId(field.name)"
                  class="bbq-form-input" 
                  [name]="field.name"
                  [required]="field.required || false"
                  [attr.data-field-type]="field.type"
                  [(ngModel)]="formData[field.name]" />
              }
            }

            @if (field.validationHint) {
              <span class="bbq-form-field-hint">{{ field.validationHint }}</span>
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
  styles: []
})
export class FormWidgetComponent implements IWidgetComponent, OnInit {
  @Input() widget!: any;
  widgetAction?: (actionName: string, payload: unknown) => void;
  
  formId = '';
  formData: Record<string, any> = {};
  showValidationMessage = false;

  get formWidget(): FormWidget {
    return this.widget as FormWidget;
  }

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

  getFieldId(fieldName: string): string {
    return `${this.formId}-${fieldName}`;
  }

  getFieldProp(field: any, prop: string): any {
    return field[prop];
  }

  onFileChange(event: Event, fieldName: string) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.formData[fieldName] = target.files[0];
    }
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
}
