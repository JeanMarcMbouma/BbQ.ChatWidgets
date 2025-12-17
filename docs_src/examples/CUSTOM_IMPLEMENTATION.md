# Custom Implementation: Streaming & SSE

This example illustrates how to use the streaming endpoints and server-pushed widget updates for a highly dynamic chat experience.

## 1. Streaming Chat Responses

Instead of waiting for the full AI response, you can stream it using Server-Sent Events (SSE).

### Client-Side (JavaScript)

```javascript
const response = await fetch('/api/chat/stream/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: "Tell me a long story" })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
        if (line.startsWith('data: ')) {
            const turn = JSON.parse(line.substring(6));
            console.log("Streamed content:", turn.content);
            
            if (!turn.isDelta) {
                console.log("Final widgets:", turn.widgets);
            }
        }
    }
}
```

## 2. Server-Pushed Widget Updates

You can push widget updates to the client independently of the chat stream. This is useful for long-running tasks or real-time data updates (e.g., a progress bar or a live chart).

### Client-Side: Subscribing to a Stream

```javascript
const streamId = "my-task-123";
const eventSource = new EventSource(`/api/chat/widgets/streams/${streamId}/events`);

eventSource.onmessage = (event) => {
    const widget = JSON.parse(event.data);
    console.log("Received server-pushed widget:", widget);
    // Update the UI with the new widget state
};
```

### Server-Side: Publishing an Update

You can publish updates from anywhere in your backend using the `IWidgetSseService`.

```csharp
public class MyBackgroundService(IWidgetSseService sseService)
{
    public async Task UpdateProgress(string streamId, int progress)
    {
        var widget = new ProgressBarWidget("Processing...", progress);
        await sseService.PublishAsync(streamId, widget);
    }
}
```

## Summary of Endpoints

- **`POST /api/chat/stream/message`**: Initiates a streaming chat response.
- **`GET /api/chat/widgets/streams/{id}/events`**: Subscribes to a specific widget update stream.
- **`POST /api/chat/widgets/streams/{id}/events`**: Publishes a widget to a specific stream (can also be done via the `IWidgetSseService` in C#).
