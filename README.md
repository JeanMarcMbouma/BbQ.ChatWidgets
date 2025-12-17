# BbQ.ChatWidgets

A compact library of UI chat widgets and helpers for server and client integrations.

This repository ships two distributable packages:

- NuGet: `BbQ.ChatWidgets` (the .NET library: services, renderers, endpoints)
- npm: `@bbq-chat/widgets` (the JS/TS client library)

## Quick start (ASP.NET Core)

```csharp
using BbQ.ChatWidgets;

builder.Services.AddBbQChatWidgets(options =>
{
    // configure options (chat client, tools, widgets, etc.)
});

app.MapBbQChatEndpoints();
```

## Install

NuGet:

```powershell
dotnet add [YOUR_PROJECT] package BbQ.ChatWidgets
```

npm:

```bash
npm install @bbq-chat/widgets
```

## Documentation

- Documentation sources: [docs_src/index.md](docs_src/index.md)
- Contributing guide: [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md)

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
- JS/TS: `npm test` (run from `js/`)

## License

See `LICENSE`.
# BbQ.ChatWidgets

>A compact library of UI chat widgets and helpers for server and client integrations.

This repository contains two distributable packages:

- NuGet: `BbQ.ChatWidgets` — the .NET library (API, services, renderers).
- npm: `@bbq-chat/widgets` — the JavaScript/TypeScript client library (widgets, types).

Installation

NuGet (C#)

```powershell
dotnet add [YOUR_PROJECT] package BbQ.ChatWidgets
```

npm (JS/TS)

```bash
npm install @bbq-chat/widgets
# or
yarn add @bbq-chat/widgets
```

Quick usage

C# (basic)

```csharp
using BbQ.ChatWidgets;

// Example: register services in an ASP.NET Core app
services.AddBbQChatWidgets(options => {
  // configure options
});
```

JavaScript / TypeScript (basic)

```js
import { WidgetRegistry } from '@bbq-chat/widgets';

const registry = new WidgetRegistry();
// register or render widgets
```

Documentation

Generated API and user docs are published to the project's GitHub Pages site and are available under the repository `docs/` folder when built. See the `docs/` folder and `.github/workflows/docs.yml` for how docs are produced.

Packaging notes

- The root `README.md` is intentionally small and intended to ship inside NuGet and npm packages as the package README. Keep it compact — use the repository `docs/` for full reference and guides.
- The repository also contains the full DocFX and TypeDoc configuration used to build the site.

License

See the `LICENSE` file in the repository root for license details.
# BbQ.ChatWidgets

Professional documentation has been consolidated into the `docs/` folder. This repository provides a framework-agnostic widget library for building interactive AI chat UIs.

Quick links:

- Getting started: `docs_src/GETTING_STARTED.md`
- Architecture: `docs_src/ARCHITECTURE.md`
- API Reference: `docs_src/api/README.md`
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
    // Build an IChatClient and enable function invocation so widgets/tools work.
    IChatClient openaiClient = new OpenAI.Chat.ChatClient("gpt-4o-mini", "API_KEY").AsIChatClient();
    IChatClient chatClient = new ChatClientBuilder(openaiClient).UseFunctionInvocation().Build();
    options.ChatClientFactory = _ => chatClient;
});
app.MapBbQChatEndpoints();
```

## Documentation

Complete documentation is available in the `/docs` folder:

- **[Getting Started](docs_src/GETTING_STARTED.md)** - Get up and running in 5 minutes
- **[Master Index](docs_src/index.md)** - Navigation hub for all documentation
- **[Architecture Guide](docs_src/ARCHITECTURE.md)** - Understand how it works
- **[Quick Reference](docs_src/QUICK_REFERENCE.md)** - Find what you need quickly

## Key Concepts

### Built-in Widgets

| Widget | Purpose | Example |
|--------|---------|---------|
| **Button** | Click actions | Confirm, Cancel, Submit |
| **Card** | Rich content display | Product cards, results |
| **Input** | Single-line text input | Inside forms |
| **TextArea** | Multi-line text input | Inside forms |
| **Dropdown** | Selection list | Inside forms |
| **MultiSelect** | Multi-choice list | Inside forms |
| **Slider** | Range selection | Inside forms |
| **Toggle** | Boolean switch | Inside forms |
| **DatePicker** | Date selection | Inside forms |
| **File Upload** | File handling | Inside forms |
| **Form** | Groups input widgets | Submit/cancel |
| **Progress Bar** | Progress display | Loading/status |
| **Theme Switcher** | Theme selection | Light/Dark |

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
1. [Getting Started](docs_src/GETTING_STARTED.md) (5 min)
2. [Installation Guide](docs_src/guides/INSTALLATION.md)
3. [Examples](docs_src/examples/README.md)
4. [API Reference](docs_src/api/README.md)

### — For Developers
1. [Architecture Guide](docs_src/ARCHITECTURE.md)
2. [Custom Widgets](docs_src/guides/CUSTOM_WIDGETS.md)
3. [Custom AI Tools](docs_src/guides/CUSTOM_AI_TOOLS.md)
4. [API Reference](docs_src/api/README.md)

### — For Contributors
1. [Development Setup](docs_src/contributing/DEVELOPMENT.md)
2. [Code Style](docs_src/contributing/CODE_STYLE.md)
3. [Testing Guide](docs_src/contributing/TESTING.md)
4. [Documentation Standards](docs_src/contributing/DOCUMENTATION.md)

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

**Ready to get started?** [Getting Started Guide](docs_src/GETTING_STARTED.md)

**Need help?** [Documentation Index](docs_src/index.md)
