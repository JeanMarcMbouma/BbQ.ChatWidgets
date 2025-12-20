import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from '../types';
import { WidgetRenderer } from '../components/WidgetRenderer';
import '../styles/StreamingChat.css';

interface StreamingChatPageProps {
  onBack: () => void;
}

export function StreamingChatPage({ onBack }: StreamingChatPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentContent, setCurrentContent] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentContent, scrollToBottom]);

  const handleStreamMessage = async (text: string) => {
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
    setIsStreaming(true);
    setCurrentContent('');
    setError(null);

    try {
      const response = await fetch('/api/chat/stream/message', {
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

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let lastTurn: any = null;

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
              const turn = JSON.parse(json);
              lastTurn = turn;

              if (!turn.isDelta) {
                // Final event
                setCurrentContent(turn.content);
              } else {
                // Intermediate update
                setCurrentContent(turn.content);
              }
            } catch (e) {
              console.error('Failed to parse event:', json);
            }
          }
        }

        buffer = lines[lines.length - 1];
      }

      // Add final assistant message
      if (lastTurn) {
        if (!threadId && lastTurn.threadId) {
          setThreadId(lastTurn.threadId);
        }

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: lastTurn.content,
          widgets: lastTurn.widgets,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        setCurrentContent('');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Stream failed: ${errorMsg}`);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="page streaming-chat-page">
      <div className="page-header">
        <button className="back-button" onClick={onBack}>← Back</button>
        <h1>⚡ Streaming Chat</h1>
        <div className="thread-info">
          {threadId && <span className="thread-id">Thread: {threadId.slice(0, 8)}...</span>}
          {isStreaming && <span className="streaming-badge">📡 Streaming...</span>}
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
                    <WidgetRenderer widgets={msg.widgets} />
                  </div>
                )}
              </div>
              <span className="timestamp">{msg.timestamp.toLocaleTimeString()}</span>
            </div>
          ))}
          {isStreaming && (
            <div className="message assistant streaming">
              <div className="message-content">
                <p className="streaming-text">{currentContent || 'Connecting...'}</p>
                <span className="cursor">|</span>
              </div>
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
              if (e.key === 'Enter' && !isStreaming) {
                handleStreamMessage(input);
              }
            }}
            disabled={isStreaming}
            placeholder="Type a message to stream..."
            className="chat-input"
          />
          <button
            onClick={() => handleStreamMessage(input)}
            disabled={isStreaming || !input.trim()}
            className="send-button"
          >
            {isStreaming ? 'Streaming...' : 'Stream'}
          </button>
        </div>
      </div>

      <div className="scenario-info">
        <h3>About This Scenario</h3>
        <p>
          <strong>Streaming Chat</strong> delivers responses in real-time using Server-Sent Events (SSE).
          Watch content appear as the AI generates it, providing immediate feedback to users.
        </p>
        <ul>
          <li>Endpoint: POST /api/chat/stream/message</li>
          <li>Response: Stream of ChatTurn events</li>
          <li>Delta updates: Intermediate content (isDelta: true)</li>
          <li>Final event: Complete response with widgets (isDelta: false)</li>
          <li>Best for: Long responses, live engagement</li>
        </ul>
      </div>
    </div>
  );
}

export default StreamingChatPage;
