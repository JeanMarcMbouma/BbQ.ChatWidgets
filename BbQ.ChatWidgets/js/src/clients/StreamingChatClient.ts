/**
 * Streaming chat client for Server-Sent Events
 * Provides real-time chat responses from the backend
 */

import type { ChatTurn, ChatWidget } from './models/ChatTurn';

/**
 * Represents a streaming chat turn with delta flag
 */
export interface StreamChatTurn extends ChatTurn {
  /**
   * True if this is an intermediate update, false if final
   */
  isDelta?: boolean;
}

/**
 * Options for streaming chat requests
 */
export interface StreamingChatOptions {
  /**
   * URL base for streaming endpoints (default: /api/chat)
   */
  baseUrl?: string;

  /**
   * Callback fired when each event arrives
   */
  onEvent?: (turn: StreamChatTurn) => void;

  /**
   * Callback fired when streaming completes
   */
  onComplete?: (turn: ChatTurn) => void;

  /**
   * Callback fired on error
   */
  onError?: (error: Error) => void;

  /**
   * Callback fired on stream close
   */
  onClose?: () => void;
}

/**
 * Client for streaming chat responses via Server-Sent Events
 */
export class StreamingChatClient {
  private baseUrl: string;
  private eventSource: EventSource | null = null;

  constructor(baseUrl: string = '/api/chat') {
    this.baseUrl = baseUrl;
  }

  /**
   * Stream a message and get responses via SSE
   * @param message User message
   * @param threadId Optional conversation thread ID
   * @param options Configuration options
   */
  async streamMessage(
    message: string,
    threadId?: string,
    options: StreamingChatOptions = {}
  ): Promise<void> {
    const params = new URLSearchParams({
      message,
      ...(threadId && { threadId })
    });

    const url = `${options.baseUrl || this.baseUrl}/stream/message`;
    
    return this.openStream(url, options);
  }

  /**
   * Stream a message through the triage agent via SSE
   * @param message User message
   * @param threadId Optional conversation thread ID
   * @param options Configuration options
   */
  async streamAgentMessage(
    message: string,
    threadId?: string,
    options: StreamingChatOptions = {}
  ): Promise<void> {
    const url = `${options.baseUrl || this.baseUrl}/stream/agent`;
    const body = JSON.stringify({
      message,
      ...(threadId && { threadId })
    });

    return this.openStreamWithBody(url, body, options);
  }

  /**
   * Open SSE stream with POST body
   */
  private async openStreamWithBody(
    url: string,
    body: string,
    options: StreamingChatOptions
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create a fetch request to get the event stream
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body
        })
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Handle streaming response
            const reader = response.body?.getReader();
            if (!reader) {
              throw new Error('Response body not readable');
            }

            const processStream = async () => {
              const decoder = new TextDecoder();
              let buffer = '';

              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split('\n');
                  
                  // Process complete lines
                  for (let i = 0; i < lines.length - 1; i++) {
                    const line = lines[i];
                    if (line.startsWith('data: ')) {
                      const json = line.substring(6);
                      try {
                        const turn = JSON.parse(json) as StreamChatTurn;
                        options.onEvent?.(turn);

                        if (!turn.isDelta) {
                          options.onComplete?.(turn);
                          resolve();
                        }
                      } catch (e) {
                        console.error('Failed to parse event:', json, e);
                      }
                    }
                  }

                  // Keep incomplete line in buffer
                  buffer = lines[lines.length - 1];
                }

                options.onClose?.();
                resolve();
              } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                options.onError?.(err);
                reject(err);
              }
            };

            processStream();
          })
          .catch(error => {
            const err = error instanceof Error ? error : new Error(String(error));
            options.onError?.(err);
            reject(err);
          });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        options.onError?.(err);
        reject(err);
      }
    });
  }

  /**
   * Open SSE stream
   */
  private openStream(url: string, options: StreamingChatOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Close existing connection
        if (this.eventSource) {
          this.eventSource.close();
        }

        const eventSource = new EventSource(url);
        this.eventSource = eventSource;

        let completedOnce = false;

        eventSource.addEventListener('message', (event) => {
          try {
            const turn = JSON.parse(event.data) as StreamChatTurn;
            options.onEvent?.(turn);

            if (!turn.isDelta) {
              completedOnce = true;
              options.onComplete?.(turn);
              eventSource.close();
              resolve();
            }
          } catch (error) {
            console.error('Failed to parse event:', event.data, error);
          }
        });

        eventSource.addEventListener('error', () => {
          if (!completedOnce) {
            const error = new Error('EventSource connection error');
            options.onError?.(error);
            reject(error);
          }
          eventSource.close();
          options.onClose?.();
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        options.onError?.(err);
        reject(err);
      }
    });
  }

  /**
   * Close current stream connection
   */
  close(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

/**
 * React hook for streaming chat
 */
export function useStreamingChat(baseUrl: string = '/api/chat') {
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [content, setContent] = React.useState('');
  const [widgets, setWidgets] = React.useState<ChatWidget[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const clientRef = React.useRef(new StreamingChatClient(baseUrl));

  const streamMessage = React.useCallback(
    async (message: string, threadId?: string) => {
      setIsStreaming(true);
      setContent('');
      setWidgets([]);
      setError(null);

      try {
        await clientRef.current.streamMessage(message, threadId, {
          onEvent: (turn) => {
            setContent(turn.content);
          },
          onComplete: (turn) => {
            setContent(turn.content);
            if (turn.widgets) {
              setWidgets(turn.widgets);
            }
            setIsStreaming(false);
          },
          onError: (err) => {
            setError(err.message);
            setIsStreaming(false);
          },
          onClose: () => {
            setIsStreaming(false);
          }
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        setIsStreaming(false);
      }
    },
    []
  );

  const streamAgentMessage = React.useCallback(
    async (message: string, threadId?: string) => {
      setIsStreaming(true);
      setContent('');
      setWidgets([]);
      setError(null);

      try {
        await clientRef.current.streamAgentMessage(message, threadId, {
          onEvent: (turn) => {
            setContent(turn.content);
          },
          onComplete: (turn) => {
            setContent(turn.content);
            if (turn.widgets) {
              setWidgets(turn.widgets);
            }
            setIsStreaming(false);
          },
          onError: (err) => {
            setError(err.message);
            setIsStreaming(false);
          },
          onClose: () => {
            setIsStreaming(false);
          }
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        setIsStreaming(false);
      }
    },
    []
  );

  React.useEffect(() => {
    return () => {
      clientRef.current.close();
    };
  }, []);

  return {
    isStreaming,
    content,
    widgets,
    error,
    streamMessage,
    streamAgentMessage,
    close: () => clientRef.current.close()
  };
}

import React from 'react';
