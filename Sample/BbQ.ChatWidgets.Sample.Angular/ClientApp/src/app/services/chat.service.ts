import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ChatMessage } from '../models/chat.models';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  // Signals for reactive state management
  private _messages = signal<ChatMessage[]>([]);
  private _isLoading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _threadId = signal<string | null>(null);

  // Public readonly signals
  readonly messages = this._messages.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly threadId = this._threadId.asReadonly();

  constructor(private http: HttpClient) {}

  async sendMessage(text: string, endpoint: string = '/api/chat/message'): Promise<void> {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    this._messages.update(msgs => [...msgs, userMessage]);
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(this.http.post<any>(endpoint, {
        message: text,
        threadId: this._threadId()
      }));

      if (!this._threadId() && response.threadId) {
        this._threadId.set(response.threadId);
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        widgets: response.widgets,
        timestamp: new Date()
      };

      this._messages.update(msgs => [...msgs, assistantMessage]);
    } catch (err: any) {
      console.error('Failed to get response:', err);
      this._error.set('Failed to get response. Please try again.');
    } finally {
      this._isLoading.set(false);
    }
  }

  async sendAction(actionName: string, payload: any): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(this.http.post<any>('/api/chat/action', {
        action: actionName,
        payload: payload,
        threadId: this._threadId()
      }));

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        widgets: response.widgets,
        timestamp: new Date()
      };

      this._messages.update(msgs => [...msgs, assistantMessage]);
    } catch (err: any) {
      console.error('Failed to send action:', err);
      this._error.set('Failed to send action. Please try again.');
    } finally {
      this._isLoading.set(false);
    }
  }

  clearMessages(): void {
    this._messages.set([]);
    this._threadId.set(null);
    this._error.set(null);
  }

  resetThread(): void {
    this._threadId.set(null);
  }
}
