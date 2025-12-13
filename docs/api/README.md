# API Reference

This folder will contain generated API documentation (public types, services, models). It is generated from the `BbQ.ChatWidgets` project XML docs using DocFX.

To regenerate:

```powershell
dotnet build BbQ.ChatWidgets/BbQ.ChatWidgets.csproj -c Release
docfx metadata docfx.json
docfx build docfx.json
```
# API Reference

Complete documentation of all BbQ.ChatWidgets APIs.

## Services

Core service classes that handle business logic.

- **[ChatWidgetService](services/ChatWidgetService.md)** - Main orchestrator
- **[DefaultThreadService](services/DefaultThreadService.md)** - Thread management
- **[Other Services](services/README.md)** - Complete services list

## Models

Data structures and record types.

- **[ChatWidget](models/ChatWidget.md)** - Base widget class
- **[ChatTurn](models/ChatTurn.md)** - Message/turn structure
- **[Other Models](models/README.md)** - Complete models list

## Abstractions

Interfaces and contracts.

- **[IThreadService](abstractions/IThreadService.md)** - Thread interface
- **[IWidgetActionHandler](abstractions/IWidgetActionHandler.md)** - Action interface
- **[Other Abstractions](abstractions/README.md)** - Complete list

## Extensions

Helper methods and extension functions.

- **[IServiceCollectionExtensions](extensions/IServiceCollectionExtensions.md)** - DI setup
- **[Other Extensions](extensions/README.md)** - Complete list

## Endpoints

REST API endpoints documentation.

### POST /api/chat/message

Send a user message and get assistant response.

**Request:**
```json
{
  "message": "string",
  "threadId": "string|null"
}
```

**Response:**
```json
{
  "role": "user|assistant",
  "content": "string",
  "widgets": [ChatWidget[]],
  "threadId": "string"
}
```

### POST /api/chat/action

Handle widget action.

**Request:**
```json
{
  "action": "string",
  "payload": {},
  "threadId": "string"
}
```

**Response:**
```json
{
  "role": "assistant",
  "content": "string",
  "widgets": [ChatWidget[]],
  "threadId": "string"
}
```

## Quick Reference

| Class | Purpose |
|---|---|
| **ChatWidgetService** | Main service, handles messages |
| **ChatWidget** | Base class for widgets |
| **ChatTurn** | Represents message/response |
| **IThreadService** | Stores conversation state |
| **IWidgetActionHandler** | Handles widget interactions |

## Navigation

- **[Services](services/README.md)** - Service documentation
- **[Models](models/README.md)** - Data model documentation
- **[Abstractions](abstractions/README.md)** - Interface documentation
- **[Extensions](extensions/README.md)** - Extension method documentation

## Getting Started with API

1. Read [GETTING_STARTED.md](../GETTING_STARTED.md)
2. Review relevant service
3. Check examples
4. Implement your usage

---

**Back to:** [Documentation Index](../INDEX.md)
