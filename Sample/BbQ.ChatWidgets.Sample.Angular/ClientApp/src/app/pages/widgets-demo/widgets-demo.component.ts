import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { WidgetRendererComponent } from '../../components/widget-renderer/widget-renderer.component';

@Component({
  selector: 'app-widgets-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, WidgetRendererComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <button class="back-button" (click)="handleBack()">← Back</button>
        <h1>🧩 Widgets Demo</h1>
        <div class="thread-info">
          @if (chatService.threadId()) {
            <span class="thread-id">Thread: {{ chatService.threadId()!.slice(0, 8) }}...</span>
          }
        </div>
      </div>

      <div class="chat-container">
        <div class="messages-list">
          @for (msg of chatService.messages(); track msg.id) {
            <div class="message" [class.user]="msg.role === 'user'" [class.assistant]="msg.role === 'assistant'">
              <div class="message-content">
                <p>{{ msg.content }}</p>
                @if (msg.widgets && msg.widgets.length > 0) {
                  <app-widget-renderer 
                    [widgets]="msg.widgets" 
                    (widgetAction)="handleWidgetAction($event)">
                  </app-widget-renderer>
                }
              </div>
              <span class="timestamp">{{ msg.timestamp | date:'shortTime' }}</span>
            </div>
          }
          
          @if (chatService.isLoading()) {
            <div class="message assistant loading">
              <div class="spinner"></div>
              <p>Thinking...</p>
            </div>
          }
        </div>

        @if (chatService.error()) {
          <div class="error-message">{{ chatService.error() }}</div>
        }

        <div class="input-area">
          <input
            type="text"
            class="chat-input"
            [(ngModel)]="input"
            (keydown)="handleKeyDown($event)"
            [disabled]="chatService.isLoading()"
            placeholder="Try: 'Show me all widget types' or 'Create a feedback form'"
          />
          <button
            class="send-button"
            (click)="sendMessage()"
            [disabled]="chatService.isLoading() || !input.trim()"
          >
            {{ chatService.isLoading() ? 'Sending...' : 'Send' }}
          </button>
        </div>
      </div>

      <div class="scenario-info">
        <h3>About This Demo</h3>
        <p>
          <strong>Widgets Demo</strong> showcases all available interactive widgets.
          Try asking for different widget types to see how they work.
        </p>
        <ul>
          <li>Try: "Show me all available widgets"</li>
          <li>Try: "Create a feedback form with rating slider"</li>
          <li>Try: "Show me buttons, cards, and toggles"</li>
          <li>Available: Buttons, Forms, Cards, Sliders, Toggles, and more!</li>
        </ul>
      </div>
    </div>
  `,
  styleUrls: ['../shared-chat-styles.css']
})
export class WidgetsDemoComponent implements OnInit {
  input = '';
  @Output() navigateBack = new EventEmitter<void>();

  constructor(public chatService: ChatService) {}

  ngOnInit() {
    this.chatService.clearMessages();
  }

  async sendMessage() {
    if (!this.input.trim() || this.chatService.isLoading()) return;
    
    const text = this.input;
    this.input = '';
    await this.chatService.sendMessage(text, '/api/chat/message');
  }

  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !this.chatService.isLoading()) {
      this.sendMessage();
    }
  }

  handleWidgetAction(event: { actionName: string; payload: any }) {
    console.log('Widget action triggered:', event.actionName, event.payload);
    this.chatService.sendAction(event.actionName, event.payload);
  }

  handleBack() {
    this.navigateBack.emit();
  }
}
