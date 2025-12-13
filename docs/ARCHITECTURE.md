# Architecture

High-level architecture and core components (ChatWidgetService, ThreadService, WidgetHintParser, WidgetToolsProvider, ChatClient). For full design rationale and patterns see `docs/design/`.

Diagram and data flow should be kept concise here; deep dives live in the design docs.
# Architecture Guide

This guide explains how BbQ.ChatWidgets is designed and how its components interact.

## System Overview

```
Client Application (Web UI, Desktop, Mobile)
    |
    | HTTP/REST API
    v
ASP.NET Core App
    - ChatWidgetService (orchestrator)
    - ChatClient (OpenAI, Claude, etc.)
    - WidgetToolsProvider
    - ThreadService
    - Widget Hint Parser
```

## Core Components

### 1. **ChatWidgetService** (Orchestrator)
The main service that coordinates all operations.

**Responsibilities:**
- Process user messages
- Send messages to AI chat client
- Parse AI responses for embedded widgets
- Manage conversation threads
- Handle widget actions

**Key Methods:**
- `RespondAsync(string userMessage, string? threadId)` - Process message and get response
- `HandleActionAsync(string action, Dictionary payload, string threadId)` - Handle widget actions

### 2. **DefaultThreadService** (Conversation Management)
Manages conversation threads and message history.

**Responsibilities:**
- Create new conversation threads
- Store conversation history
- Retrieve conversation context
- Maintain multi-turn conversations

**Key Methods:**
- `CreateThread()` - Start a new conversation
- `AppendMessageToThread()` - Add message to history
- `GetMessage()` - Retrieve conversation
- `ThreadExists()` - Check if thread exists

### 3. **Chat Client** (AI Integration)
The AI model integration (OpenAI, Claude, etc.)

**Responsibilities:**
- Generate responses to user messages
- Execute available tools
- Return structured responses

**Configuration:**
```csharp
options.ChatClientFactory = sp => new OpenAI.Chat.ChatClient(...);
```

### 4. **WidgetToolsProvider** (Tool Discovery)
Provides widget definitions as AI tools.

**Responsibilities:**
- List all available widgets as AI tools
- Provide JSON schemas for widgets
- Enable AI to understand widget parameters

**Result:** AI knows how to create:
- Buttons with labels and actions
- Forms with input validation
- Cards with images
- Dropdowns with options
- etc.

### 5. **Widget Hint Parser** (Widget Extraction)
Extracts widget definitions from AI responses.

**Responsibilities:**
- Parse widget markers in AI responses
- Extract widget JSON
- Clean text content

**Example:**
```
AI Response: "Here are your options: <widget>{"type":"button","label":"Yes","action":"confirm"}</widget>"
Parser Returns: (content: "Here are your options:", widgets: [ButtonWidget])
```

### 6. **Thread Service** (Conversation State)
Manages conversation history and context.

**Responsibilities:**
- Store all messages in conversation
- Maintain conversation state
- Limit context window (last 10 turns)

**Context Window:**
The service only sends the last 10 messages to the AI to:
- Reduce token usage
- Maintain performance
- Keep responses coherent

## Data Flow Diagrams

### Message Processing Flow

```
User Message
    ?
    ?
ChatWidgetService.RespondAsync()
    ?
    — Validate/Create Thread
    ?
    — Get Widget Tools from Provider
    ?
    — Append User Message to Thread
    ?
    — Get Last 10 Turns from Thread
    ?
    — Send to Chat Client with Tools
    ?
    — Receive AI Response
    ?
    — Parse Response for Widgets
    ?   ?
    ?   — WidgetHintParser.Parse()
    ?
    — Append Assistant Turn to Thread
    ?
    ?
Return ChatTurn(content, widgets, threadId)
```

### Widget Action Flow

```
User Clicks Widget
    ?
    ?
POST /api/chat/action
    ?
    — Deserialize Action DTO
    ?
    — Call ChatWidgetService.HandleActionAsync()
    ?
    — Handle Action (custom logic)
    ?
    — Generate Response Message
    ?
    — Follow Message Processing Flow
    ?
    ?
Return Response ChatTurn
```

## Key Design Patterns

### 1. **Service Layer Pattern**
All operations go through the `ChatWidgetService`:
- Single entry point
- Consistent error handling
- Easy to test

### 2. **Dependency Injection**
Uses Microsoft.Extensions.DependencyInjection:
```csharp
services.AddBbQChatWidgets(options => {
    options.ChatClientFactory = ...;
    options.ToolProviderFactory = ...;
    options.WidgetToolsProviderFactory = ...;
});
```

### 3. **Factory Pattern**
Custom implementations via factory functions:
- `ChatClientFactory` - Provide custom chat client
- `ToolProviderFactory` - Add custom AI tools
- `WidgetToolsProviderFactory` - Override widgets

