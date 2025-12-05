# BbQ.ChatWidgets

BbQ.ChatWidgets is a framework‑agnostic widget library for AI chat UIs, built on Microsoft.Extensions.AI.

## Features
- JSON contract for widgets
- Minimal API endpoints
- JavaScript client with auto‑binding
- LLM tool integration
- Localisation + theming

## Quick Start
```csharp
builder.Services.AddBbQChatWidgets(options =>
{
    options.ChatClientFactory = sp => new OpenAIChatClient("API_KEY");
});
app.MapBbQChatEndpoints();
```

#### `GettingStarted.md`
Step‑by‑step guide to add BbQ to an ASP.NET Core app.

#### `API.md`
Detailed docs for `ChatTurn`, `ChatWidget`, `IWidgetActionHandler`, `BbQChatClient`.

#### `Theming.md`
CSS contract, theme packs, ThemeSwitcherWidget usage.

