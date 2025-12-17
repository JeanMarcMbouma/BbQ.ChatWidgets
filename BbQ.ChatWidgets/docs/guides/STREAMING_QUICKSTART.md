This quickstart has been consolidated into the main documentation. See `../../../docs/GETTING_STARTED.md` and `../../../docs/INDEX.md`.
# Streaming Endpoints Quick Start

Get started with real-time streaming chat in 5 minutes.

## What You Get

- ?? Real-time AI responses (streamed, not batched)
- ?? Progressive content display (users see text appearing)
- ?? Automatic triage agent support
- ? Full widget support
- ?? Simple event-driven API

## Backend: Zero Configuration!

Streaming endpoints are automatically available:

```csharp
// Program.cs
app.MapBbQChatEndpoints(); // ? Includes /stream/message and /stream/agent
```

**Done!** Your backend now supports:
- `POST /api/chat/stream/message` - Stream responses
- `POST /api/chat/stream/agent` - Stream with triage routing

## Frontend: React Hook (Easiest)

### 1. Import

```typescript
import { useStreamingChat, type StreamChatTurn } from '@bbq/chatwidgets';
```

### 2. Use the Hook

```typescript
function ChatComponent() {
  const { 
    isStreaming, 
    content, 
    widgets, 
    error,
    streamMessage 
  } = useStreamingChat();

  return (
    <div>
      {/* Display streaming content */}
      <div className="response">
        <p>{content}</p>
        {widgets.map((w, i) => <WidgetRenderer key={i} widget={w} />)}
      </div>

      {/* Error message */}
      {error && <div className="error">{error}</div>}

      {/* Send button */}
      <input
        type="text"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !isStreaming) {
            streamMessage(e.currentTarget.value, 'my-thread-id');
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

### 3. Done! ?

That's it! You now have real-time streaming chat.

## Frontend: Class-Based (Advanced)

### 1. Create Client

```typescript
import { StreamingChatClient } from '@bbq/chatwidgets';

const client = new StreamingChatClient('/api/chat');
```

### 2. Stream Message

```typescript
await client.streamMessage('Tell me a story', 'my-thread-id', {
  onEvent: (turn) => {
    // Called on each event (intermediate updates)
    console.log('Content so far:', turn.content);
    document.getElementById('response').textContent = turn.content;
  },
  
  onComplete: (turn) => {
    // Called when done (final response with widgets)
    console.log('Final response:', turn);
    renderWidgets(turn.widgets);
  },
  
  onError: (error) => {
    // Called on error
    console.error('Stream failed:', error);
  },
  
  onClose: () => {
    // Called when stream closes
    console.log('Stream closed');
  }
});
```

## Simple Example

### Just React, Nothing Else

```typescript
import { useStreamingChat } from '@bbq/chatwidgets';

export function SimpleChat() {
  const { isStreaming, content, streamMessage } = useStreamingChat();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <div style={{ border: '1px solid #ccc', padding: '20px', minHeight: '200px' }}>
        {content}
      </div>
      
      <input
        ref={inputRef}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !isStreaming) {
            streamMessage(inputRef.current?.value || '');
            inputRef.current!.value = '';
          }
        }}
        disabled={isStreaming}
        placeholder="Ask anything..."
      />
    </div>
  );
}
```

## Comparison: Before vs After

### Before (Non-Streaming)

```
User types: "Tell me a story"
         ?
Wait 5 seconds...
         ?
Complete response appears all at once
User sees: "Once upon a time in a digital..."
```

### After (Streaming)

```
User types: "Tell me a story"
         ?
Response starts immediately!
         ?
0.5s: "Once"
1.0s: "Once upon"
1.5s: "Once upon a"
2.0s: "Once upon a time"
... (appears letter by letter)
5.0s: "Once upon a time in a digital realm..."
```

**Result**: Same text, but user sees it appearing in real-time! ?

## Common Patterns

### Pattern 1: Real-Time Search Results

```typescript
const { content, widgets, streamMessage } = useStreamingChat();

