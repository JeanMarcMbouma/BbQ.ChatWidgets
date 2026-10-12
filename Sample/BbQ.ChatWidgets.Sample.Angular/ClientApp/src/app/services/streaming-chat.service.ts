import { Injectable, signal } from '@angular/core';
import { ChatMessage } from '../models/chat.models';

@Injectable({
  providedIn: 'root'
})
export class StreamingChatService {
  private activeRequest: AbortController | null = null;
  private _messages = signal<ChatMessage[]>([]);
  private _isStreaming = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _threadId = signal<string | null>(null);

  readonly messages = this._messages.asReadonly();
  readonly isStreaming = this._isStreaming.asReadonly();
  readonly error = this._error.asReadonly();
  readonly threadId = this._threadId.asReadonly();

  async sendStreamingMessage(text: string, endpoint: string = '/api/chat/stream/message', persona: string | null = null): Promise<void> {
    if (!text.trim() || this.activeRequest) return;
    const request = new AbortController();
    this.activeRequest = request;
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    this._messages.update(msgs => [...msgs, userMessage]);
    this._isStreaming.set(true);
    this._error.set(null);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        signal: request.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          threadId: this._threadId(),
          persona: persona && persona.trim() ? persona : null
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!response || !reader) {
        throw new Error('Response body is null');
      }

      const assistantMessageId = crypto.randomUUID();
      let buffer = "";
      let receivedThreadId = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (this.activeRequest !== request) return;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.substring(5).trim();
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);

              if (!receivedThreadId && parsed.threadId) {
                this._threadId.set(parsed.threadId);
                receivedThreadId = true;
              }

              if (typeof parsed.content === 'string' || Array.isArray(parsed.widgets)) {
                // Note: Streaming returns delta and each delta has the current text
                // So we use parsed.content directly, not accumulated
                const previous = this._messages().find(m => m.id === assistantMessageId);
                const currentContent = parsed.content ?? previous?.content ?? '';

                const existingIndex = this._messages().findIndex(m => m.id === assistantMessageId);
                const updatedMessage: ChatMessage = {
                  id: assistantMessageId,
                  role: 'assistant',
                  content: currentContent,
                  widgets: parsed.widgets ?? previous?.widgets,
                  timestamp: new Date()
                };

                if (existingIndex >= 0) {
                  this._messages.update(msgs => {
                    const newMsgs = [...msgs];
                    newMsgs[existingIndex] = updatedMessage;
                    return newMsgs;
                  });
                } else {
                  this._messages.update(msgs => [...msgs, updatedMessage]);
                }
              }
            } catch (err) {
              console.error('Failed to parse SSE data:', err);
            }
          }
        }
      }
    } catch (err: any) {
      if (request.signal.aborted || this.activeRequest !== request) return;
      console.error('Failed to get streaming response:', err);
      this._error.set('Failed to get streaming response. Please try again.');
    } finally {
      reader?.releaseLock();
      if (this.activeRequest === request) {
        this.activeRequest = null;
        this._isStreaming.set(false);
      }
    }
  }

  clearMessages(): void {
    this.activeRequest?.abort();
    this.activeRequest = null;
    this._isStreaming.set(false);
    this._messages.set([]);
    this._threadId.set(null);
    this._error.set(null);
  }
}
