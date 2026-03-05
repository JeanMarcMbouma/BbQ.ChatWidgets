import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from '../types';
import { WidgetRenderer } from '../components/WidgetRenderer';
import '../styles/MultiTurnAgentPage.css';

interface MultiTurnAgentPageProps {
  onBack: () => void;
}

interface AgentTurn {
  agentName: string;
  round: number;
  content: string;
}

interface AgentConversationContext {
  turns: AgentTurn[];
}

export function MultiTurnAgentPage({ onBack }: MultiTurnAgentPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agentContext, setAgentContext] = useState<AgentConversationContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, agentContext, scrollToBottom]);

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
    setAgentContext(null);

    try {
      const response = await fetch('/api/chat/agent', {
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

      if (!threadId && data.threadId) {
        setThreadId(data.threadId);
      }

      // Extract agent pipeline from the enriched response (added by HandleAgentRequest)
      const agentConvCtx = data.agentPipeline as AgentConversationContext | undefined;
      if (agentConvCtx?.turns?.length) {
        setAgentContext(agentConvCtx);
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
      setError(`Failed: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const SAMPLE_QUESTIONS = [
    'Research the history of AI and summarise it for me',
    'Analyse customer feedback and generate an improvement plan',
    'Gather market data and produce a recommendation',
    'Investigate the issue and write a brief report'
  ];

  return (
    <div className="page multi-turn-page">
      <div className="page-header">
        <button className="back-button" onClick={onBack}>← Back</button>
        <h1>🔄 Multi-Turn Agent Conversation</h1>
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

          {agentContext && agentContext.turns.length > 0 && (
            <div className="agent-pipeline-trace">
              <div className="trace-header">
                <span className="trace-icon">🔄</span>
                <strong>Agent Pipeline ({agentContext.turns.length} turn{agentContext.turns.length > 1 ? 's' : ''})</strong>
              </div>
              <div className="trace-turns">
                {agentContext.turns.map((turn, i) => (
                  <div key={i} className="trace-turn">
                    <div className="trace-turn-header">
                      <span className="round-badge">Round {turn.round}</span>
                      <span className="agent-name">{turn.agentName}</span>
                    </div>
                    <p className="trace-content">{turn.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="message assistant loading">
              <div className="spinner"></div>
              <p>Orchestrating agents...</p>
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
            placeholder="Ask something that requires multiple agents..."
            className="chat-input"
          />
          <button
            onClick={() => handleSendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="send-button"
          >
            {isLoading ? 'Working...' : 'Send'}
          </button>
        </div>
      </div>

      <div className="scenario-info">
        <h3>About This Scenario</h3>
        <p>
          <strong>Multi-Turn Agent Orchestration</strong> lets one orchestrator query multiple
          specialist agents in sequence. Each agent's response is passed as context to the next
          agent, enabling collaborative reasoning across agents.
        </p>

        <div className="feature-list">
          <h4>Key Features</h4>
          <ul>
            <li>🔄 <strong>Sequential pipeline</strong> — agents queried in a defined order</li>
            <li>📜 <strong>Accumulated context</strong> — prior agent responses fed into each turn</li>
            <li>🎭 <strong>Per-agent persona</strong> — each agent can have its own system prompt</li>
            <li>🛡️ <strong>Max-rounds guard</strong> — configurable caps prevent infinite loops</li>
          </ul>
        </div>

        <div className="quick-test">
          <h4>Quick Test Prompts</h4>
          <div className="sample-buttons">
            {SAMPLE_QUESTIONS.map((q, i) => (
              <button
                key={i}
                className="sample-button"
                onClick={() => handleSendMessage(q)}
                disabled={isLoading}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MultiTurnAgentPage;
