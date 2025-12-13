Custom action handlers guide consolidated into `docs/guides/README.md` and `docs/USAGE.md`.
# Custom Action Handlers Guide

Learn how to handle widget interactions and custom actions using both the legacy `IWidgetActionHandler` approach and the new typed handler system.

## Overview

This guide shows you how to:
1. Understand widget actions
2. Create action handlers (legacy and typed)
3. Register action handlers
4. Process widget data
5. Generate responses
6. Make the LLM aware of available actions

## Understanding Actions

### What Are Actions?

When users interact with widgets, they trigger actions:

```
User clicks widget
    ↓
Browser sends action request
    ↓
Backend handles action
    ↓
Generate AI response
    ↓
Return widgets and message
    ↓
Browser renders response
```

### Action Request Format

```json
{
  "action": "submit_form",
  "payload": {
    "name": "John",
    "email": "john@example.com"
  },
  "threadId": "abc-123-def"
}
```

## Two Approaches: Legacy vs. Typed

### Legacy Approach: IWidgetActionHandler
Simple, string-based action routing with dynamic payloads (backward compatible)

### Modern Approach: IWidgetAction<T> + IActionWidgetActionHandler<TWidgetAction, T>
Type-safe, with automatic LLM awareness and schema generation

**Recommendation**: Use the typed approach for new code. Both can coexist during migration.

## Creating Typed Action Handlers (Recommended)

### Step 1: Define the Payload Type

```csharp
namespace MyApp.Actions;

/// <summary>
/// Payload for form submission action.
/// </summary>
public sealed record FormSubmissionPayload(
    string Name,
    string Email
);
```

### Step 2: Define the Action

```csharp
using BbQ.ChatWidgets.Abstractions;
using System.Text.Json;

namespace MyApp.Actions;

/// <summary>
/// Action for form submission.
/// </summary>
public sealed class FormSubmissionAction : IWidgetAction<FormSubmissionPayload>
{
    public string Name => "submit_form";

    public string Description =>
        "Handles form submission with name and email validation.";

    public string PayloadSchema =>
        JsonSerializer.Serialize(new
        {
            name = "string (required)",
            email = "string (required, valid email)"
        });
}
```

### Step 3: Implement the Handler

```csharp
using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Models;
using Microsoft.Extensions.Logging;

namespace MyApp.Actions;

/// <summary>
/// Handler for form submission actions.
/// </summary>
public sealed class FormSubmissionHandler :
    IActionWidgetActionHandler<FormSubmissionAction, FormSubmissionPayload>
{
    private readonly ILogger<FormSubmissionHandler> _logger;

    public FormSubmissionHandler(ILogger<FormSubmissionHandler> logger)
    {
        _logger = logger;
    }

    public async Task<ChatTurn> HandleActionAsync(
        FormSubmissionAction action,
        FormSubmissionPayload payload,
        string threadId,
        IServiceProvider serviceProvider)
    {
        try
        {
            _logger.LogInformation(
                "Handling form submission for {Email}",
                payload.Email);

            // Validation (type-safe, no casting)
            if (string.IsNullOrEmpty(payload.Name))
                throw new ValidationException("Name is required");

            if (!IsValidEmail(payload.Email))
                throw new ValidationException("Email must be valid");

            // Process the form
            await Task.Delay(100); // Simulate work

            // Generate response
            var message = $"Thank you! Your submission has been received.";

            // Create next widget if needed
            var widgets = new List<ChatWidget>
            {
                new ButtonWidget(
                    Label: "Next Step",
                    Action: "continue_process"
                )
            };

            // Return as chat turn
            return new ChatTurn(
                Role: ChatRole.Assistant,
                Content: message,
                Widgets: widgets,
                ThreadId: threadId
            );
        }
        catch (ValidationException ex)
        {
            _logger.LogWarning(ex, "Validation failed");
            return new ChatTurn(
                ChatRole.Assistant,
                $"Error: {ex.Message}",
                Array.Empty<ChatWidget>(),
                threadId
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Action handling failed");
            return new ChatTurn(
                ChatRole.Assistant,
                "An error occurred. Please try again later.",
                Array.Empty<ChatWidget>(),
                threadId
            );
        }
    }

    private bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch { return false; }
    }
}

public class ValidationException : Exception
{
    public ValidationException(string message) : base(message) { }
}
```

### Step 4: Register in DI Container

