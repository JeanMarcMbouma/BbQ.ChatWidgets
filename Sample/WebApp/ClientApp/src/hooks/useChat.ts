import { useState, useCallback } from 'react';
import type { ChatTurn } from '@bbq/chatwidgets';

export interface ChatMessage extends ChatTurn {
  id: string;
}

export interface UseChat {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  threadId: string | null;
  sendMessage: (message: string) => Promise<void>;
  sendAction: (actionName: string, payload: unknown) => Promise<void>;
  clearMessages: () => void;
}

export const useChat = (apiBaseUrl = '/api/chat'): UseChat => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      setIsLoading(true);
      setError(null);

      try {
        // Create new thread if needed
        const currentThreadId = threadId || crypto.randomUUID();
        if (!threadId) {
          setThreadId(currentThreadId);
        }

        // Add user message to local state
        const userMessageId = crypto.randomUUID();
        setMessages((prev) => [
          ...prev,
          {
            id: userMessageId,
            role: 'user',
            content: message,
            threadId: currentThreadId,
            widgets: null,
          },
        ]);

        // Send to backend
        const response = await fetch(`${apiBaseUrl}/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            threadId: currentThreadId,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const turn = (await response.json()) as ChatTurn;

        // Update threadId from backend response if provided
        if (turn.threadId && turn.threadId !== currentThreadId) {
          setThreadId(turn.threadId);
        }

        // Add assistant message to local state
        const assistantMessageId = crypto.randomUUID();
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMessageId,
            ...turn,
          },
        ]);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
        console.error('Chat error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [threadId, apiBaseUrl]
  );

  const sendAction = useCallback(
    async (actionName: string, payload: unknown) => {
      if (!threadId) {
        setError('No active thread');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiBaseUrl}/action`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: actionName,
            payload,
            threadId,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const turn = (await response.json()) as ChatTurn;

        // Update threadId from backend response if provided
        if (turn.threadId && turn.threadId !== threadId) {
          setThreadId(turn.threadId);
        }

        // Add action response to local state
        const messageId = crypto.randomUUID();
        setMessages((prev) => [
          ...prev,
          {
            id: messageId,
            ...turn,
          },
        ]);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to send action';
        setError(errorMessage);
        console.error('Action error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [threadId, apiBaseUrl]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setThreadId(null);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    threadId,
    sendMessage,
    sendAction,
    clearMessages,
  };
};
