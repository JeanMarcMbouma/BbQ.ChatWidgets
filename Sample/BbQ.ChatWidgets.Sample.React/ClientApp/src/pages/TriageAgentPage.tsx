import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from '../types';
import { WidgetRenderer } from '../components/WidgetRenderer';
import '../styles/TriageAgentPage.css';

interface TriageAgentPageProps {
  onBack: () => void;
}

interface Classification {
  intent?: string;
  agent?: string;
}

export function TriageAgentPage({ onBack }: TriageAgentPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [persona, setPersona] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [classification, setClassification] = useState<Classification | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, classification, scrollToBottom]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

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
    setClassification(null);

    try {
      const response = await fetch('/api/chat/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          threadId: threadId,
          persona: persona.trim() ? persona : null
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Set thread ID on first message
      if (!threadId && data.threadId) {
        setThreadId(data.threadId);
      }

      // Extract classification info from metadata (if available from backend)
      // This would need to be returned by the backend for display
      setClassification({
        intent: data.metadata?.classification || 'Not determined',
        agent: data.metadata?.routedAgent || 'Default agent'
      });

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
      setError(`Failed: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const SAMPLE_INTENTS = [
    { text: 'I need help resetting my password', intent: 'HelpRequest' },
    { text: 'Show me the sales data for Q4', intent: 'DataQuery' },
    { text: 'Delete my account', intent: 'ActionRequest' },
    { text: 'Your service is amazing!', intent: 'Feedback' }
  ];

  return (
    <div className="page triage-agent-page">
      <div className="page-header">
        <button className="back-button" onClick={onBack}>← Back</button>
        <h1>🎯 Triage Agent</h1>
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
                    <WidgetRenderer widgets={msg.widgets} />
                  </div>
                )}
              </div>
              <span className="timestamp">{msg.timestamp.toLocaleTimeString()}</span>
            </div>
          ))}
          {classification && (
            <div className="classification-info">
              <div className="info-badge">
                <span className="label">Intent:</span>
                <span className="value">{classification.intent}</span>
              </div>
              <div className="info-badge">
                <span className="label">Agent:</span>
                <span className="value">{classification.agent}</span>
              </div>
            </div>
          )}
          {isLoading && (
            <div className="message assistant loading">
              <div className="spinner"></div>
              <p>Classifying and routing...</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="input-area">
          <input
            type="text"
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            disabled={isLoading}
            placeholder="Optional persona (blank = default)"
            className="chat-input"
          />
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
            placeholder="Type a message to be classified and routed..."
            className="chat-input"
          />
          <button
            onClick={() => handleSendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="send-button"
          >
            {isLoading ? 'Classifying...' : 'Send'}
          </button>
        </div>
      </div>

      <div className="scenario-info">
        <h3>About This Scenario</h3>
        <p>
          <strong>Triage Agent</strong> automatically classifies your message and routes it to the appropriate specialized agent.
        </p>
        
        <div className="intent-categories">
          <h4>Intent Categories</h4>
          <ul>
            {SAMPLE_INTENTS.map((item, i) => (
              <li key={i}>
                <strong>{item.intent}:</strong> {item.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="agent-routing">
          <h4>Agent Routing</h4>
          <ul>
            <li><strong>HelpRequest</strong> → help-agent (Support)</li>
            <li><strong>DataQuery</strong> → data-query-agent (Information)</li>
            <li><strong>ActionRequest</strong> → action-agent (Operations)</li>
            <li><strong>Feedback</strong> → feedback-agent (Feedback)</li>
            <li><strong>Unknown</strong> → help-agent (Fallback)</li>
          </ul>
        </div>

        <div className="quick-test">
          <h4>Quick Test</h4>
          <p>Try one of these sample messages:</p>
          <div className="sample-buttons">
            {SAMPLE_INTENTS.map((item, i) => (
              <button
                key={i}
                className="sample-button"
                onClick={() => handleSendMessage(item.text)}
                disabled={isLoading}
              >
                {item.intent}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TriageAgentPage;
