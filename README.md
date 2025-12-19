# BbQ.ChatWidgets

A compact library of UI chat widgets and helpers for server and client integrations.

This repository ships two distributable packages:

- NuGet: `BbQ.ChatWidgets` (the .NET library: services, renderers, endpoints)
- npm: `@bbq-chat/widgets` (the JavaScript/TypeScript client library: widgets, client helpers)

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

## Install

### NuGet (.NET)

```powershell
dotnet add [YOUR_PROJECT] package BbQ.ChatWidgets
```

### npm (JS/TS client + themes)

```bash
npm install @bbq-chat/widgets
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
