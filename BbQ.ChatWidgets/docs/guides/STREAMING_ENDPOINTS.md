# Streaming Endpoints Guide

Real-time chat responses using Server-Sent Events (SSE) for progressively delivered AI responses with widgets.

## Overview

Streaming endpoints allow you to receive chat responses in real-time, with content delivered incrementally as the AI generates it. This provides:

- **Better UX** - Users see responses appearing in real-time
- **Lower Latency Perception** - Response starts before complete
- **Reduced Bandwidth** - Progressive updates instead of waiting for full response
- **Widget Support** - Widgets still rendered inline with streaming content

## Available Streaming Endpoints

### 1. Stream Message Endpoint
Streams AI responses to user messages.

**Endpoint**: `POST {routePrefix}/stream/message`  
**Content-Type**: `text/event-stream`  
**Default Route**: `POST /api/chat/stream/message`

**Request**:
```json
{
  "message": "Tell me a story about AI",
  "threadId": "optional-thread-123"
}
```

**Response Format** (Server-Sent Events):
```
data: {"role":"assistant","content":"Once upon","widgets":[],"threadId":"abc-123","isDelta":true}

data: {"role":"assistant","content":"Once upon a time","widgets":[],"threadId":"abc-123","isDelta":true}

data: {"role":"assistant","content":"Once upon a time, in a digital realm","widgets":[],"threadId":"abc-123","isDelta":true}

data: {"role":"assistant","content":"Once upon a time, in a digital realm...","widgets":[{"type":"button","label":"Continue","action":"continue_story"}],"threadId":"abc-123","isDelta":false}
```

**Features**:
- Each event contains a `StreamChatTurn` with incremental content
- `isDelta: true` indicates an intermediate update
- `isDelta: false` indicates final response with all widgets
- Widgets appear in final event only

### 2. Stream Agent Endpoint
Streams responses through triage agent (when registered).

**Endpoint**: `POST {routePrefix}/stream/agent`  
**Content-Type**: `text/event-stream`  
**Default Route**: `POST /api/chat/stream/agent`

**Request**:
```json
{
  "message": "I need help with my account",
  "threadId": "optional-thread-123"
}
```

**Response** (same format as stream/message, but routed through triage agent):
```
data: {"role":"assistant","content":"I'm here to help","widgets":[],"threadId":"abc-123","isDelta":true}

data: {"role":"assistant","content":"I'm here to help. Let me check your account status...","widgets":[],"threadId":"abc-123","isDelta":true}

data: {"role":"assistant","content":"I found your account. What would you like to do?","widgets":[{"type":"dropdown","label":"Options","action":"select_action","options":["View details","Reset password","Update email"]}],"threadId":"abc-123","isDelta":false}
```

**Features**:
- Uses registered triage agent for intent classification
- Falls back to `AgentDelegate` if no triage agent
- Automatic agent routing based on request classification
- User message automatically stored in metadata

## Response Format: Server-Sent Events (SSE)

Each event follows the standard SSE format:

```
data: {JSON}\n\n
```

### StreamChatTurn Structure

```csharp
public record StreamChatTurn(
    ChatRole Role,           // "assistant"
    string Content,          // Incremental or complete text
    string ThreadId,         // Conversation thread ID
    bool IsDelta = false     // true: partial, false: final
)
```

### Example Event Parsing (JavaScript)

```javascript
const eventSource = new EventSource('/api/chat/stream/message');

eventSource.addEventListener('message', (event) => {
  const turn = JSON.parse(event.data);
  
  console.log('Content:', turn.content);
  console.log('Is Final:', !turn.isDelta);
  console.log('Widgets:', turn.widgets);
  
  if (!turn.isDelta) {
    // Final response received
    renderWidgets(turn.widgets);
    eventSource.close();
  } else {
    // Intermediate update
    updateContent(turn.content);
  }
});

eventSource.addEventListener('error', (event) => {
  console.error('Stream error:', event);
  eventSource.close();
});
```

## Client Implementation

### React Hook with Streaming

