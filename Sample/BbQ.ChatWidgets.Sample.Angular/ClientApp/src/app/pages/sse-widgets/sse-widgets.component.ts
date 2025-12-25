import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sse-widgets',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <button class="back-button" (click)="handleBack()">← Back</button>
        <h1>📡 SSE Widget Updates</h1>
      </div>
      <div class="scenario-info" style="margin: 40px auto;">
        <h3>Server-Sent Events Widget Updates</h3>
        <p>
          Demonstrates server-sent events updating widgets in real-time. Widgets can subscribe
          to SSE streams and receive live updates from the server.
        </p>
        <ul>
          <li>Widgets subscribe to event streams</li>
          <li>Server pushes updates via SSE</li>
          <li>Client updates widgets dynamically</li>
          <li>Endpoint: GET /api/chat/widgets/streams/{{'{streamId}'}}/events</li>
        </ul>
        <p><em>Ask the AI to show you SSE-enabled widgets like weather or stock tickers.</em></p>
      </div>
    </div>
  `,
  styleUrls: ['../shared-chat-styles.css']
})
export class SseWidgetsComponent {
  @Output() navigateBack = new EventEmitter<void>();

  handleBack() {
    this.navigateBack.emit();
  }
}
