import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-widgets-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <button class="back-button" (click)="handleBack()">← Back</button>
        <h1>🧩 Widgets Demo</h1>
      </div>
      <div class="scenario-info" style="margin: 40px auto;">
        <h3>Widgets Demo</h3>
        <p>
          Explore all available widgets: buttons, forms, dropdowns, sliders, and more.
          Ask the AI to show you various widget types.
        </p>
        <ul>
          <li>Try: "Show me all available widgets"</li>
          <li>Try: "Create a feedback form"</li>
          <li>Try: "Show me a slider and dropdown"</li>
        </ul>
        <p><em>This page uses the same Basic Chat implementation with widget rendering.</em></p>
      </div>
    </div>
  `,
  styleUrls: ['../shared-chat-styles.css']
})
export class WidgetsDemoComponent {
  handleBack() {
    window.dispatchEvent(new CustomEvent('navigateBack'));
  }
}
