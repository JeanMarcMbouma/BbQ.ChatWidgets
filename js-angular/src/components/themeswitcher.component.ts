import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { ThemeSwitcherWidget } from '@bbq-chat/widgets';
import { IWidgetComponent } from '../renderers/AngularWidgetRenderer';

@Component({
  selector: 'bbq-themeswitcher-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div 
      class="bbq-widget bbq-theme-switcher" 
      [attr.data-widget-type]="'themeswitcher'">
      <label class="bbq-theme-switcher-label" [attr.for]="selectId">
        {{ themeSwitcherWidget.label }}
      </label>
      <select 
        [id]="selectId"
        class="bbq-theme-switcher-select" 
        [attr.data-action]="themeSwitcherWidget.action"
        [attr.aria-labelledby]="selectId"
        [(ngModel)]="value">
        @for (theme of themeSwitcherWidget.themes; track theme) {
          <option [value]="theme">{{ theme }}</option>
        }
      </select>
    </div>
  `,
  styles: []
})
export class ThemeSwitcherWidgetComponent implements IWidgetComponent, OnInit {
  @Input() widget!: any;
  widgetAction?: (actionName: string, payload: unknown) => void;
  
  value = '';
  selectId = '';

  get themeSwitcherWidget(): ThemeSwitcherWidget {
    return this.widget as ThemeSwitcherWidget;
  }

  ngOnInit() {
    this.selectId = `bbq-${this.themeSwitcherWidget.action.replace(/\s+/g, '-').toLowerCase()}-select`;
    this.value = this.themeSwitcherWidget.themes[0] || '';
  }
}
