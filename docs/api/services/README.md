This API services documentation has been consolidated into the generated API docs. Run the API doc pipeline to regenerate.

See `docs/api/README.md` for instructions.
# Services API

Documentation for core service classes.

## Overview

Services are the main components that handle business logic.

## Main Services

### ChatWidgetService

**Purpose**: Main orchestrator for chat operations

**Key Methods**:
- `RespondAsync(message, threadId)` - Process message
- `HandleActionAsync(action, payload, threadId)` - Handle widget action

**Example**:
```csharp
var response = await chatWidgetService
    .RespondAsync("Hello", null);
```

### DefaultThreadService

**Purpose**: Manage conversation threads

**Key Methods**:
- `CreateThreadAsync()` - Start new conversation
- `AppendMessageToThreadAsync(threadId, turn)` - Add message
- `GetThreadHistoryAsync(threadId)` - Get messages
- `ThreadExistsAsync(threadId)` - Check if exists

**Example**:
```csharp
var thread = await threadService.CreateThreadAsync();
await threadService.AppendMessageToThreadAsync(
    thread.Id, 
    new ChatTurn(...));
```

## Service List

| Service | Purpose |
|---|---|
| **ChatWidgetService** | Main orchestrator |
| **DefaultThreadService** | Thread management |
| **DefaultWidgetHintParser** | Extract widgets from responses |
| **DefaultWidgetToolsProvider** | Provide widget definitions |
| **DefaultToolsProvider** | Provide custom tools |
| **DefaultInstructionProvider** | System instructions |

## Configuration

Services are registered automatically:

```csharp
builder.Services.AddBbQChatWidgets(options =>
{
    options.ChatClientFactory = sp => chatClient;
});
```

Or manually:

```csharp
builder.Services.AddScoped<ChatWidgetService>();
builder.Services.AddScoped<IThreadService, 
    DefaultThreadService>();
```

## Custom Services

Implement interfaces to create custom services:

```csharp
public class CustomThreadService : IThreadService
{
    // Implementation here
}

builder.Services.AddScoped<IThreadService, 
    CustomThreadService>();
```

## Related Documents

- **[ChatWidgetService.md](ChatWidgetService.md)** - Detailed documentation
- **[Models](../models/)** - Data structures
- **[Abstractions](../abstractions/)** - Interfaces
- **[guides/CONFIGURATION.md](../../guides/CONFIGURATION.md)** - Configuration

---

**Back to:** [API Reference](../README.md)