```typescript
import { useEffect, useRef, useCallback } from 'react';
import type { ChatTurn } from '@bbq/chatwidgets';

interface UseStreamingChat {
  isStreaming: boolean;
  currentContent: string;
  currentWidgets: ChatWidget[];
  error: string | null;
  sendMessage: (message: string, threadId?: string) => void;
}

export function useStreamingChat(): UseStreamingChat {
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentContent, setCurrentContent] = useState('');
  const [currentWidgets, setCurrentWidgets] = useState<ChatWidget[]>([]);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const sendMessage = useCallback((message: string, threadId?: string) => {
    setIsStreaming(true);
    setCurrentContent('');
    setCurrentWidgets([]);
    setError(null);

    // Close previous connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(
      `/api/chat/stream/message?message=${encodeURIComponent(message)}${threadId ? `&threadId=${threadId}` : ''}`
    );

    eventSourceRef.current = eventSource;

    eventSource.addEventListener('message', (event) => {
      try {
        const turn = JSON.parse(event.data) as StreamChatTurn;
        
        setCurrentContent(turn.content);
        
        if (!turn.isDelta) {
          // Final response
          if (turn.widgets) {
            setCurrentWidgets(turn.widgets);
          }
          eventSource.close();
          setIsStreaming(false);
        }
      } catch (err) {
        setError(`Failed to parse response: ${err}`);
        eventSource.close();
        setIsStreaming(false);
      }
    });

    eventSource.addEventListener('error', (event) => {
      setError('Stream connection error');
      eventSource.close();
      setIsStreaming(false);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return {
    isStreaming,
    currentContent,
    currentWidgets,
    error,
    sendMessage
  };
}
```

### Using the Hook

```typescript
function ChatComponent() {
  const { isStreaming, currentContent, currentWidgets, error, sendMessage } = useStreamingChat();

  return (
    <div className="chat">
      <div className="messages">
        <div className="message assistant">
          <p>{currentContent}</p>
          {currentWidgets.length > 0 && (
            <div className="widgets">
              {currentWidgets.map((widget, i) => (
                <WidgetRenderer key={i} widget={widget} />
              ))}
            </div>
          )}
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      
      <input
        type="text"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !isStreaming) {
            sendMessage(e.currentTarget.value);
            e.currentTarget.value = '';
          }
        }}
        disabled={isStreaming}
        placeholder="Type message..."
      />
    </div>
  );
}
```

## Comparison: Non-Streaming vs. Streaming

### Non-Streaming (Traditional)

```
POST /api/chat/message
?
[Wait for AI to complete entire response]
?
200 OK with complete ChatTurn
?
Display entire response at once
```

**Pros**: Simple, complete data at once  
**Cons**: User waits for full response, high latency perception

### Streaming (SSE)

```
POST /api/chat/stream/message
?
Start streaming immediately
?
Event 1: "Hello" (isDelta: true)
Event 2: "Hello there" (isDelta: true)
Event 3: "Hello there! I'm..." (isDelta: true)
...
Event N: Complete response + widgets (isDelta: false)
?
Display progressively as events arrive
```

**Pros**: Real-time experience, lower latency perception, progressive display  
**Cons**: More complex client, SSE instead of traditional request/response

## Best Practices

### Do's ?

- Use streaming for long responses (articles, stories, etc.)
- Display content as it arrives for better UX
- Cache final response for the thread
- Handle disconnections gracefully
- Add loading indicators while streaming
- Collect final widgets after streaming completes
- Use appropriate threadId to maintain conversation

### Don'ts ?

- Don't close the connection before final event
- Don't ignore `isDelta` flag
- Don't render widgets until `isDelta: false`
- Don't assume all text is final (it's partial until final event)
- Don't forget to handle errors and disconnections
- Don't make multiple simultaneous streams to same threadId

## Error Handling

### Stream Errors

```javascript
eventSource.addEventListener('error', (event) => {
  if (event.readyState === EventSource.CLOSED) {
    console.log('Stream closed normally');
  } else {
    console.error('Stream error:', event);
    // Reconnect with backoff
    setTimeout(() => retryStream(), 1000);
  }
});
```

### Payload Errors

Errors are sent as SSE events:

```
data: {"error":"Invalid message"}
```

```javascript
eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  
  if (data.error) {
    console.error('API Error:', data.error);
    eventSource.close();
  }
});
```

## Performance Tips

