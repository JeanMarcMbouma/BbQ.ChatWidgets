import { useEffect, useRef, useState } from 'react';
import '../styles/WidgetsDemoPage.css';

interface Props {
  onBack: () => void;
}

export function SseWidgetsPage({ onBack }: Props) {
  const [streamId, setStreamId] = useState('sample-stream');
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const widgetContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  function addLog(text: string) {
    setLogs(l => [text, ...l].slice(0, 50));
  }

  function connect() {
    if (!streamId) return;
    const url = `/api/chat/widgets/streams/${encodeURIComponent(streamId)}/events`;
    addLog(`Connecting to ${url}`);
    const es = new EventSource(url);
    es.onopen = () => {
      setConnected(true);
      addLog('Connected');
    };
    es.onerror = () => {
      addLog('EventSource error');
      setConnected(false);
    };
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        addLog(`Message: ${ev.data}`);
        // If the server sends { widgetId, html } replace the element
        if (data && data.widgetId && data.html) {
          const selector = `[data-widget-id="${data.widgetId}"]`;
          const el = document.querySelector(selector);
          if (el) {
            // Replace innerHTML safely for demo purposes
            (el as HTMLElement).innerHTML = data.html;
            addLog(`Replaced widget ${data.widgetId}`);
          } else {
            // If element not found, append as a log entry
            addLog(`Widget ${data.widgetId} not found locally`);
          }
        }
      } catch (err) {
        addLog('Failed to parse message');
      }
    };

    eventSourceRef.current = es;
  }

  function disconnect() {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setConnected(false);
    addLog('Disconnected');
  }

  async function sendUpdate() {
    if (!streamId) return;
    const widgetId = 'sse-widget-1';
    const now = new Date().toLocaleTimeString();
    const html = `<div style="padding:12px;background:#f5f5ff;border-radius:6px;">` +
      `<strong>Live update</strong><div>Updated at ${now}</div></div>`;

    const payload = { widgetId, html };
    const url = `/api/chat/widgets/streams/${encodeURIComponent(streamId)}/events`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        addLog('Published update');
      } else {
        addLog(`Publish failed: ${res.status}`);
      }
    } catch (err) {
      addLog('Publish request failed');
    }
  }

  return (
    <div className="page widgets-demo-page sse-demo">
      <div className="page-header">
        <button className="back-button" onClick={onBack}>← Back</button>
        <h1>📡 SSE Widget Updates</h1>
        <p className="subtitle">Subscribe to a named stream and publish live widget updates.</p>
      </div>

      <div className="sse-demo-container">
        <div className="sse-left">
          <div style={{marginBottom:12}} className="sse-controls">
            <label>Stream ID: </label>
            <input value={streamId} onChange={e => setStreamId(e.target.value)} />
            <div className="sse-button-group">
              {!connected ? (
                <button onClick={connect}>Connect</button>
              ) : (
                <button onClick={disconnect}>Disconnect</button>
              )}
              <button onClick={sendUpdate}>Send Test Update</button>
            </div>
          </div>

          <div style={{marginTop:8}} className="sse-widget-area">
            <h3>Widget Area (client-side)</h3>
            <div ref={widgetContainerRef}>
              <div
                data-widget-id="sse-widget-1"
                className="sse-panel"
              >
                <strong>Initial widget</strong>
                <div>Waiting for updates from stream "{streamId}"</div>
              </div>
            </div>
          </div>
        </div>

        <aside className="sse-right">
          <h3>Event Log</h3>
          <div className="sse-event-log">
            {logs.map((l,i) => <div key={i} className="sse-log-entry">{l}</div>)}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default SseWidgetsPage;
