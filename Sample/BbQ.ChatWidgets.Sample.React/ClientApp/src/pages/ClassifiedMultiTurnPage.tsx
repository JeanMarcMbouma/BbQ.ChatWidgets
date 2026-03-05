import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from '../types';
import { WidgetRenderer } from '../components/WidgetRenderer';
import '../styles/ClassifiedMultiTurnPage.css';

interface ClassifiedMultiTurnPageProps {
  onBack: () => void;
}

interface AgentPipelineTurn {
  agentName: string;
  round: number;
  content: string;
}

interface AgentPipelineTrace {
  turns: AgentPipelineTurn[];
}

interface AgentResponse {
  role: string;
  content: string;
  widgets?: unknown[];
  threadId?: string;
  metadata?: {
    classification?: string;
    routedAgent?: string;
    [key: string]: unknown;
  };
  agentPipeline?: AgentPipelineTrace;
}

const INTENT_COLORS: Record<string, string> = {
  DataQuery:     '#667eea',
  HelpRequest:   '#4caf50',
  ActionRequest: '#ff9800',
  Feedback:      '#e91e63',
  Unknown:       '#9e9e9e',
};

const PIPELINE_AGENT_ICONS: Record<string, string> = {
  researcher: '🔍',
  analyst:    '📊',
  summarizer: '📝',
};

export function ClassifiedMultiTurnPage({ onBack }: ClassifiedMultiTurnPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<AgentResponse | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, lastResponse, scrollToBottom]);

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
    setLastResponse(null);

    try {
      const response = await fetch('/api/chat/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, threadId })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data: AgentResponse = await response.json();

      if (!threadId && data.threadId) setThreadId(data.threadId);

      setLastResponse(data);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        widgets: data.widgets as ChatMessage['widgets'],
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const classification = lastResponse?.metadata?.classification;
  const routedAgent = lastResponse?.metadata?.routedAgent;
  const pipeline = lastResponse?.agentPipeline;

  const SAMPLE_PROMPTS = [
    // DataQuery → multi-turn pipeline
    'What are the latest trends in renewable energy?',
    'Find statistics on global e-commerce growth',
    // Other intents → single-turn agents
    'Help me understand how to use widgets',
    'Delete my account',
    'I love the new design!'
  ];

  return (
    <div className="page classified-multi-turn-page">
      <div className="page-header">
        <button className="back-button" onClick={onBack}>← Back</button>
        <h1>🎯🔄 Classifier + Multi-Turn Agent</h1>
        <div className="thread-info">
          {threadId && <span className="thread-id">Thread: {threadId.slice(0, 8)}…</span>}
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

          {/* Classification + Routing info */}
          {(classification || routedAgent) && (
            <div className="classification-panel">
              {classification && (
                <div
                  className="intent-badge"
                  style={{ background: INTENT_COLORS[classification] ?? '#667eea' }}
                >
                  🏷️ {classification}
                </div>
              )}
              {routedAgent && (
                <div className="routed-badge">
                  ⟶ {routedAgent}
                </div>
              )}
            </div>
          )}

          {/* Multi-turn pipeline trace */}
          {pipeline && pipeline.turns.length > 0 && (
            <div className="pipeline-trace">
              <div className="pipeline-trace-header">
                <span>🔄 Multi-Turn Pipeline ({pipeline.turns.length} steps)</span>
              </div>
              <div className="pipeline-steps">
                {pipeline.turns.map((turn, i) => (
                  <div key={i} className="pipeline-step">
                    <div className="pipeline-step-label">
                      <span className="step-icon">
                        {PIPELINE_AGENT_ICONS[turn.agentName.toLowerCase()] ?? '🤖'}
                      </span>
                      <span className="step-name">{turn.agentName}</span>
                      <span className="step-round">Round {turn.round}</span>
                    </div>
                    <p className="step-content">{turn.content}</p>
                    {i < pipeline.turns.length - 1 && (
                      <div className="step-arrow">↓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="message assistant loading">
              <div className="spinner"></div>
              <p>Classifying and routing…</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="input-area">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !isLoading) handleSendMessage(input); }}
            disabled={isLoading}
            placeholder="Ask a question or request an action…"
            className="chat-input"
          />
          <button
            onClick={() => handleSendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="send-button"
          >
            {isLoading ? 'Working…' : 'Send'}
          </button>
        </div>
      </div>

      <div className="scenario-info">
        <h3>How it works</h3>
        <p>
          This demo combines a <strong>Classifier (TriageAgent)</strong> with a
          <strong> Multi-Turn Orchestrator</strong>:
        </p>

        <div className="flow-diagram">
          <div className="flow-step highlight">
            <span className="flow-icon">🎯</span>
            <div>
              <strong>1. Classify</strong>
              <p>TriageAgent classifies your message into an intent category</p>
            </div>
          </div>
          <div className="flow-arrow">↓</div>
          <div className="flow-step highlight">
            <span className="flow-icon">🔀</span>
            <div>
              <strong>2. Route</strong>
              <p>DataQuery → multi-turn pipeline · Other intents → single-turn agents</p>
            </div>
          </div>
          <div className="flow-arrow">↓</div>
          <div className="flow-step highlight pipeline-highlight">
            <span className="flow-icon">🔄</span>
            <div>
              <strong>3. Orchestrate (DataQuery only)</strong>
              <p>Researcher → Analyst → Summarizer, each building on prior results</p>
            </div>
          </div>
        </div>

        <div className="quick-test">
          <h4>Try These Prompts</h4>
          <p className="hint">Data questions trigger the 3-step pipeline; other intents go to single-turn agents.</p>
          <div className="sample-buttons">
            {SAMPLE_PROMPTS.map((q, i) => (
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

        <div className="intent-legend">
          <h4>Intent Categories</h4>
          <div className="legend-items">
            {Object.entries(INTENT_COLORS).map(([intent, color]) => (
              <span key={intent} className="legend-item" style={{ borderColor: color, color }}>
                {intent}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClassifiedMultiTurnPage;
