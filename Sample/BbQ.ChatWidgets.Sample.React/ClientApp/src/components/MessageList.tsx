import React, { useEffect, useRef } from 'react';
import { WidgetRenderer } from './WidgetRenderer';
import type { ChatMessage } from '../hooks/useChat';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onWidgetAction: (actionName: string, payload: unknown) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  onWidgetAction,
}) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="message-list">
      {messages.length === 0 ? (
        <div className="empty-state">
          <p>Start a conversation by typing a message below.</p>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message message-${message.role}`}
            >
              <div className="message-header">
                <span className="message-role">
                  {message.role === 'user' ? 'You' : 'Assistant'}
                </span>
              </div>
              <div className="message-content">{message.content}</div>
              {message.widgets && message.widgets.length > 0 && (
                <WidgetRenderer
                  widgets={message.widgets}
                  onWidgetAction={onWidgetAction}
                />
              )}
            </div>
          ))}
          {isLoading && (
            <div className="message message-assistant loading">
              <div className="message-content">
                <span className="loading-indicator">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </>
      )}
    </div>
  );
};
