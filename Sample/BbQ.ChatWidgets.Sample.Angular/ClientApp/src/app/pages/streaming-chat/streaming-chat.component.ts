import { Component, OnInit, Output, EventEmitter, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StreamingChatService } from '../../services/streaming-chat.service';
import { WidgetRendererComponent } from '../../components/widget-renderer/widget-renderer.component';

@Component({
  selector: 'app-streaming-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, WidgetRendererComponent],
  templateUrl: './streaming-chat.component.html',
  styleUrls: ['../shared-chat-styles.css']
})
export class StreamingChatComponent implements OnInit {
  input = signal('');
  @Output() navigateBack = new EventEmitter<void>();
  
  constructor(public streamingService: StreamingChatService) {
    effect(() => {
      const messages = this.streamingService.messages();
      if (messages.length > 0) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  ngOnInit() {
    this.streamingService.clearMessages();
  }

  async sendMessage() {
    const text = this.input();
    if (!text.trim() || this.streamingService.isStreaming()) return;
    
    this.input.set('');
    await this.streamingService.sendStreamingMessage(text);
  }

  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !this.streamingService.isStreaming()) {
      this.sendMessage();
    }
  }

  handleWidgetAction(event: { actionName: string; payload: any }) {
    console.log('Widget action triggered:', event.actionName, event.payload);
    // Handle widget actions if needed
  }

  private scrollToBottom() {
    const element = document.querySelector('.messages-list');
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }

  handleBack() {
    this.navigateBack.emit();
  }
}
