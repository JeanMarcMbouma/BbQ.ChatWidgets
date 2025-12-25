import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-actions-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <button class="back-button" (click)="handleBack()">← Back</button>
        <h1>🎬 Actions Demo</h1>
      </div>
      <div class="scenario-info" style="margin: 40px auto;">
        <h3>Widget Actions Demo</h3>
        <p>
          Demonstrates widget interactions: button clicks, form submissions, and action handlers.
        </p>
        <ul>
          <li>Try: "Create a button that says hello"</li>
          <li>Try: "Show me a feedback form"</li>
          <li>Endpoint: POST /api/chat/action</li>
        </ul>
        <p><em>Actions are triggered when you interact with widgets.</em></p>
      </div>
    </div>
  `,
  styleUrls: ['../shared-chat-styles.css']
})
export class ActionsDemoComponent {
  @Output() navigateBack = new EventEmitter<void>();

  handleBack() {
    this.navigateBack.emit();
  }
}
