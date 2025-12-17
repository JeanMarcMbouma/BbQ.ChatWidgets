# Getting Started

This quick guide walks you through the minimum steps to wire up BbQ.ChatWidgets in your application.

## 1. Install the .NET package

```powershell
dotnet add package BbQ.ChatWidgets
```

## 2. Register the services

Add the shared services and endpoint mappings inside your `Program.cs`:

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddBbQChatWidgets(options =>
{
    options.ChatClientFactory = sp => new OpenAI.Chat.ChatClient("your-api-key").AsIChatClient();
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
    input: 'Show me a theme switcher example'
  })
});
```

## 4. Explore the rest of the docs

See the other sections for architecture, custom widgets, and how to extend the platform.
