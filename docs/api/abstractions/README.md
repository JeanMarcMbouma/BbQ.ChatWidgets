# Abstractions API

Documentation for interfaces and contracts.

## Overview

Abstractions define the contracts that services must implement.

## Main Interfaces

### IThreadService

**Purpose**: Manage conversation threads

**Methods**:
- `CreateThreadAsync()` - Create new thread
- `ThreadExistsAsync(threadId)` - Check existence
- `AppendMessageToThreadAsync(threadId, turn)` - Add message
- `GetThreadHistoryAsync(threadId)` - Get history
- `GetMessageAsync(threadId, index)` - Get specific message

**Example**:
```csharp
public interface IThreadService
{
    Task<ThreadData> CreateThreadAsync();
    Task<bool> ThreadExistsAsync(string threadId);
    Task AppendMessageToThreadAsync(
        string threadId,
        ChatTurn turn);
    Task<IEnumerable<ChatTurn>> GetThreadHistoryAsync(
        string threadId);
}
```

### IWidgetActionHandler

**Purpose**: Handle widget interactions

**Methods**:
- `HandleActionAsync(action, payload, threadId, services)` - Process action

**Example**:
```csharp
public interface IWidgetActionHandler
{
    Task<ChatTurn> HandleActionAsync(
        string action,
        Dictionary<string, object> payload,
        string threadId,
        IServiceProvider serviceProvider);
}
```

### IWidgetToolsProvider

**Purpose**: Provide widget definitions

**Methods**:
- `GetTools()` - Return available widgets

**Example**:
```csharp
public interface IWidgetToolsProvider
{
    IEnumerable<ToolDefinition> GetTools();
}
```

### IAIToolsProvider

**Purpose**: Provide custom AI tools

**Methods**:
- `GetTools()` - Return available tools
- `HandleToolCallAsync(toolName, arguments)` - Execute tool

**Example**:
```csharp
public interface IAIToolsProvider
{
    IEnumerable<ToolDefinition> GetTools();
    Task<string> HandleToolCallAsync(
        string toolName,
        Dictionary<string, object> arguments);
}
```

### IAIInstructionProvider

**Purpose**: Provide system instructions for AI

**Methods**:
- `GetSystemInstructions()` - Return instructions

**Example**:
```csharp
public interface IAIInstructionProvider
{
    string GetSystemInstructions();
}
```

### IWidgetHintParser

**Purpose**: Extract widgets from AI responses

**Methods**:
- `Parse(response)` - Parse response for widgets

**Example**:
```csharp
public interface IWidgetHintParser
{
    (string Content, ChatWidget[] Widgets) Parse(
        string response);
}
```

## Implementation Guide

### Implementing IThreadService

```csharp
public class CustomThreadService : IThreadService
{
    public async Task<ThreadData> CreateThreadAsync()
    {
        var thread = new ThreadData
        {
            Id = Guid.NewGuid().ToString(),
            CreatedAt = DateTime.UtcNow
        };
        // Store thread...
        return thread;
    }

    public async Task<bool> ThreadExistsAsync(
        string threadId)
    {
        // Check if thread exists...
        return true;
    }

    public async Task AppendMessageToThreadAsync(
        string threadId,
        ChatTurn turn)
    {
        // Store message...
    }

    public async Task<IEnumerable<ChatTurn>> 
        GetThreadHistoryAsync(string threadId)
    {
        // Retrieve messages...
        return messages;
    }

    public async Task<ChatTurn> GetMessageAsync(
        string threadId,
        int index)
    {
        // Get specific message...
        return message;
    }
}
```

### Registering Custom Implementation

```csharp
builder.Services.AddScoped<IThreadService, 
    CustomThreadService>();
```

## Related Documents

- **[Services](../services/)** - Service implementations
- **[Models](../models/)** - Data structures
- **[guides/CUSTOM_WIDGETS.md](../../guides/CUSTOM_WIDGETS.md)** - Custom implementations

---

**Back to:** [API Reference](../README.md)
