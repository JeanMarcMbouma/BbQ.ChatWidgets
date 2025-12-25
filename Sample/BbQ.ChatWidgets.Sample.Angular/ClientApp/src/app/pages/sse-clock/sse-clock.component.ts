import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sse-clock',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <button class="back-button" (click)="handleBack()">← Back</button>
        <h1>⏰ SSE Clock</h1>
      </div>
      <div class="scenario-info" style="margin: 40px auto;">
        <h3>Live Clock via Server-Sent Events</h3>
        <p>
          A minimal example of server-sent events. The server publishes time updates
          every second, and the clock widget refreshes automatically.
        </p>
        <ul>
          <li>Server publishes time updates</li>
          <li>Client receives updates via SSE</li>
          <li>Widget auto-refreshes</li>
          <li>Endpoint: GET /api/chat/widgets/streams/default-stream/events</li>
        </ul>
        <p><em>Ask the AI: "Show me the server clock"</em></p>
      </div>
    </div>
  `,
  styleUrls: ['../shared-chat-styles.css']
})
export class SseClockComponent {
  @Output() navigateBack = new EventEmitter<void>();

  handleBack() {
    this.navigateBack.emit();
  }
}
