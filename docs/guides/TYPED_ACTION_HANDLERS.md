# Typed Action Handlers Guide

Learn how to create and register strongly-typed action handlers using `IWidgetAction<T>` and `IActionWidgetActionHandler<TWidgetAction, T>`.

## Overview

The new typed action handler system provides:
- **Type Safety**: Payloads are strongly typed, eliminating casting errors
- **LLM Awareness**: Actions are dynamically registered and exposed in AI instructions
- **Automatic Routing**: Handlers are resolved by action name and invoked correctly
- **Schema Generation**: Payload schemas are automatically included in LLM instructions

## Core Concepts

### IWidgetAction<T>
Represents an action definition with typed payload:
```csharp
public interface IWidgetAction<T>
{
    string Name { get; }              // Unique action identifier
    string Description { get; }       // Human-readable description
    string PayloadSchema { get; }     // JSON schema for LLM awareness
}
```

### IActionWidgetActionHandler<TWidgetAction, T>
Handles an action with type-safe payload:
```csharp
public interface IActionWidgetActionHandler<TWidgetAction, T> 
    where TWidgetAction : IWidgetAction<T>
{
    Task<ChatTurn> HandleActionAsync(
        TWidgetAction action,
        T payload,
        string threadId,
        IServiceProvider serviceProvider);
}
```

## Example: Form Submission Action

### Step 1: Define the Payload Type
```csharp
namespace MyApp.Actions;

/// <summary>
/// Payload for form submission action.
/// </summary>
public sealed record FormSubmissionPayload(
    string Name,
    string Email,
    string Phone
);
```

### Step 2: Define the Action
```csharp
using BbQ.ChatWidgets.Abstractions;
using System.Text.Json;

namespace MyApp.Actions;

/// <summary>
/// Action for form submission with validation.
/// </summary>
public sealed class FormSubmissionAction : IWidgetAction<FormSubmissionPayload>
{
    public string Name => "submit_form";

    public string Description => 
        "Handles form submission with name, email, and phone validation.";

    public string PayloadSchema =>
        JsonSerializer.Serialize(new
        {
            name = "string (required, max 100 chars)",
            email = "string (required, valid email)",
            phone = "string (required, 10+ digits)"
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
/// Handler for form submission actions with validation and persistence.
/// </summary>
public sealed class FormSubmissionHandler : 
    IActionWidgetActionHandler<FormSubmissionAction, FormSubmissionPayload>
{
    private readonly IFormRepository _repository;
    private readonly ILogger<FormSubmissionHandler> _logger;
    private readonly IEmailService _emailService;

    public FormSubmissionHandler(
        IFormRepository repository,
        ILogger<FormSubmissionHandler> logger,
        IEmailService emailService)
    {
        _repository = repository;
        _logger = logger;
        _emailService = emailService;
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
                "Processing form submission for {Email}",
                payload.Email);

            // Validation (type-safe, no casting needed)
            ValidatePayload(payload);

            // Business logic
            var submission = await _repository.SaveFormAsync(new FormData
            {
                Name = payload.Name,
                Email = payload.Email,
                Phone = payload.Phone,
                ThreadId = threadId,
                SubmittedAt = DateTime.UtcNow
            });

            // Send confirmation email
            await _emailService.SendConfirmationAsync(payload.Email, submission.Id);

            // Return response with confirmation widget
            return new ChatTurn(
                ChatRole.Assistant,
                $"Thank you, {payload.Name}! We've received your submission and sent a confirmation email to {payload.Email}.",
                new[]
                {
                    new ButtonWidget(
                        Label: "View Status",
                        Action: "check_status"
                    )
                },
                threadId
            );
        }
        catch (ValidationException ex)
        {
            _logger.LogWarning(ex, "Form validation failed");
            return new ChatTurn(
                ChatRole.Assistant,
                $"Validation error: {ex.Message}",
                Array.Empty<ChatWidget>(),
                threadId
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Form submission failed");
            return new ChatTurn(
                ChatRole.Assistant,
                "An error occurred while processing your submission. Please try again.",
                Array.Empty<ChatWidget>(),
                threadId
            );
        }
    }

    private void ValidatePayload(FormSubmissionPayload payload)
    {
        if (string.IsNullOrWhiteSpace(payload.Name) || payload.Name.Length > 100)
            throw new ValidationException("Name must be 1-100 characters");

        if (!IsValidEmail(payload.Email))
            throw new ValidationException("Email must be valid");

        if (string.IsNullOrWhiteSpace(payload.Phone) || payload.Phone.Length < 10)
            throw new ValidationException("Phone must be at least 10 digits");
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
```