```csharp
// Program.cs
using MyApp.Actions;
using BbQ.ChatWidgets.Services;
using BbQ.ChatWidgets.Abstractions;

var builder = WebApplicationBuilder.CreateBuilder(args);

// Register BbQ ChatWidgets
builder.Services.AddBbQChatWidgets(options =>
{
    options.ChatClientFactory = sp => new OpenAIChatClient("API_KEY");
});

// Register the typed action and handler
builder.Services.AddScoped<FormSubmissionHandler>();

// Configure the registry after building
var app = builder.Build();

// Register action with metadata
var actionRegistry = app.Services.GetRequiredService<IWidgetActionRegistry>();
var handlerResolver = app.Services.GetRequiredService<IWidgetActionHandlerResolver>();
var formAction = new FormSubmissionAction();

actionRegistry.RegisterAction(new WidgetActionMetadata(
    formAction.Name,
    formAction.Description,
    formAction.PayloadSchema,
    typeof(FormSubmissionPayload)
));

handlerResolver.RegisterHandler(
    formAction.Name,
    typeof(FormSubmissionHandler)
);

app.MapBbQChatEndpoints();
app.Run();
```

## Legacy Approach: IWidgetActionHandler

For backward compatibility or simpler use cases:

```csharp
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Services;

public class FormSubmissionActionHandler : IWidgetActionHandler
{
    private readonly IThreadService _threadService;
    private readonly ILogger<FormSubmissionActionHandler> _logger;

    public FormSubmissionActionHandler(
        IThreadService threadService,
        ILogger<FormSubmissionActionHandler> logger)
    {
        _threadService = threadService;
        _logger = logger;
    }

    public async Task<ChatTurn> HandleActionAsync(
        string action,
        Dictionary<string, object> payload,
        string threadId,
        IServiceProvider serviceProvider)
    {
        if (action != "submit_form")
            throw new InvalidOperationException($"Unknown action: {action}");

        try
        {
            _logger.LogInformation(
                "Handling form submission for thread {ThreadId}",
                threadId);

            // Validate payload (requires casting)
            ValidateFormPayload(payload);

            // Process the form data
            var result = await ProcessFormAsync(payload);

            // Generate response
            var message = $"Thank you! Your submission has been received.";

            // Create next widget if needed
            var widgets = new List<ChatWidget>
            {
                new ButtonWidget(
                    Label: "Next Step",
                    Action: "continue_process"
                )
            };

            // Return as chat turn
            return new ChatTurn(
                Role: ChatRole.Assistant,
                Content: message,
                Widgets: widgets,
                ThreadId: threadId
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Action handling failed");
            throw;
        }
    }

    private void ValidateFormPayload(Dictionary<string, object> payload)
    {
        if (!payload.ContainsKey("name"))
            throw new ArgumentException("'name' is required");

        if (!payload.ContainsKey("email"))
            throw new ArgumentException("'email' is required");

        var email = payload["email"].ToString();
        if (!IsValidEmail(email))
            throw new ArgumentException("Invalid email format");
    }

    private async Task<FormSubmissionResult> ProcessFormAsync(
        Dictionary<string, object> payload)
    {
        var name = payload["name"].ToString();
        var email = payload["email"].ToString();

        await Task.Delay(100);

        return new FormSubmissionResult
        {
            Success = true,
            SubmissionId = Guid.NewGuid().ToString()
        };
    }

    private bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch { return false; }
    }
}

public record FormSubmissionResult(bool Success, string SubmissionId);
```

## LLM Awareness

### How It Works

1. **Action Registration**: When you register an action with `IWidgetActionRegistry`, it stores metadata including the action name, description, and payload schema.

2. **Dynamic Instructions**: The `DefaultInstructionProvider` queries the registry and generates LLM instructions that include all registered actions.

3. **LLM Sees Actions**: The AI model receives instructions like:
```
## Registered Actions

The following actions are available for widgets:
- **submit_form**: Handles form submission with name and email validation.
  Payload: {"name":"string (required)","email":"string (required, valid email)"}

- **check_status**: Check the status of a submitted form.
  Payload: {"submissionId":"string"}
```

4. **Correct Widget Generation**: The LLM knows which actions are available and uses them with correct payloads.

### Example: LLM Generated Widget

```json
{
  "type": "button",
  "label": "Submit",
  "action": "submit_form"
}
```

The LLM will include the correct action name based on registered actions.

## Common Action Patterns

### Button Click (Typed)

```csharp
public record ConfirmPayload(bool Confirmed);

public class ConfirmAction : IWidgetAction<ConfirmPayload>
{
    public string Name => "confirm";
    public string Description => "Confirms an action.";
    public string PayloadSchema => JsonSerializer.Serialize(new { confirmed = "boolean" });
}

public class ConfirmHandler : IActionWidgetActionHandler<ConfirmAction, ConfirmPayload>
{
    public async Task<ChatTurn> HandleActionAsync(
        ConfirmAction action,
        ConfirmPayload payload,
        string threadId,
        IServiceProvider serviceProvider)
    {
        var message = payload.Confirmed
            ? "You confirmed the action."
            : "Action was cancelled.";

        return new ChatTurn(
            ChatRole.Assistant,
            message,
            Array.Empty<ChatWidget>(),
            threadId
        );
    }
}
```

