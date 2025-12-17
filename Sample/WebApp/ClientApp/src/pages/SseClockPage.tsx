import { useEffect, useRef, useState } from 'react';
import '../styles/WidgetsDemoPage.css';

interface Props {
  onBack: () => void;
}

export function SseClockPage({ onBack }: Props) {
  const [streamId, setStreamId] = useState('default-stream');
  const [connected, setConnected] = useState(false);
  const [timeIso, setTimeIso] = useState<string | null>(null);
  const [timeLocal, setTimeLocal] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const esRef = useRef<EventSource | null>(null);

  function addLog(text: string) {
    setLogs(l => [text, ...l].slice(0, 30));
  }

  useEffect(() => {
    return () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, []);

  function connect() {
    if (esRef.current) return;
    const url = `/api/chat/widgets/streams/${encodeURIComponent(streamId)}/events`;
    addLog(`Connecting to stream: ${streamId}`);
    const es = new EventSource(url);
    es.onopen = () => {
      setConnected(true);
      addLog('✓ Connected to SSE stream');
    };
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data && data.widgetId === 'clock') {
          // Prefer structured time fields if provided
          if (data.timeLocal) {
            setTimeLocal(String(data.timeLocal));
            addLog(`⏰ Time: ${data.timeLocal}`);
          }
          if (data.time) {
            setTimeIso(String(data.time));
          }
        }
      } catch (e) {
        addLog(`Error parsing message: ${String(e)}`);
      }
    };
    es.onerror = () => {
      addLog('✗ Connection error');
      setConnected(false);
    };
    esRef.current = es;
  }

  function disconnect() {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setConnected(false);
    addLog('Disconnected from stream');
  }

  async function startServerClock() {
    const url = `/sample/clock/${encodeURIComponent(streamId)}/start`;
    try {
      addLog('Starting server clock...');
      const res = await fetch(url, { method: 'POST' });
      if (res.ok) {
        addLog('✓ Server clock started');
      } else {
        addLog(`✗ Start failed: ${res.status}`);
      }
    } catch (e) {
      addLog(`✗ Start error: ${String(e)}`);
    }
  }

  async function stopServerClock() {
    const url = `/sample/clock/${encodeURIComponent(streamId)}/stop`;
    try {
      addLog('Stopping server clock...');
      const res = await fetch(url, { method: 'POST' });
      if (res.ok) {
        addLog('✓ Server clock stopped');
      } else {
        addLog(`✗ Stop failed: ${res.status}`);
      }
    } catch (e) {
      addLog(`✗ Stop error: ${String(e)}`);
    }
  }

  return (
    <div className="page widgets-demo-page sse-demo-clock">
      <div className="page-header">
        <button className="back-button" onClick={onBack}>← Back</button>
        <h1>⏰ SSE Clock Widget</h1>
        <p className="subtitle">
          Server-Sent Events (SSE) demonstration with metadata-driven clock widget.
          Ask the chat "What time is it?" to see the clock widget integrated into conversations.
        </p>
      </div>

      <div className="sse-demo-container sse-demo-clock-container">
        <div className="sse-left">
          <div className="sse-info-box">
            <h3>Implementation Details</h3>
            <ul>
              <li><strong>Chat Integration:</strong> Ask "What time is it?" in chat to receive the clock widget</li>
              <li><strong>Widget Metadata:</strong> Clock widget includes streamId for SSE subscription</li>
              <li><strong>Auto-Start:</strong> Widget automatically starts receiving time updates on render</li>
              <li><strong>Action Handler:</strong> clock_tick action registered and documented</li>
              <li><strong>SSE Stream:</strong> Default stream ID is "{streamId}"</li>
            </ul>
          </div>

          <div style={{marginBottom:12}} className="sse-controls">
            <label>Stream ID: </label>
            <input 
              value={streamId} 
              onChange={e => setStreamId(e.target.value)}
              placeholder="e.g., default-stream"
              disabled={connected}
            />
            <div className="sse-button-group">
              {!connected ? (
                <button onClick={connect}>Connect</button>
              ) : (
                <button onClick={disconnect} style={{backgroundColor: '#ff6b6b'}}>Disconnect</button>
              )}
              <button onClick={startServerClock}>Start Clock</button>
              <button onClick={stopServerClock}>Stop Clock</button>
            </div>
          </div>

          <div style={{marginTop:8}} className="sse-widget-area">
            <h3>Live Clock Display</h3>
            <div data-widget-id="clock-widget" className="sse-clock-widget">
              <div className="sse-clock-main">{timeLocal ?? '—'}</div>
              {timeIso && <div className="sse-clock-sub">{timeIso}</div>}
              {!connected && <div className="sse-clock-status">Not connected</div>}
              {connected && <div className="sse-clock-status">● Connected</div>}
            </div>
          </div>
        </div>

        <div className="sse-right" style={{borderLeft: '1px solid #e0e0e0', paddingLeft: 16}}>
          <h3>Event Log</h3>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '0.85em',
            height: '400px',
            overflowY: 'auto',
            backgroundColor: '#f5f5f5',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}>
            {logs.length === 0 ? (
              <div style={{color: '#999'}}>Events will appear here...</div>
            ) : (
              <div>
                {logs.map((log, i) => (
                  <div key={i} style={{color: log.includes('✓') ? '#2ecc71' : log.includes('✗') ? '#e74c3c' : '#333', marginBottom: '2px'}}>
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SseClockPage;