1. **Progressive Rendering** - Update UI on each event, don't wait
2. **Debounce Updates** - Don't re-render too frequently (50ms debounce)
3. **Limit Context** - Server limits to last 10 turns automatically
4. **Connection Pooling** - SSE maintains persistent connection
5. **Graceful Degradation** - Fall back to polling if SSE unavailable

## Browser Compatibility

**Supported**:
- Chrome 6+
- Firefox 6+
- Safari 5.1+
- Edge 14+
- IE 11 (requires polyfill)

**Polyfill for IE 11**:
```html
<script src="https://cdn.jsdelivr.net/npm/event-source-polyfill@1.0.31/dist/eventsource.min.js"></script>
```

## Examples

### Example 1: Basic Streaming

```javascript
async function streamMessage(message) {
  const eventSource = new EventSource(
    `/api/chat/stream/message?message=${encodeURIComponent(message)}`
  );

  let content = '';

  eventSource.addEventListener('message', (event) => {
    const turn = JSON.parse(event.data);
    content = turn.content;
    
    // Update UI
    document.getElementById('response').textContent = content;

    if (!turn.isDelta) {
      eventSource.close();
      console.log('Complete response:', content);
    }
  });
}
```

### Example 2: With Triage Agent

```javascript
async function streamWithTriageAgent(message, threadId) {
  const response = await fetch(`/api/chat/stream/agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, threadId })
  });

  const eventSource = new EventSource(response.url);

  eventSource.addEventListener('message', (event) => {
    const turn = JSON.parse(event.data);
    console.log('Agent routing:', turn); // See classification and routing
  });
}
```

### Example 3: Retry with Exponential Backoff

```javascript
async function streamWithRetry(message, maxRetries = 3) {
  let retries = 0;

  function attempt() {
    const eventSource = new EventSource(
      `/api/chat/stream/message?message=${encodeURIComponent(message)}`
    );

    eventSource.addEventListener('error', () => {
      eventSource.close();
      
      if (retries < maxRetries) {
        retries++;
        const delay = Math.pow(2, retries) * 1000; // Exponential backoff
        console.log(`Retry ${retries} after ${delay}ms`);
        setTimeout(attempt, delay);
      } else {
        console.error('Max retries reached');
      }
    });
  }

  attempt();
}
```

## Testing Streaming Endpoints

### With curl

```bash
# Stream message
curl -N -X POST http://localhost:5000/api/chat/stream/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Tell me a story","threadId":"test-123"}'

# Stream with agent
curl -N -X POST http://localhost:5000/api/chat/stream/agent \
  -H "Content-Type: application/json" \
  -d '{"message":"I need help","threadId":"test-123"}'
```

### With JavaScript

```javascript
// Test streaming
const eventSource = new EventSource(
  '/api/chat/stream/message?message=hello&threadId=test'
);

eventSource.addEventListener('message', (e) => {
  console.log('Event:', JSON.parse(e.data));
});
```

## Common Issues

### Issue: No events received

**Solution**: 
- Check CORS headers
- Ensure request has correct Content-Type
- Verify threadId is valid
- Check network tab for 200 status code

### Issue: Connection closing prematurely

**Solution**:
- Don't close EventSource manually
- Wait for `isDelta: false` event
- Check for errors in browser console
- Verify server is sending events

### Issue: Widgets not rendering

**Solution**:
- Wait for final event with `isDelta: false`
- Check widgets array is populated
- Verify widget renderer is called
- Check widget types are supported

## API Reference

### Headers

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Type` | `text/event-stream` | Response is SSE stream |
| `Cache-Control` | `no-cache` | Don't cache stream |
| `Connection` | `keep-alive` | Keep connection open |

### DTOs

```csharp
public record UserMessageDto(
    string Message,
    string? ThreadId = null
);

public record StreamChatTurn(
    ChatRole Role,
    string Content,
    string ThreadId,
    bool IsDelta = false
) : ChatTurn(Role, Content, [], ThreadId);
```

## Next Steps

- **[Non-Streaming Endpoints](../guides/API.md)** - Traditional request/response
- **[Triage Agent Integration](../guides/TRIAGE_AGENT.md)** - Smart routing
- **[Custom Handlers](../guides/CUSTOM_ACTION_HANDLERS.md)** - Handle widget actions
- **[Example Implementations](../examples/)** - Real-world usage

---

**Back to:** [Guides](README.md) | [Documentation Index](../INDEX.md)
