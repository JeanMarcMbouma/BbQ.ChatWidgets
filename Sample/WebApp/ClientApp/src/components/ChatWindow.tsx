import React from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import type { UseChat } from '../hooks/useChat';

interface ChatWindowProps extends UseChat {}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isLoading,
  error,
  sendMessage,
  sendAction,
  clearMessages,
}) => {
  return (
    <div className="chat-window">
      <div className="chat-header">
        <h1>BbQ ChatWidgets Sample</h1>
        {messages.length > 0 && (
          <button
            className="clear-button"
            onClick={clearMessages}
            disabled={isLoading}
          >
            Clear
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <MessageList
        messages={messages}
        isLoading={isLoading}
        onWidgetAction={sendAction}
      />

      <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
    </div>
  );
};
