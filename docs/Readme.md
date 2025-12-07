# BbQ.ChatWidgets

BbQ.ChatWidgets is a framework-agnostic widget library for AI chat UIs, built on Microsoft.Extensions.AI.

## Features
- JSON contract for widgets
- Minimal API endpoints
- JavaScript client with auto-binding
- LLM tool integration
- Localization + theming

## Quick Start
```csharp
builder.Services.AddBbQChatWidgets(options =>
{
    options.ChatClientFactory = sp => new OpenAIChatClient("API_KEY");
});
app.MapBbQChatEndpoints();
```

#### `GettingStarted.md`
Step-by-step guide to add BbQ to an ASP.NET Core app.

#### `API.md`
Detailed docs for `ChatTurn`, `ChatWidget`, `IWidgetActionHandler`, and `BbQChatClient`.

#### `Theming.md`
CSS contract, theme packs, and `ThemeSwitcherWidget` usage.

# Documentation Organization — Final Summary

## ✅ Task Completed

The documentation has been reorganized into a clean, navigable structure.

---

## 📝 What Changed

### Root level
```
README.md — project overview + quick start
```

### `docs/` folder (high level)
```
INDEX.md             — navigation hub
GETTING_STARTED.md   — 5-minute quick start
ARCHITECTURE.md      — system design
QUICK_REFERENCE.md   — quick topic lookup
MANAGEMENT.md        — maintenance guidelines
```

Folders ready for content: `guides/`, `examples/`, `design/`, `api/`, `contributing/`.

Removed a few empty or duplicate files as part of the cleanup.

---

## User Journey Examples

1) First-time user: `README.md` → `docs/GETTING_STARTED.md` → `docs/examples/BASIC_SETUP.md` (5 minutes)

2) Developer: `README.md` → `docs/ARCHITECTURE.md` → `docs/guides/CUSTOM_WIDGETS.md` → `docs/api/`

3) Contributor: `README.md` → `docs/INDEX.md#contributing` → `docs/contributing/DEVELOPMENT.md`

---

## Structure Summary

```
BbQ.ChatWidgets/
├─ README.md
└─ docs/
   ├─ INDEX.md
   ├─ GETTING_STARTED.md
   ├─ ARCHITECTURE.md
   ├─ QUICK_REFERENCE.md
   ├─ MANAGEMENT.md
   ├─ guides/
   ├─ examples/
   ├─ design/
   └─ api/
```

---

## Next Steps

- Use `README.md` and `docs/INDEX.md` as the primary entry points.
- Add content under `docs/guides/`, `docs/examples/`, and `docs/design/`.
- Maintain documentation via `docs/MANAGEMENT.md`.

---

**Status**: Ready

*Documentation reorganized for clarity and usability.*
```

