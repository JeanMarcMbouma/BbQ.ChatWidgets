import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from '../types';
import '../styles/ActionsDemoPage.css';

interface ActionsDemoPageProps {
  onBack: () => void;
}

interface ActionResponse {
  action: string;
  payload: Record<string, any>;
  response: string;
  timestamp: Date;
}

export function ActionsDemoPage({ onBack }: ActionsDemoPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [actions, setActions] = useState<ActionResponse[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, actions, scrollToBottom]);

  // Initialize with a greeting message that has action widgets
  useEffect(() => {
    const initializeChat = async () => {
      try {
        const response = await fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Show me some interactive actions',
            threadId: null
          })
        });

        if (response.ok) {
          const data = await response.json();
          setThreadId(data.threadId);

          const assistantMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: data.content,
            widgets: data.widgets,
            timestamp: new Date()
          };

          setMessages([assistantMessage]);
        }
      } catch (err) {
        console.error('Failed to initialize chat:', err);
      }
    };

    initializeChat();
  }, []);

  const handleAction = async (
    action: string,
    payload: Record<string, any>
  ) => {
    setError(null);

    try {
      const response = await fetch('/api/chat/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          payload,
          threadId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Add action response
      const actionResponse: ActionResponse = {
        action,
        payload,
        response: data.content,
        timestamp: new Date()
      };

      setActions(prev => [...prev, actionResponse]);

      // Add assistant message if action returned widgets
      if (data.content) {
        const assistantMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.content,
          widgets: data.widgets,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Action failed: ${errorMsg}`);
    }
  };

  // Sample action handlers
  const handleSampleActions = {
    confirmAction: () => {
      handleAction('confirm_action', { confirmed: true });
    },
    cancelAction: () => {
      handleAction('cancel_action', { cancelled: true });
    },
    submitForm: () => {
      handleAction('submit_form', {
        name: 'John Doe',
        email: 'john@example.com'
      });
    },
    selectOption: () => {
      handleAction('select_option', {
        option: 'Option 2'
      });
    },
    sendFeedback: () => {
      handleAction('send_feedback', {
        rating: 5,
        message: 'Great experience!'
      });
    }
  };

  return (
    <div className="page actions-demo-page">
      <div className="page-header">
        <button className="back-button" onClick={onBack}>← Back</button>
        <h1>🎬 Actions Demo</h1>
        <div className="thread-info">
          {threadId && <span className="thread-id">Thread: {threadId.slice(0, 8)}...</span>}
        </div>
      </div>

      <div className="demo-container">
        <div className="left-panel">
          <div className="messages-section">
            <h3>Chat History</h3>
            <div className="messages-list">
              {messages.map(msg => (
                <div key={msg.id} className={`message ${msg.role}`}>
                  <div className="message-content">
                    <p>{msg.content}</p>
                    {msg.widgets && msg.widgets.length > 0 && (
                      <div className="widgets">
                        {msg.widgets.map((widget, i) => (
                          <div key={i} className="widget-item">
                            <code>{JSON.stringify(widget, null, 2)}</code>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="timestamp">{msg.timestamp.toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="right-panel">
          <div className="actions-section">
            <h3>Test Actions</h3>
            <div className="action-buttons">
              <button
                className="action-button confirm"
                onClick={handleSampleActions.confirmAction}
              >
                ✓ Confirm Action
              </button>
              <button
                className="action-button cancel"
                onClick={handleSampleActions.cancelAction}
              >
                ✕ Cancel Action
              </button>
              <button
                className="action-button form"
                onClick={handleSampleActions.submitForm}
              >
                📝 Submit Form
              </button>
              <button
                className="action-button select"
                onClick={handleSampleActions.selectOption}
              >
                🎯 Select Option
              </button>
              <button
                className="action-button feedback"
                onClick={handleSampleActions.sendFeedback}
              >
                💬 Send Feedback
              </button>
            </div>

            <div className="actions-log">
              <h3>Action Log</h3>
              <div className="log-entries">
                {actions.length === 0 ? (
                  <p className="empty">Click a button to trigger an action...</p>
                ) : (
                  actions.map((action, i) => (
                    <div key={i} className="log-entry">
                      <div className="action-info">
                        <strong>{action.action}</strong>
                        <span className="time">{action.timestamp.toLocaleTimeString()}</span>
                      </div>
                      <pre className="payload">{JSON.stringify(action.payload, null, 2)}</pre>
                      <div className="response">{action.response}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="scenario-info">
        <h3>About Actions</h3>
        <p>
          <strong>Widget Actions</strong> allow users to interact with widgets by clicking buttons,
          filling forms, or selecting options. Each action triggers an API call with typed payloads.
        </p>

        <div className="action-types">
          <h4>Action Types</h4>
          <ul>
            <li>
              <strong>Confirmation Actions</strong> - Confirm or cancel operations
              <code>{`{ action: 'confirm_action', payload: { confirmed: true } }`}</code>
            </li>
            <li>
              <strong>Form Submissions</strong> - Submit form data
              <code>{`{ action: 'submit_form', payload: { name: 'John', email: 'john@example.com' } }`}</code>
            </li>
            <li>
              <strong>Selection Actions</strong> - Select from options
              <code>{`{ action: 'select_option', payload: { option: 'Option 2' } }`}</code>
            </li>
            <li>
              <strong>Feedback Actions</strong> - Collect user feedback
              <code>{`{ action: 'send_feedback', payload: { rating: 5, message: 'Great!' } }`}</code>
            </li>
          </ul>
        </div>

        <div className="handler-types">
          <h4>Typed Action Handlers</h4>
          <p>
            Each action is handled by a typed handler that:
          </p>
          <ul>
            <li>Validates payload structure</li>
            <li>Processes the action</li>
            <li>Returns a response ChatTurn</li>
            <li>May include additional widgets</li>
          </ul>
        </div>

        <div className="flow-diagram">
          <h4>Action Flow</h4>
          <div className="flow">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-text">User clicks widget</div>
            </div>
            <span className="arrow">→</span>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-text">POST /api/chat/action</div>
            </div>
            <span className="arrow">→</span>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-text">Handler processes</div>
            </div>
            <span className="arrow">→</span>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-text">Response received</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActionsDemoPage;
