import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import '../styles/BasicChat.css';

interface BasicChatPageProps {
  onBack: () => void;
}

export function BasicChatPage({ onBack }: BasicChatPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          threadId: threadId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Create new thread if first message
      if (!threadId && data.threadId) {
        setThreadId(data.threadId);
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        widgets: data.widgets,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to get response: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page basic-chat-page">
      <div className="page-header">
        <button className="back-button" onClick={onBack}>? Back</button>
        <h1>?? Basic Chat</h1>
        <div className="thread-info">
          {threadId && <span className="thread-id">Thread: {threadId.slice(0, 8)}...</span>}
        </div>
      </div>

      <div className="chat-container">
        <div className="messages-list">
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.role}`}>
              <div className="message-content">
                <p>{msg.content}</p>
                {msg.widgets && msg.widgets.length > 0 && (
                  <div className="widgets">
                    {msg.widgets.map((widget, i) => (
                      <div key={i} className="widget-item">
                        <pre>{JSON.stringify(widget, null, 2)}</pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span className="timestamp">{msg.timestamp.toLocaleTimeString()}</span>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant loading">
              <div className="spinner"></div>
              <p>Thinking...</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="input-area">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                handleSendMessage(input);
              }
            }}
            disabled={isLoading}
            placeholder="Type a message..."
            className="chat-input"
          />
          <button
            onClick={() => handleSendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="send-button"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      <div className="scenario-info">
        <h3>About This Scenario</h3>
        <p>
          <strong>Basic Chat</strong> demonstrates the traditional request-response pattern. 
          Send a message and receive the complete response with any embedded widgets.
        </p>
        <ul>
          <li>Endpoint: POST /api/chat/message</li>
          <li>Response: Complete ChatTurn with all widgets</li>
          <li>Best for: Simple interactions, form submissions</li>
        </ul>
      </div>
    </div>
  );
}

export default BasicChatPage;