async function search(query: string) {
  await streamMessage(`Search for: ${query}`);
  // Content updates as server streams search results
  // Widgets appear when search completes
}
```

### Pattern 2: Multi-Step Process

```typescript
async function workflow() {
  // Step 1: Initial greeting
  await streamMessage('Start workflow');
  
  // Step 2: User clicks button (renders from widgets)
  // Step 3: Next message with updated context
  await streamMessage('Continue with selected option');
}
```

### Pattern 3: With Triage Agent

```typescript
import { StreamingChatClient } from '@bbq/chatwidgets';

const client = new StreamingChatClient();

// Automatically routes through triage agent
await client.streamAgentMessage('I need help resetting my password', threadId);
// HelpAgent processes this
// DataQueryAgent would handle data requests
// ActionAgent would handle actions
```

## Troubleshooting

### Nothing Appearing?

Check network tab:
```
? POST /api/chat/stream/message ? 200 OK
? Content-Type: text/event-stream
? Response is streaming...
```

### Widgets Not Showing?

They only appear after streaming completes:
```typescript
onEvent: (turn) => {
  // widgets is empty here
  console.log(turn.widgets); // []
},
onComplete: (turn) => {
  // widgets available here
  console.log(turn.widgets); // [ButtonWidget, ...]
}
```

### Stream Cuts Off?

Close EventSource manually:
```typescript
const client = new StreamingChatClient();
// ...
client.close(); // Stop listening

// Or wait for onComplete
```

## Advanced: Custom Error Handling

```typescript
function useStreamingChatWithRetry() {
  const client = new StreamingChatClient();
  const [retries, setRetries] = useState(0);

  const streamMessage = async (message: string) => {
    try {
      await client.streamMessage(message, undefined, {
        onError: async (error) => {
          if (retries < 3) {
            setRetries(retries + 1);
            await new Promise(r => setTimeout(r, 1000 * retries));
            streamMessage(message); // Retry
          }
        }
      });
    } catch (err) {
      console.error('Failed after retries:', err);
    }
  };

  return { streamMessage };
}
```

## Performance Tip: Debounce Updates

For long responses, debounce UI updates:

```typescript
import { useMemo } from 'react';

function useStreamingChatWithDebounce() {
  const { isStreaming, content: rawContent, ...rest } = useStreamingChat();
  const [content, setContent] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setContent(rawContent);
    }, 50); // Debounce 50ms

    return () => clearTimeout(timer);
  }, [rawContent]);

  return { isStreaming, content, ...rest };
}
```

## Next: Deploy to Production

Streaming works the same way in production!

```bash
# Backend
dotnet publish

# Frontend  
npm run build
# Serves from /api/chat/stream/* automatically
```

## What's Next?

- ?? **[Full Streaming Guide](guides/STREAMING_ENDPOINTS.md)** - Advanced usage
- ?? **[Triage Agent Guide](guides/TRIAGE_AGENT.md)** - Smart routing
- ?? **[Custom Widgets](guides/CUSTOM_WIDGETS.md)** - Build custom widgets
- ?? **[Testing](guides/TESTING.md)** - Test your streams

## Real-World Example: AI Chat App

```typescript
import { useStreamingChat } from '@bbq/chatwidgets';
import { useRef, useEffect } from 'react';

export function AIChatApp() {
  const { isStreaming, content, widgets, error, streamMessage } = useStreamingChat();
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [content]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Chat History */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <div>
          <p><strong>You:</strong> What's the weather?</p>
          <p><strong>AI:</strong> {content}</p>
          {widgets.map((w, i) => <WidgetRenderer key={i} widget={w} />)}
          <div ref={endRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{ padding: '20px', borderTop: '1px solid #ccc' }}>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <input
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isStreaming) {
              streamMessage(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
          disabled={isStreaming}
          placeholder={isStreaming ? 'AI is thinking...' : 'Ask me anything...'}
          style={{ width: '100%', padding: '10px' }}
        />
      </div>
    </div>
  );
}
```

## That's It!

You now have:
- ? Real-time streaming responses
- ? Auto-rendering widgets
- ? Error handling
- ? Full TypeScript support
- ? Production-ready code

**Happy streaming!** ??

---

**Questions?** See the [full guide](guides/STREAMING_ENDPOINTS.md) or check [examples](../examples/).
