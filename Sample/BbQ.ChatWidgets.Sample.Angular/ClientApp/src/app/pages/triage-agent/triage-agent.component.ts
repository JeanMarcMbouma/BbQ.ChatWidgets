import { Component, OnInit, Output, EventEmitter, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-triage-agent',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './triage-agent.component.html',
  styleUrls: ['../shared-chat-styles.css']
})
export class TriageAgentComponent implements OnInit {
  input = signal('');
  persona = signal('');
  @Output() navigateBack = new EventEmitter<void>();
  
  constructor(public chatService: ChatService) {
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

  async sendMessage() {
    const text = this.input();
    if (!text.trim() || this.chatService.isLoading()) return;
    
    this.input.set('');
    await this.chatService.sendMessage(text, '/api/chat/agent', this.persona());
  }

  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !this.chatService.isLoading()) {
      this.sendMessage();
    }
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
