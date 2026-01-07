import { Component, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../services/chat.service';
import { WidgetRendererComponent } from '../../components/widget-renderer/widget-renderer.component';

interface ActionLog {
  time: string;
  action: string;
  payload: string;
}

@Component({
  selector: 'app-actions-demo',
  standalone: true,
  imports: [CommonModule, WidgetRendererComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <button class="back-button" (click)="handleBack()">← Back</button>
        <h1>🎬 Actions Demo</h1>
      </div>

      <div class="demo-container">
        <div class="messages-section">
          <h3>Interactive Widgets</h3>
          @for (msg of chatService.messages(); track msg.id) {
            <div class="message" [class.assistant]="msg.role === 'assistant'">
              <p>{{ msg.content }}</p>
              @if (msg.widgets && msg.widgets.length > 0) {
                <app-widget-renderer 
                  [widgets]="msg.widgets" 
                  (widgetAction)="handleWidgetAction($event)">
                </app-widget-renderer>
              }
            </div>
          }
          
          @if (chatService.isLoading()) {
            <div class="loading">
              <div class="spinner"></div>
              <p>Processing action...</p>
            </div>
          }
        </div>

        <div class="actions-log">
          <h3>Actions Log</h3>
          <div class="log-entries">
            @if (actionLog().length === 0) {
              <p class="no-actions">No actions yet. Click on widget buttons to see actions.</p>
            } @else {
              @for (entry of actionLog(); track $index) {
                <div class="log-entry">
                  <span class="log-time">{{ entry.time }}</span>
                  <span class="log-action">{{ entry.action }}</span>
                  <span class="log-payload">{{ entry.payload }}</span>
                </div>
              }
            }
          </div>
        </div>
      </div>

      <div class="scenario-info">
        <h3>About This Demo</h3>
        <p>
          <strong>Widget Actions</strong> demonstrate how widgets trigger actions 
          and how the server responds to them.
        </p>
        <ul>
          <li>Click widget buttons to trigger actions</li>
          <li>Fill forms and submit to see action handling</li>
          <li>Actions are logged and sent to the server</li>
          <li>Server processes actions and returns responses</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .demo-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin: 2rem 0;
    }

    .messages-section, .actions-log {
      background: #f5f5f5;
      padding: 1.5rem;
      border-radius: 8px;
    }

    .messages-section h3, .actions-log h3 {
      margin-top: 0;
      color: #333;
    }

    .message {
      background: white;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .loading {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #2196f3;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .log-entries {
      max-height: 400px;
      overflow-y: auto;
    }

    .no-actions {
      color: #999;
      font-style: italic;
      padding: 1rem;
    }

    .log-entry {
      display: flex;
      gap: 1rem;
      padding: 0.5rem;
      margin-bottom: 0.5rem;
      background: white;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.9rem;
    }

    .log-time {
      color: #999;
      min-width: 80px;
    }

    .log-action {
      color: #2196f3;
      font-weight: bold;
      min-width: 150px;
    }

    .log-payload {
      color: #666;
      flex: 1;
      word-break: break-all;
    }

    @media (max-width: 768px) {
      .demo-container {
        grid-template-columns: 1fr;
      }
    }
  `],
  styleUrls: ['../shared-chat-styles.css']
})
export class ActionsDemoComponent implements OnInit {
  @Output() navigateBack = new EventEmitter<void>();
  actionLog = signal<ActionLog[]>([]);

  constructor(public chatService: ChatService) {}

  async ngOnInit() {
    this.chatService.clearMessages();
    // Initialize with demo widgets
    await this.chatService.sendMessage('Show me some interactive buttons and a form', '/api/chat/message');
  }

  handleWidgetAction(event: { actionName: string; payload: any }) {
    const time = new Date().toLocaleTimeString();
    const payload = JSON.stringify(event.payload);
    
    this.actionLog.update(log => [{
      time,
      action: event.actionName,
      payload
    }, ...log].slice(0, 20)); // Keep last 20 actions

    console.log('Widget action triggered:', event.actionName, event.payload);
    this.chatService.sendAction(event.actionName, event.payload);
  }

  handleBack() {
    this.navigateBack.emit();
  }
}
