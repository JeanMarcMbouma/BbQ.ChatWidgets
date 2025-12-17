# Basic Setup Example

This example demonstrates the minimal configuration required to get a chat interface with widgets up and running.

## 1. Server-Side (`Program.cs`)

```csharp
using Microsoft.Extensions.AI;
using BbQ.ChatWidgets.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Configure OpenAI (or any other provider)
IChatClient chatClient = new ChatClientBuilder(
    new OpenAI.Chat.ChatClient("gpt-4o-mini", builder.Configuration["OpenAI:ApiKey"]).AsIChatClient()
).UseFunctionInvocation().Build();

// Register BbQ services
builder.Services.AddBbQChatWidgets(options =>
{
    options.ChatClientFactory = _ => chatClient;
});

var app = builder.Build();

// Map endpoints
app.MapBbQChatEndpoints();

app.Run();
```

## 2. Client-Side (HTML + JavaScript)

```html
<!DOCTYPE html>
<html>
<head>
    <title>BbQ Chat</title>
    <link rel="stylesheet" href="/themes/bbq-chat-light.css">
</head>
<body>
    <div id="chat-container">
        <div id="messages"></div>
        <input type="text" id="user-input" placeholder="Type a message...">
        <button onclick="send()">Send</button>
    </div>

    <script type="module">
        import { WidgetManager } from 'https://esm.sh/@bbq-chat/widgets';

        const manager = new WidgetManager();
        const messagesDiv = document.getElementById('messages');

        window.send = async () => {
            const input = document.getElementById('user-input');
            const text = input.value;
            input.value = '';

            // 1. Send message to server
            const response = await fetch('/api/chat/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });

            const turn = await response.json();

            // 2. Display text response
            const msgEl = document.createElement('div');
            msgEl.textContent = turn.content;
            messagesDiv.appendChild(msgEl);

            // 3. Render widgets
            turn.widgets.forEach(widget => {
                manager.render(widget, messagesDiv);
            });
        };
    </script>
</body>
</html>
```

## Request/Response Shape

### Request (`POST /api/chat/message`)
```json
{
  "message": "Show me a button",
  "threadId": "optional-session-id"
}
```

### Response (`ChatTurn`)
```json
{
  "role": "assistant",
  "content": "Here is a button for you:",
  "widgets": [
    {
      "type": "button",
      "data": {
        "label": "Click Me",
        "action": "my_action"
      }
    }
  ],
  "threadId": "optional-session-id"
}
```