### 4. **Strategy Pattern**
Pluggable implementations for:
- `IThreadService` - Thread management
- `IWidgetHintParser` - Widget extraction
- `IWidgetToolsProvider` - Tool discovery

### 5. **Record Types** (Immutability)
All data models are records:
```csharp
public record ChatTurn(ChatRole Role, string Content, ...);
```
Benefits:
- Immutable (no accidental changes)
- Value-based equality
- Easy to reason about

## Polymorphic Type Handling

BbQ.ChatWidgets uses JSON polymorphism for widgets:

```csharp
[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(ButtonWidget), "button")]
[JsonDerivedType(typeof(CardWidget), "card")]
public abstract record ChatWidget(string Label, string Action);
```

This enables:
- Type-safe widget handling
- Automatic serialization/deserialization
- Clear widget type identification

## Thread/Conversation Management

Each conversation is a **Thread**:

```
Thread ID: "abc123"
— Turn 1: User: "Hello"
— Turn 2: Assistant: "Hi! How can I help?" + Button widget
— Turn 3: User: "Show me options"
— Turn 4: Assistant: "Here are your options" + Dropdown widget
— Turn 5: User: "I'll choose option 2"

Context Sent to AI (last 10 turns):
— Turns 1-5 (all in this case)
```

**Benefits:**
- Maintain conversation context
- Support multiple simultaneous conversations
- Limit token usage with context window
- Clear message history

## Configuration Options

All options go through `BbQChatOptions`:

```csharp
public class BbQChatOptions
{
    public string? RoutePrefix { get; set; } = "/api/chat";
    public Func<IServiceProvider, IChatClient>? ChatClientFactory { get; set; }
    public Func<IServiceProvider, IAIToolsProvider>? ToolProviderFactory { get; set; }
    public Func<IServiceProvider, IAIInstructionProvider>? AIInstructionProviderFactory { get; set; }
    public Func<IServiceProvider, IWidgetToolsProvider>? WidgetToolsProviderFactory { get; set; }
}
```

## Extension Points

### 1. Custom Chat Clients
```csharp
options.ChatClientFactory = sp => new MyCustomChatClient();
```

### 2. Custom Widget Tools
```csharp
options.WidgetToolsProviderFactory = sp => new MyWidgetProvider();
```

### 3. Custom AI Tools
```csharp
options.ToolProviderFactory = sp => new MyToolProvider();
```

### 4. Custom Instructions
```csharp
options.AIInstructionProviderFactory = sp => new MyInstructionProvider();
```

### 5. Custom Thread Management
Register `IThreadService`:
```csharp
services.AddScoped<IThreadService, MyCustomThreadService>();
```

## Error Handling

The service provides clear error handling:

```csharp
try
{
    var response = await service.RespondAsync(message);
}
catch (ThreadNotFoundException)
{
    // Invalid thread ID
}
catch (InvalidOperationException)
{
    // Widget parsing or configuration error
}
catch (OperationCanceledException)
{
    // Operation was cancelled
}
```

## Performance Considerations

1. **Context Window** (10 turns max)
   - Reduces token usage
   - Improves response speed
   - Configurable via extension method

2. **Thread Storage** (In-memory by default)
   - Fast access to conversation history
   - Use custom `IThreadService` for persistence

3. **Caching**
   - Widget tools are cached
   - AI tools are cached
   - Factory functions called once

4. **Async Throughout**
   - All I/O is async
   - No blocking operations
   - Scales to many concurrent users

## Security Considerations

1. **Thread ID Isolation**
   - Each thread is separate
   - No cross-thread access
   - Validate thread ownership in custom handlers

2. **Action Handler Validation**
   - Validate action IDs in custom handlers
   - Validate payload data types
   - Implement authorization checks

3. **Widget Sanitization**
   - Widget content is escaped in HTML
   - No script injection through widgets
   - Safe JSON parsing

## Testing Strategy

The modular design enables easy testing:

```csharp
[Fact]
public async Task RespondsToMessage()
{
    var mockClient = new Mock<IChatClient>();
    var service = new ChatWidgetService(
        mockClient.Object,
        new DefaultWidgetHintParser(),
        new DefaultWidgetToolsProvider(),
        new DefaultAIToolsProvider(),
        new DefaultThreadService(),
        new DefaultInstructionProvider()
    );

    var response = await service.RespondAsync("Test");
    Assert.NotNull(response);
}
```

Each component can be tested independently via mocks.

---

**Next Steps:**
- [Configuration Guide](../guides/CONFIGURATION.md)
- [Design Decisions](../design/)
- [API Reference](../api/README.md)
