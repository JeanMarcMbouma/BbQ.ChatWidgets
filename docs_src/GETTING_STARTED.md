# Getting Started

This quick guide walks you through the minimum steps to wire up BbQ.ChatWidgets in your application.

## 1. Install the .NET package

```powershell
dotnet add package BbQ.ChatWidgets
```

## 2. Register the services

Add the shared services and endpoint mappings inside your `Program.cs`:

```csharp
using Microsoft.Extensions.AI;
using BbQ.ChatWidgets.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Build an IChatClient and enable function invocation so widgets/tools work.
IChatClient openaiClient =
  new OpenAI.Chat.ChatClient(modelId: "gpt-4o-mini", apiKey: "your-api-key")
    .AsIChatClient();

IChatClient chatClient = new ChatClientBuilder(openaiClient)
  .UseFunctionInvocation()
  .Build();

builder.Services.AddBbQChatWidgets(options =>
{
  options.ChatClientFactory = _ => chatClient;
});

var app = builder.Build();
app.MapBbQChatEndpoints();
app.Run();
```

## 3. Send a message from JavaScript

```javascript
const response = await fetch('/api/chat/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    threadId: null,
    message: 'Show me a theme switcher example'
  })
});
```

## 4. Explore the rest of the docs

See the other sections for architecture, custom widgets, and how to extend the platform.
