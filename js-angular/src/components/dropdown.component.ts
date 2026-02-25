import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { DropdownWidget } from '@bbq-chat/widgets';
import { CustomWidgetComponent } from '../custom-widget-renderer.types';

@Component({
  selector: 'bbq-dropdown-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div 
      class="bbq-widget bbq-dropdown" 
      [attr.data-widget-type]="'dropdown'">
      <label *ngIf="showLabel" class="bbq-dropdown-label" [attr.for]="selectId">
        {{ dropdownWidget.label }}
      </label>
      <select 
        [id]="selectId"
        [ngClass]="selectClasses"
        [attr.data-action]="dropdownWidget.action"
        [(ngModel)]="value">
        @for (option of dropdownWidget.options; track option) {
          <option [value]="option">{{ option }}</option>
        }
      </select>
    </div>
  `,
  styles: []
})
export class DropdownWidgetComponent implements CustomWidgetComponent, OnInit {
  @Input() widget!: any;
  widgetAction?: (actionName: string, payload: unknown) => void;
  
  value = '';
  selectId = '';

  get dropdownWidget(): DropdownWidget {
    return this.widget as DropdownWidget;
  }

  get showLabel(): boolean {
    const widget = this.dropdownWidget as any;
    if (widget.hideLabel === true) {
      return false;
    }
    if (widget.showLabel === false) {
      return false;
    }
    return true;
  }

  get selectClasses(): string[] {
    return this.isFormAppearance ? ['bbq-form-select'] : ['bbq-dropdown'];
  }

  private get isFormAppearance(): boolean {
    return (this.dropdownWidget as any).appearance === 'form';
  }

  ngOnInit() {
    this.selectId = `bbq-${this.dropdownWidget.action.replace(/\s+/g, '-').toLowerCase()}-select`;
    this.value = (this.dropdownWidget as any).defaultValue ?? this.dropdownWidget.options[0] ?? '';
  }
}
