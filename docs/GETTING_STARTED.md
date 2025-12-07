# Getting Started with BbQ.ChatWidgets

Get up and running with BbQ.ChatWidgets in **5 minutes**!

## What is BbQ.ChatWidgets?

BbQ.ChatWidgets is a .NET library that makes it easy to build interactive chat interfaces with embedded UI widgets. It integrates with AI chat clients (like OpenAI) to enable:

- **AI-powered conversations** with GPT, Claude, etc.
- **Interactive widgets** (buttons, forms, cards) embedded in chat responses
- **Widget actions** handling (clicks, form submissions, etc.)
- **Multi-turn conversations** with thread management
- **Easy customization** for your specific needs

## Installation

### 1. Install the NuGet Package

```bash
dotnet add package BbQ.ChatWidgets
```

### 2. Register Services

In your `Program.cs`:

```csharp
using BbQ.ChatWidgets.Extensions;
using Microsoft.Extensions.AI;

var builder = WebApplication.CreateBuilder(args);

// Add your chat client (OpenAI example)
var openaiClient = new OpenAI.Chat.ChatClient(
    modelId: "gpt-4o-mini",
    apiKey: builder.Configuration["OpenAI:ApiKey"]
).AsIChatClient();

var chatClient = new ChatClientBuilder(openaiClient)
    .UseFunctionInvocation()
    .Build();

// Register BbQ.ChatWidgets
builder.Services.AddBbQChatWidgets(options =>
{
    options.RoutePrefix = "/api/chat";
    options.ChatClientFactory = sp => chatClient;
});

var app = builder.Build();

// Map endpoints
app.MapBbQChatEndpoints();

app.Run();
```

### 3. Create API Endpoint

The endpoints are automatically mapped. You now have:

```
POST /api/chat/message      - Send user messages
POST /api/chat/action       - Handle widget actions
```

## Send Your First Message

### Client-side (JavaScript/TypeScript)

```javascript
// Send a message
const response = await fetch('/api/chat/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        message: "What can you help me with?",
        threadId: null  // null creates a new thread
    })
});

const data = await response.json();
console.log('Response:', data.content);
console.log('Widgets:', data.widgets);
```

The response will look like:

```json
{
    "role": "assistant",
    "content": "I can help you with many tasks!",
    "widgets": [
        {
            "type": "button",
            "label": "Get Started",
            "action": "start_onboarding"
        }
    ],
    "threadId": "abc123..."
}
```

## Handle Widget Actions

When a user clicks a widget button or submits a form:

```javascript
// Handle button click
const response = await fetch('/api/chat/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        action: "start_onboarding",
        payload: { /* form data if any */ },
        threadId: "abc123..."
    })
});

const data = await response.json();
console.log('Next message:', data.content);
console.log('New widgets:', data.widgets);
```

## Available Widgets

BbQ.ChatWidgets comes with 7 widget types:

### 1. Button Widget
```json
{
    "type": "button",
    "label": "Click Me",
    "action": "action_id"
}
```

### 2. Card Widget
```json
{
    "type": "card",
    "label": "View Details",
    "action": "view_product",
    "title": "Product Name",
    "description": "Product description",
    "imageUrl": "https://..."
}
```

### 3. Input Widget
```json
{
    "type": "input",
    "label": "Enter name",
    "action": "submit_name",
    "placeholder": "Your name",
    "maxLength": 100
}
```

### 4. Dropdown Widget
```json
{
    "type": "dropdown",
    "label": "Select option",
    "action": "select_option",
    "options": ["Option 1", "Option 2", "Option 3"]
}
```

### 5. Slider Widget
```json
{
    "type": "slider",
    "label": "Volume",
    "action": "set_volume",
    "min": 0,
    "max": 100,
    "step": 5
}
```

### 6. Toggle Widget
```json
{
    "type": "toggle",
    "label": "Enable notifications",
    "action": "toggle_notifications",
    "defaultValue": true
}
```

### 7. File Upload Widget
```json
{
    "type": "fileupload",
    "label": "Upload document",
    "action": "upload_file",
    "accept": ".pdf,.docx",
    "maxBytes": 5000000
}
```

## Next Steps

- **Learn more**: Read the [Architecture Guide](ARCHITECTURE.md)
- **Configure**: Check [Configuration Guide](../guides/CONFIGURATION.md)
- **Customize**: See [Custom Widgets Guide](../guides/CUSTOM_WIDGETS.md)
- **API Docs**: Check [API Reference](../api/README.md)

## Common Tasks

### "How do I customize widget behavior?"
👉 Read [Custom Action Handlers](../guides/CUSTOM_ACTION_HANDLERS.md)

### "How do I add my own widget types?"
👉 Read [Custom Widgets](../guides/CUSTOM_WIDGETS.md)

### "How do I extend AI capabilities?"
👉 Read [Custom AI Tools](../guides/CUSTOM_AI_TOOLS.md)

### "How do I manage long conversations?"
👉 Read [Context Windows](../design/CONTEXT_WINDOWS.md)

## Troubleshooting

### "I'm getting serialization errors"
Make sure your `ChatWidget` implementations are properly registered. See [Configuration Guide](../guides/CONFIGURATION.md).

### "Widgets aren't appearing in responses"
Make sure your AI model is configured with widget tools. The `AddBbQChatWidgets()` method handles this automatically.

### "Actions aren't being handled"
Make sure you're sending the correct `action` identifier and `threadId`. Check the response from `/api/chat/message` for the exact widget action IDs.

## Example: Complete Chat Application

See [Basic Example](../examples/BASIC_SETUP.md) for a complete working example with HTML UI.

---

**Ready?** Start with [Installation Guide](../guides/INSTALLATION.md) or jump to [API Reference](../api/README.md).

**Questions?** Open an issue on [GitHub](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets).

**Time taken**: ~5 minutes ⏱️
