import { Component, OnInit, OnDestroy, Output, EventEmitter, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { WidgetRendererComponent } from '../../components/widget-renderer/widget-renderer.component';

@Component({
  selector: 'app-basic-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, WidgetRendererComponent],
  templateUrl: './basic-chat.component.html',
  styleUrls: ['../shared-chat-styles.css', './basic-chat.component.css']
})
export class BasicChatComponent implements OnInit, OnDestroy {
  input = signal('');
  @Output() navigateBack = new EventEmitter<void>();
  
  constructor(public chatService: ChatService) {
    // Auto-scroll effect
    effect(() => {
      const messages = this.chatService.messages();
      if (messages.length > 0) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  ngOnInit() {
    this.chatService.clearMessages();
  }

  ngOnDestroy() {
    // Optionally clear messages on destroy
  }

  async sendMessage() {
    const text = this.input();
    if (!text.trim() || this.chatService.isLoading()) return;
    
    this.input.set('');
    await this.chatService.sendMessage(text, '/api/chat/message');
  }

  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !this.chatService.isLoading()) {
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