### Step 4: Register in DI Container
```csharp
// Program.cs
using MyApp.Actions;
using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Services;

var builder = WebApplicationBuilder.CreateBuilder(args);

// Register repositories and services
builder.Services.AddScoped<IFormRepository, FormRepository>();
builder.Services.AddScoped<IEmailService, EmailService>();

// Register BbQ ChatWidgets
builder.Services.AddBbQChatWidgets(options =>
{
    options.ChatClientFactory = sp => new OpenAIChatClient("API_KEY");
});

// Register the typed action and handler
var actionRegistry = builder.Services.BuildServiceProvider()
    .GetRequiredService<IWidgetActionRegistry>();
var handlerResolver = builder.Services.BuildServiceProvider()
    .GetRequiredService<IWidgetActionHandlerResolver>();

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

builder.Services.AddScoped<FormSubmissionHandler>();

var app = builder.Build();
app.MapBbQChatEndpoints();
app.Run();
```

## Advanced: Multiple Actions per Handler

You can handle multiple related actions in a single handler:

```csharp
/// <summary>
/// Handler for multi-step form process.
/// </summary>
public sealed class MultiStepFormHandler :
    IActionWidgetActionHandler<Step1SubmitAction, Step1Payload>,
    IActionWidgetActionHandler<Step2SubmitAction, Step2Payload>,
    IActionWidgetActionHandler<Step3SubmitAction, Step3Payload>
{
    public async Task<ChatTurn> HandleActionAsync(
        Step1SubmitAction action,
        Step1Payload payload,
        string threadId,
        IServiceProvider serviceProvider)
    {
        // Handle step 1
        return ProcessStep1(payload, threadId);
    }

    public async Task<ChatTurn> HandleActionAsync(
        Step2SubmitAction action,
        Step2Payload payload,
        string threadId,
        IServiceProvider serviceProvider)
    {
        // Handle step 2
        return ProcessStep2(payload, threadId);
    }

    public async Task<ChatTurn> HandleActionAsync(
        Step3SubmitAction action,
        Step3Payload payload,
        string threadId,
        IServiceProvider serviceProvider)
    {
        // Handle step 3
        return ProcessStep3(payload, threadId);
    }

    // ... implementation details
}
```

## LLM Instructions Integration

The system automatically includes registered actions in AI instructions:

```
## Registered Actions

The following actions are available for widgets:
- **submit_form**: Handles form submission with name, email, and phone validation.
  Payload: {"name":"string (required, max 100 chars)","email":"string (required, valid email)","phone":"string (required, 10+ digits)"}

- **check_status**: Check the status of a submitted form.
  Payload: {"submissionId":"string"}

- **update_preferences**: Update user preferences.
  Payload: {"theme":"dark|light","language":"en|fr|es"}
```

The LLM uses this information to generate widgets with correct action names and payload structures.

## Error Handling Best Practices

```csharp
public async Task<ChatTurn> HandleActionAsync(
    MyAction action,
    MyPayload payload,
    string threadId,
    IServiceProvider serviceProvider)
{
    try
    {
        // Validate payload immediately
        if (string.IsNullOrEmpty(payload.RequiredField))
            throw new ValidationException("RequiredField is required");

        // Perform business logic
        var result = await ProcessAsync(payload);

        // Return success response
        return CreateSuccessResponse(result, threadId);
    }
    catch (ValidationException ex)
    {
        _logger.LogWarning("Validation failed: {Message}", ex.Message);
        // Return user-friendly error
        return new ChatTurn(
            ChatRole.Assistant,
            $"Please check your input: {ex.Message}",
            Array.Empty<ChatWidget>(),
            threadId
        );
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Unexpected error in action handler");
        // Return generic error
        return new ChatTurn(
            ChatRole.Assistant,
            "An error occurred. Please try again later.",
            Array.Empty<ChatWidget>(),
            threadId
        );
    }
}
```

