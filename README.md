# BbQ.ChatWidgets

[![NuGet Version](https://img.shields.io/nuget/v/BbQ.ChatWidgets.svg)](https://www.nuget.org/packages/BbQ.ChatWidgets/)
[![npm Version](https://img.shields.io/npm/v/@bbq-chat/widgets.svg)](https://www.npmjs.com/package/@bbq-chat/widgets)

A compact library of UI chat widgets and helpers for server and client integrations.

This repository ships three distributable packages:

- NuGet: `BbQ.ChatWidgets` (the .NET library: services, renderers, endpoints)
- npm: `@bbq-chat/widgets` (the JavaScript/TypeScript client library: widgets, client helpers)
- npm: `@bbq-chat/widgets-angular` (Angular-native components and services)

> Note: the .NET package no longer bundles the JavaScript client or theme CSS. Install the npm package (or bring your own UI) to render widgets in a browser.

## 🚀 30-Second Demos

Get a working button widget in under 30 seconds!

### C# / .NET (Server)

```csharp
using Microsoft.Extensions.AI;
using BbQ.ChatWidgets.Extensions;

var builder = WebApplication.CreateBuilder(args);

// 1. Create chat client with function invocation
var apiKey = builder.Configuration["OpenAI:ApiKey"] 
    ?? throw new InvalidOperationException("OpenAI:ApiKey not configured");
    
IChatClient chatClient = new ChatClientBuilder(
    new OpenAI.Chat.ChatClient("gpt-4o-mini", apiKey).AsIChatClient())
    .UseFunctionInvocation()
    .Build();

// 2. Register BbQ services
builder.Services.AddBbQChatWidgets(options => 
    options.ChatClientFactory = _ => chatClient);

var app = builder.Build();

// 3. Map endpoints
app.MapBbQChatEndpoints();
app.Run();
```

### JavaScript / TypeScript (Client)

```typescript
import { WidgetManager } from '@bbq-chat/widgets';

// 1. Send a message
const response = await fetch('/api/chat/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Show me a button', threadId: 'demo-123' })
});

const turn = await response.json();

// 2. Render widgets
const manager = new WidgetManager();
turn.widgets?.forEach(widget => 
    manager.render(widget, document.getElementById('chat-container'))
);
```

### Angular (Client)

```typescript
import { Component } from '@angular/core';
import { ChatWidgetsModule } from '@bbq-chat/widgets-angular';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [ChatWidgetsModule],
  template: `
    <bbq-chat-widget 
      [apiEndpoint]="'/api/chat'"
      [threadId]="'demo-123'">
    </bbq-chat-widget>
  `
})
export class ChatComponent { }
```

📚 **[Full Getting Started Guide →](docs_src/GETTING_STARTED.md)** | **[Widget Gallery →](docs_src/widgets/GALLERY.md)** | **[Integration Paths →](docs_src/INTEGRATION_PATHS.md)**

## Features

- **Interactive Chat Widgets**: Buttons, forms, cards, dropdowns, sliders, toggles, file uploads, and more
- **Server-Driven UI**: The LLM decides which widgets to show based on conversation context
- **Automatic Chat History Summarization**: Efficiently manages long conversations by summarizing older turns
- **SSE Support**: Real-time server-pushed widget updates
- **Triage Agents**: Route conversations to specialized agents based on classification
- **Type-Safe Widget Actions**: Strongly-typed handlers for widget interactions
- **Extensible Architecture**: Swap out components via dependency injection

## Install

### NuGet (.NET)

```powershell
dotnet add [YOUR_PROJECT] package BbQ.ChatWidgets
```

### npm (JS/TS client + themes)

```bash
npm install @bbq-chat/widgets
```

### npm (Angular native components)

```bash
npm install @bbq-chat/widgets-angular @bbq-chat/widgets
```

## 📖 Documentation

- **[Getting Started](docs_src/GETTING_STARTED.md)** - Complete setup guide
- **[Widget Gallery](docs_src/widgets/GALLERY.md)** - Visual showcase of all widgets
- **[Integration Paths](docs_src/INTEGRATION_PATHS.md)** - Choose the right approach for your stack
- **[Use Cases & Tutorials](docs_src/examples/USE_CASES.md)** - Step-by-step scenarios
- **[API Reference](docs/index.html)** - Generated API docs
- **[Contributing Guide](.github/CONTRIBUTING.md)** - How to contribute

### Build Documentation Locally

```powershell
./docs/generate-docs.ps1
```

## 🧪 Tests

- .NET: `dotnet test`
- JS/TS: `npm test` (run from `Sample/WebApp/ClientApp`)

## 📋 Changelog

See **[CHANGELOG.md](CHANGELOG.md)** for version history and release notes.

## 📄 License

See `LICENSE`.
