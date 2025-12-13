# BbQ.ChatWidgets

Professional documentation has been consolidated into the `docs/` folder. This repository provides a framework-agnostic widget library for building interactive AI chat UIs.

Quick links:

- Getting started: `docs/GETTING_STARTED.md`
- Architecture: `docs/ARCHITECTURE.md`
- API Reference: `docs/api/README.md`
- Contributing: `CONTRIBUTING.md`

To build API documentation (requires DocFX):

```powershell
dotnet build BbQ.ChatWidgets/BbQ.ChatWidgets.csproj -c Release
docfx metadata docfx.json
docfx build docfx.json
```

If you need the previous markdown content, it has been backed up on the `docs-backup-20251213` branch.
# BbQ.ChatWidgets

BbQ.ChatWidgets is a framework-agnostic widget library for AI chat UIs, built on Microsoft.Extensions.AI.

**Requirements:** Node >= 20, .NET SDK >= 8.0 (use nvm/nvm-windows and official .NET SDK installers).

**Run tests (quick):** .NET: `dotnet test` (repo root or specific project). JavaScript: `npm test` in `Sample/WebApp/ClientApp` (adds vitest script).

## Features

- **JSON contract for widgets** - Define UI widgets in JSON
- **Minimal API endpoints** - Quick setup with automatic endpoints
- **JavaScript client with auto-binding** - Frontend-agnostic widget rendering
- **LLM tool integration** - Seamless AI model integration
- **Localization + theming** - Full i18n and theme support

## Quick Start

```csharp
builder.Services.AddBbQChatWidgets(options =>
{
    options.ChatClientFactory = sp => new OpenAIChatClient("API_KEY");
});
app.MapBbQChatEndpoints();
```

## Documentation

Complete documentation is available in the `/docs` folder:

- **[Getting Started](docs/GETTING_STARTED.md)** - Get up and running in 5 minutes
- **[Master Index](docs/INDEX.md)** - Navigation hub for all documentation
- **[Architecture Guide](docs/ARCHITECTURE.md)** - Understand how it works
- **[Quick Reference](docs/QUICK_REFERENCE.md)** - Find what you need quickly

## Key Concepts

### Core Widgets (7 Types)

| Widget | Purpose | Example |
|--------|---------|---------|
| **Button** | Click actions | Confirm, Cancel, Submit |
| **Card** | Rich content display | Product cards, results |
| **Input** | Text input | Forms, queries |
| **Dropdown** | Selection lists | Options, choices |
| **Slider** | Range selection | Volume, rating |
| **Toggle** | Boolean switches | Settings, flags |
| **File Upload** | File handling | Document upload |

### Architecture Components

```
User -> ASP.NET Core App -> ChatWidgetService
                |
            ChatClient (OpenAI, Claude, etc.)
            + WidgetToolsProvider
            + ThreadService
            + WidgetHintParser
```

## Installation

```bash
dotnet add package BbQ.ChatWidgets
```

## Usage Example

```csharp
// Register services in Program.cs
var builder = WebApplication.CreateBuilder(args);

var openaiClient = new OpenAI.Chat.ChatClient(
    modelId: "gpt-4o-mini",
    apiKey: "your-api-key"
).AsIChatClient();

builder.Services.AddBbQChatWidgets(options =>
{
    options.ChatClientFactory = sp => openaiClient;
});

var app = builder.Build();
app.MapBbQChatEndpoints();
app.Run();
```

Then call from frontend:

```javascript
// Send message
const response = await fetch('/api/chat/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        message: "What can you help me with?",
        threadId: null
    })
});

const data = await response.json();
console.log('Response:', data.content);
console.log('Widgets:', data.widgets);
```

## Learning Paths

### — For Users
1. [Getting Started](docs/GETTING_STARTED.md) (5 min)
2. [Installation Guide](docs/guides/INSTALLATION.md)
3. [Examples](docs/examples/)
4. [API Reference](docs/api/)

### — For Developers
1. [Architecture Guide](docs/ARCHITECTURE.md)
2. [Custom Widgets](docs/guides/CUSTOM_WIDGETS.md)
3. [Custom AI Tools](docs/guides/CUSTOM_AI_TOOLS.md)
4. [API Reference](docs/api/)

### — For Contributors
1. [Development Setup](docs/contributing/DEVELOPMENT.md)
2. [Code Style](docs/contributing/CODE_STYLE.md)
3. [Testing Guide](docs/contributing/TESTING.md)
4. [Documentation Standards](docs/contributing/DOCUMENTATION.md)

## Resources

- **GitHub**: [BbQ.ChatWidgets](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets)
- **NuGet**: [BbQ.ChatWidgets](https://www.nuget.org/packages/BbQ.ChatWidgets/)
- **Issues**: [GitHub Issues](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/issues)
- **Discussions**: [GitHub Discussions](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/discussions)

## License

MIT License - See LICENSE file in root

## Contributing

We welcome contributions! See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for guidelines.

---

**Ready to get started?** [Getting Started Guide](docs/GETTING_STARTED.md)

**Need help?** [Documentation Index](docs/INDEX.md)