## Testing Typed Handlers

```csharp
[Fact]
public async Task FormSubmissionHandler_ValidPayload_SavesAndReturnsConfirmation()
{
    // Arrange
    var mockRepo = new Mock<IFormRepository>();
    var mockEmail = new Mock<IEmailService>();
    var mockLogger = new Mock<ILogger<FormSubmissionHandler>>();

    mockRepo.Setup(r => r.SaveFormAsync(It.IsAny<FormData>()))
        .ReturnsAsync(new FormSubmission { Id = "123" });

    var handler = new FormSubmissionHandler(mockRepo.Object, mockLogger.Object, mockEmail.Object);
    var action = new FormSubmissionAction();
    var payload = new FormSubmissionPayload("John Doe", "john@example.com", "5551234567");

    // Act
    var result = await handler.HandleActionAsync(
        action,
        payload,
        "thread-123",
        new ServiceCollection().BuildServiceProvider());

    // Assert
    Assert.Equal(ChatRole.Assistant, result.Role);
    Assert.Contains("received", result.Content.ToLower());
    mockRepo.Verify(r => r.SaveFormAsync(It.IsAny<FormData>()), Times.Once);
    mockEmail.Verify(e => e.SendConfirmationAsync(payload.Email, "123"), Times.Once);
}

[Fact]
public async Task FormSubmissionHandler_InvalidEmail_ReturnsValidationError()
{
    // Arrange
    var handler = new FormSubmissionHandler(
        new Mock<IFormRepository>().Object,
        new Mock<ILogger<FormSubmissionHandler>>().Object,
        new Mock<IEmailService>().Object);
    
    var action = new FormSubmissionAction();
    var payload = new FormSubmissionPayload("John Doe", "invalid-email", "5551234567");

    // Act
    var result = await handler.HandleActionAsync(
        action,
        payload,
        "thread-123",
        new ServiceCollection().BuildServiceProvider());

    // Assert
    Assert.Contains("validation", result.Content.ToLower());
}
```

## Benefits Summary

| Feature | Benefit |
|---------|---------|
| **Type Safety** | No casting, compile-time checks, IntelliSense support |
| **LLM Awareness** | Actions automatically appear in AI instructions with schemas |
| **Error Prevention** | Payload schema mismatches caught early |
| **Testability** | Easy to mock and test with typed payloads |
| **Maintainability** | Single source of truth for action definitions |
| **Scalability** | Add new actions without modifying core services |

## Migration from Legacy IWidgetActionHandler

If you have existing handlers using `IWidgetActionHandler`:

```csharp
// Old way
public class OldHandler : IWidgetActionHandler
{
    public async Task<ChatTurn> HandleActionAsync(
        string action,
        Dictionary<string, object> payload,
        string threadId,
        IServiceProvider serviceProvider)
    {
        if (action == "my_action")
        {
            var value = payload["field"].ToString(); // Casting, error-prone
            // ...
        }
    }
}

// New way
public record MyPayload(string Field);

public class MyAction : IWidgetAction<MyPayload>
{
    public string Name => "my_action";
    public string Description => "Description";
    public string PayloadSchema => "{}";
}

public class NewHandler : IActionWidgetActionHandler<MyAction, MyPayload>
{
    public async Task<ChatTurn> HandleActionAsync(
        MyAction action,
        MyPayload payload,
        string threadId,
        IServiceProvider serviceProvider)
    {
        var value = payload.Field; // Type-safe, no casting
        // ...
    }
}
```

Both systems can coexist during migration.

## Next Steps

- **[Custom Widgets](CUSTOM_WIDGETS.md)** - Create custom widget types
- **[Custom AI Tools](CUSTOM_AI_TOOLS.md)** - Add AI-callable tools
- **[Examples](../examples/)** - More complete examples
- **[API Reference](../api/)** - Full API documentation

---

**Back to:** [Guides](README.md) | [Documentation Index](../INDEX.md)
