# Code Style Guide

Coding standards and conventions for BbQ.ChatWidgets.

## Language & Framework

- **Language**: C# 11 or higher
- **Framework**: .NET 8
- **.NET Standard**: 8.0

## Naming Conventions

### Classes
- Use PascalCase
- Use descriptive names
- Avoid abbreviations

```csharp
// Good
public class ChatWidgetService { }
public class DefaultThreadService { }

// Bad
public class CWService { }
public class ThreadSvc { }
```

### Methods
- Use PascalCase
- Use verb for action methods
- Use "Async" suffix for async methods

```csharp
// Good
public async Task<ChatTurn> RespondAsync() { }
public void ProcessMessage() { }

// Bad
public Task respond() { }
public void process_message() { }
```

### Parameters & Variables
- Use camelCase
- Use descriptive names
- Avoid single-letter names (except `i` in loops)

```csharp
// Good
var chatClient = new ChatClient();
var messageHistory = new List<ChatTurn>();

// Bad
var cc = new ChatClient();
var m = new List<ChatTurn>();
```

### Constants
- Use UPPER_SNAKE_CASE
- Use meaningful names

```csharp
// Good
private const int DEFAULT_CONTEXT_WINDOW = 10;
private const string API_ENDPOINT = "/api/chat";

// Bad
private const int MAX = 10;
private const string EP = "/api/chat";
```

## File Organization

### One Class Per File
```
Services/

Models/
— ChatWidgetService.cs
— DefaultThreadService.cs
— DefaultToolsProvider.cs
— ...
```
— ChatWidget.cs
— ChatTurn.cs
— ...
```

### Using Statements Order
1. System namespaces
2. Third-party namespaces
3. Application namespaces

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.DependencyInjection;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Services;
```

## Formatting

### Braces
- Use Allman style
- Opening brace on new line

```csharp
// Good
public class MyClass
{
    public void MyMethod()
    {
        if (condition)
        {
            // Code
        }
    }
}

// Bad
public class MyClass {
    public void MyMethod() {
        if (condition) {
            // Code
        }
    }
}
```

### Indentation
- Use 4 spaces
- Never use tabs

### Line Length
- Aim for 100-120 characters
- Break long lines

```csharp
// Good
var widgets = await chatWidgetService
    .RespondAsync(message, threadId);

// Bad
var widgets = await chatWidgetService.RespondAsync(message, threadId);
```

## Comments & Documentation

### XML Comments (Public Members)
Document all public classes, methods, properties.

```csharp
/// <summary>
/// Processes a user message and returns an AI response.
/// </summary>
/// <param name="message">The user's message</param>
/// <param name="threadId">Optional thread ID for conversation context</param>
/// <returns>A ChatTurn with the AI response</returns>
/// <exception cref="ArgumentException">When message is empty</exception>
public async Task<ChatTurn> RespondAsync(
    string message,
    string? threadId)
{
}
```

### Implementation Comments
Keep to a minimum. Code should be self-explanatory.

```csharp
// Good: Explains why
// We limit context to 10 turns to reduce token usage
var context = history.TakeLast(10);

// Bad: States the obvious
// Take last 10 items
var context = history.TakeLast(10);
```

## Type Safety

### Use Specific Types
```csharp
// Good
IEnumerable<ChatWidget> GetWidgets() { }

// Less specific
IEnumerable GetWidgets() { }

// Overly specific
List<ChatWidget> GetWidgets() { }
```

### Nullable Reference Types
- Enable `nullable: enable` in .csproj
- Explicitly mark nullable with `?`

```csharp
// Good
public string? OptionalValue { get; set; }
public string RequiredValue { get; set; }

// Bad
public string OptionalValue { get; set; }
```

## Error Handling

### Use Specific Exceptions
```csharp
// Good
if (string.IsNullOrEmpty(message))
    throw new ArgumentException("Message cannot be empty");

// Bad
throw new Exception("Error");
```

### Log Errors
```csharp
catch (Exception ex)
{
    _logger.LogError(ex, "Operation failed");
    throw;
}
```

## Async/Await

### Async Methods Must be Awaited
```csharp
// Good
var result = await GetDataAsync();

// Bad
var result = GetDataAsync(); // Missing await
```

### Avoid Deadlocks
```csharp
// Good
public async Task<string> GetAsync() { }

// Bad
public string Get()
{
    return GetAsync().Result; // Can deadlock
}
```

## Records vs Classes

- Use **records** for immutable data
- Use **classes** for stateful objects

```csharp
// Good: Immutable data
public record ChatTurn(ChatRole Role, string Content);

// Good: Mutable service
public class ChatWidgetService { }

// Bad: Using class for immutable data
public class ChatTurn { get; set; }
```

## LINQ Usage

Keep LINQ queries readable:

```csharp
// Good
var widgets = messages
    .SelectMany(m => m.Widgets)
    .Where(w => w is ButtonWidget)
    .Distinct()
    .ToList();

// Bad
var widgets = messages.SelectMany(m => m.Widgets).Where(w => w is ButtonWidget).Distinct().ToList();
```

## Dependency Injection

Inject dependencies in constructor:

```csharp
// Good
public class MyService
{
    private readonly IThreadService _threadService;
    private readonly ILogger<MyService> _logger;

    public MyService(
        IThreadService threadService,
        ILogger<MyService> logger)
    {
        _threadService = threadService;
        _logger = logger;
    }
}

// Bad
public class MyService
{
    public MyService()
    {
        _threadService = ServiceLocator.Get<IThreadService>();
    }
}
```

## Testing Code Style

### Test Names
Be descriptive about what is being tested.

```csharp
// Good
[Fact]
public async Task RespondAsync_WithValidMessage_ReturnsResponse()
{
}

// Bad
[Fact]
public async Task TestRespond()
{
}
```

### Arrange-Act-Assert (AAA)
```csharp
[Fact]
public async Task HandleAction_ValidPayload_ReturnsSuccess()
{
    // Arrange
    var handler = new MyActionHandler();
    var payload = new Dictionary<string, object> { /* ... */ };

    // Act
    var result = await handler.HandleActionAsync(
        "action",
        payload,
        "thread-123",
        services);

    // Assert
    Assert.NotNull(result);
    Assert.Contains("success", result.Content.ToLower());
}
```

## Code Review Checklist

- [ ] Follows naming conventions
- [ ] Properly formatted and indented
- [ ] XML comments on public members
- [ ] Error handling implemented
- [ ] No unnecessary code
- [ ] Tests included
- [ ] No hardcoded values
- [ ] No debug code left behind

## Tools

### Format Code
```bash
dotnet format
```

### Analyze Code
```bash
dotnet build /p:EnforceCodeStyleInBuild=true
```

## Related Documents

- **[TESTING.md](TESTING.md)** - Testing guidelines
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Dev setup

---

**Back to:** [Contributing Guides](README.md)