### Dropdown Selection (Typed)

```csharp
public record SelectPayload(string Option);

public class SelectAction : IWidgetAction<SelectPayload>
{
    public string Name => "select_option";
    public string Description => "Selects an option from a dropdown.";
    public string PayloadSchema => JsonSerializer.Serialize(new { option = "string" });
}

public class SelectHandler : IActionWidgetActionHandler<SelectAction, SelectPayload>
{
    public async Task<ChatTurn> HandleActionAsync(
        SelectAction action,
        SelectPayload payload,
        string threadId,
        IServiceProvider serviceProvider)
    {
        var (message, widgets) = payload.Option switch
        {
            "option1" =>
                ("You selected Option 1. Here's what happens next...",
                 new ChatWidget[] { new ButtonWidget("Continue", "continue") }),
            "option2" =>
                ("You selected Option 2. Let me show you details...",
                 new ChatWidget[] { new CardWidget("Details", "view_details") }),
            _ => ("Invalid option.", Array.Empty<ChatWidget>())
        };

        return new ChatTurn(
            ChatRole.Assistant,
            message,
            widgets,
            threadId
        );
    }
}
```

## Best Practices

### Do's ✅
- Validate all input at the handler level
- Log important actions for debugging
- Handle errors gracefully with user-friendly messages
- Use dependency injection for services
- Return clear, actionable messages
- Use the typed handler approach for new code
- Register actions with comprehensive descriptions and schemas
- Include payload examples in descriptions

### Don'ts ❌
- Don't trust client input
- Don't expose sensitive data in error messages
- Don't make blocking calls without async
- Don't skip error handling
- Don't hardcode values
- Don't ignore security concerns
- Don't return raw exception messages to users
- Don't forget to register actions in the DI container

## Testing Typed Handlers

```csharp
[Fact]
public async Task FormSubmissionHandler_ValidPayload_ReturnsConfirmation()
{
    // Arrange
    var logger = new Mock<ILogger<FormSubmissionHandler>>();
    var handler = new FormSubmissionHandler(logger.Object);
    var action = new FormSubmissionAction();
    var payload = new FormSubmissionPayload("John Doe", "john@example.com");
    var serviceProvider = new ServiceCollection().BuildServiceProvider();

    // Act
    var result = await handler.HandleActionAsync(
        action,
        payload,
        "thread-123",
        serviceProvider);

    // Assert
    Assert.Equal(ChatRole.Assistant, result.Role);
    Assert.Contains("received", result.Content.ToLower());
    Assert.Single(result.Widgets!);
}

[Fact]
public async Task FormSubmissionHandler_InvalidEmail_ReturnsError()
{
    // Arrange
    var logger = new Mock<ILogger<FormSubmissionHandler>>();
    var handler = new FormSubmissionHandler(logger.Object);
    var action = new FormSubmissionAction();
    var payload = new FormSubmissionPayload("John Doe", "invalid-email");
    var serviceProvider = new ServiceCollection().BuildServiceProvider();

    // Act
    var result = await handler.HandleActionAsync(
        action,
        payload,
        "thread-123",
        serviceProvider);

    // Assert
    Assert.Contains("error", result.Content.ToLower());
}
```

## Migration from Legacy Handlers

Both systems work together:

1. **Phase 1**: Keep existing `IWidgetActionHandler` implementations
2. **Phase 2**: Add new functionality using typed handlers
3. **Phase 3**: Gradually migrate legacy handlers to typed approach
4. **Phase 4**: Remove legacy handlers once migration is complete

## Benefits of Typed Handlers

| Feature | Benefit |
|---------|---------|
| **Type Safety** | No casting, compile-time checks |
| **LLM Awareness** | Actions automatically in AI instructions |
| **Schema Validation** | Payload structure validated automatically |
| **Better Tooling** | Full IntelliSense support |
| **Testability** | Easier to mock and test |
| **Maintainability** | Single source of truth |

## Next Steps

- **[Typed Action Handlers](TYPED_ACTION_HANDLERS.md)** - Advanced typed handler patterns
- **[Custom Widgets](CUSTOM_WIDGETS.md)** - Create custom widget types
- **[Custom AI Tools](CUSTOM_AI_TOOLS.md)** - Add AI-callable tools
- **[Examples](../examples/)** - More complete examples
- **[API Reference](../api/)** - Full API documentation

---

**Back to:** [Guides](README.md) | [Documentation Index](../INDEX.md)
