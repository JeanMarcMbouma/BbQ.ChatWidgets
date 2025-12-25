# BbQ.ChatWidgets

A compact library of UI chat widgets and helpers for server and client integrations.

This repository ships three distributable packages:

- NuGet: `BbQ.ChatWidgets` (the .NET library: services, renderers, endpoints)
- npm: `@bbq-chat/widgets` (the JavaScript/TypeScript client library: widgets, client helpers)
- npm: `@bbq-chat/widgets-angular` (Angular-native components and services)

> Note: the .NET package no longer bundles the JavaScript client or theme CSS. Install the npm package (or bring your own UI) to render widgets in a browser.

## Quick start (ASP.NET Core)

```csharp
using BbQ.ChatWidgets;

builder.Services.AddBbQChatWidgets(options =>
{
    // configure options (chat client, tools, widgets, etc.)
});

app.MapBbQChatEndpoints();
```

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

## Documentation

- Documentation sources: `docs_src/`
- Contributing guide: `.github/CONTRIBUTING.md`

Build the docs locally (requires DocFX):

```powershell
./docs/generate-docs.ps1
```

Or run DocFX directly:

```powershell
dotnet build BbQ.ChatWidgets/BbQ.ChatWidgets.csproj -c Release
docfx metadata docfx.json
docfx build docfx.json -o docs
```

## Tests

- .NET: `dotnet test`
- JS/TS: `npm test` (run from `Sample/WebApp/ClientApp`)

## License

See `LICENSE`.
