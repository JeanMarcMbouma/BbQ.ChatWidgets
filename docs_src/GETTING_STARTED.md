# Getting Started

This guide walks you through the steps to integrate BbQ.ChatWidgets into your application, covering both the .NET backend and the JavaScript frontend.

## Prerequisites

- **.NET 8 SDK** or later.
- **Node.js 20** or later (for the frontend components).
- An API key for an AI provider (e.g., OpenAI, Azure OpenAI) supported by `Microsoft.Extensions.AI`.

## 1. Backend Setup (.NET)

### Install the Package

Add the BbQ.ChatWidgets NuGet package to your ASP.NET Core project:

```powershell
dotnet add package BbQ.ChatWidgets
```

### Register Services and Endpoints

In your `Program.cs`, configure the chat client and register the BbQ services. It is crucial to use `ChatClientBuilder` with `.UseFunctionInvocation()` to allow the LLM to use the widget tools.

```csharp
using Microsoft.Extensions.AI;
using BbQ.ChatWidgets.Extensions;

var builder = WebApplication.CreateBuilder(args);

// 1. Configure your underlying AI service
IChatClient openaiClient = new OpenAI.Chat.ChatClient(
    modelId: "gpt-4o-mini", 
    apiKey: builder.Configuration["OpenAI:ApiKey"]
).AsIChatClient();

// 2. Wrap it with function invocation support
IChatClient chatClient = new ChatClientBuilder(openaiClient)
    .UseFunctionInvocation()
    .Build();

// 3. Register BbQ ChatWidgets
builder.Services.AddBbQChatWidgets(options =>
{
    options.ChatClientFactory = _ => chatClient;
});

var app = builder.Build();

// 4. Map the API endpoints (/api/chat/message, /api/chat/action, etc.)
app.MapBbQChatEndpoints();

app.Run();
```

## 2. Frontend Setup (JavaScript/TypeScript)

### Install the Package

Install the `@bbq-chat/widgets` npm package:

```bash
npm install @bbq-chat/widgets
```

### Basic Usage

In your frontend application, you can now interact with the backend endpoints. Here is a simple example using `fetch`:

```javascript
async function sendMessage(text) {
    const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: text,
            threadId: "user-session-123" // Optional: for conversation history
        })
    });

    const turn = await response.json();
    console.log("AI Response:", turn.content);
    console.log("Widgets to render:", turn.widgets);
}
```

## 3. Rendering Widgets

To render the widgets returned by the server, use the `WidgetManager` from the npm package.

```javascript
import { WidgetManager } from '@bbq-chat/widgets';

// Initialize the manager
const manager = new WidgetManager();

// Render widgets into a container
const container = document.getElementById('chat-widgets');
turn.widgets.forEach(widget => {
    manager.render(widget, container);
});
```

## Next Steps

- **[Architecture Overview](ARCHITECTURE.md)**: Learn about the internal flow and major components.
- **[Widget Catalog](widgets/WIDGET_TYPES.md)**: See all available built-in widgets.
- **[Custom Widgets](guides/CUSTOM_WIDGETS.md)**: Learn how to build your own interactive components.
- **[Action Handlers](guides/CUSTOM_ACTION_HANDLERS.md)**: Handle user interactions with widgets on the server.
