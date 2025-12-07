# Custom Action Handlers Guide

Learn how to handle widget interactions and custom actions.

## Overview

This guide shows you how to:
1. Understand widget actions
2. Create action handlers
3. Register action handlers
4. Process widget data
5. Generate responses

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

## Creating Action Handlers

### Step 1: Implement IWidgetActionHandler

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

            // Validate payload
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

        // Process the form (save to database, send email, etc.)
        // This is a mock implementation
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
        catch
        {
            return false;
        }
    }
}

public record FormSubmissionResult(bool Success, string SubmissionId);
```

### Step 2: Register the Handler

```csharp
builder.Services.AddScoped<IWidgetActionHandler, 
    FormSubmissionActionHandler>();

builder.Services.AddBbQChatWidgets(options =>
{
    options.ChatClientFactory = sp => chatClient;
});
```

## Common Action Patterns

### Button Click

```csharp
public class ButtonActionHandler : IWidgetActionHandler
{
    public async Task<ChatTurn> HandleActionAsync(
        string action,
        Dictionary<string, object> payload,
        string threadId,
        IServiceProvider serviceProvider)
    {
        var message = action switch
        {
            "confirm" => "You confirmed the action.",
            "cancel" => "Action was cancelled.",
            "try_again" => "Let's try again. What would you like?",
            _ => throw new InvalidOperationException()
        };

        return new ChatTurn(
            ChatRole.Assistant,
            message,
            Array.Empty<ChatWidget>(),
            threadId
        );
    }
}
```

### Form Input

```csharp
public class InputActionHandler : IWidgetActionHandler
{
    private readonly UserService _userService;

    public InputActionHandler(UserService userService)
    {
        _userService = userService;
    }

    public async Task<ChatTurn> HandleActionAsync(
        string action,
        Dictionary<string, object> payload,
        string threadId,
        IServiceProvider serviceProvider)
    {
        var input = payload["value"].ToString();

        if (action == "save_name")
        {
            await _userService.SaveUserNameAsync(input);
            return new ChatTurn(
                ChatRole.Assistant,
                $"Nice to meet you, {input}!",
                Array.Empty<ChatWidget>(),
                threadId
            );
        }

        throw new InvalidOperationException($"Unknown action: {action}");
    }
}
```

### Dropdown Selection

```csharp
public class DropdownActionHandler : IWidgetActionHandler
{
    public async Task<ChatTurn> HandleActionAsync(
        string action,
        Dictionary<string, object> payload,
        string threadId,
        IServiceProvider serviceProvider)
    {
        var selectedOption = payload["selected"].ToString();

        var (message, widgets) = selectedOption switch
        {
            "option1" => 
                ("You selected Option 1. Here's what happens next...",
                 new ChatWidget[] { new ButtonWidget("Continue", "continue") }),
            "option2" => 
                ("You selected Option 2. Let me show you details...",
                 new ChatWidget[] { new CardWidget("Details", "view_details") }),
            _ => throw new InvalidOperationException()
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

### File Upload

```csharp
public class FileUploadActionHandler : IWidgetActionHandler
{
    private readonly FileStorageService _fileService;

    public FileUploadActionHandler(FileStorageService fileService)
    {
        _fileService = fileService;
    }

    public async Task<ChatTurn> HandleActionAsync(
        string action,
        Dictionary<string, object> payload,
        string threadId,
        IServiceProvider serviceProvider)
    {
        if (action != "upload_document")
            throw new InvalidOperationException();

        var fileData = payload["file"].ToString();
        var fileName = payload["fileName"].ToString();

        // Process file
        var fileId = await _fileService.StoreFileAsync(
            fileName,
            fileData);

        return new ChatTurn(
            ChatRole.Assistant,
            $"File '{fileName}' uploaded successfully!",
            new[]
            {
                new ButtonWidget("Process File", "process_file")
            },
            threadId
        );
    }
}
```

## Complete Example: Multi-Step Form

### Action Handler

```csharp
public class MultiStepFormHandler : IWidgetActionHandler
{
    private readonly FormDataService _formService;
    private readonly IThreadService _threadService;

    public MultiStepFormHandler(
        FormDataService formService,
        IThreadService threadService)
    {
        _formService = formService;
        _threadService = threadService;
    }

    public async Task<ChatTurn> HandleActionAsync(
        string action,
        Dictionary<string, object> payload,
        string threadId,
        IServiceProvider serviceProvider)
    {
        return action switch
        {
            "step1_submit" => await HandleStep1Async(payload, threadId),
            "step2_submit" => await HandleStep2Async(payload, threadId),
            "step3_submit" => await HandleStep3Async(payload, threadId),
            _ => throw new InvalidOperationException($"Unknown action: {action}")
        };
    }

    private async Task<ChatTurn> HandleStep1Async(
        Dictionary<string, object> payload,
        string threadId)
    {
        var name = payload["name"].ToString();
        var email = payload["email"].ToString();

        await _formService.SaveStep1Async(threadId, name, email);

        return new ChatTurn(
            ChatRole.Assistant,
            "Great! Now let's get some details about your company.",
            new ChatWidget[]
            {
                new InputWidget(
                    Label: "Company Name",
                    Action: "step2_submit",
                    Placeholder: "Enter company name"
                )
            },
            threadId
        );
    }

    private async Task<ChatTurn> HandleStep2Async(
        Dictionary<string, object> payload,
        string threadId)
    {
        var companyName = payload["companyName"].ToString();

        await _formService.SaveStep2Async(threadId, companyName);

        return new ChatTurn(
            ChatRole.Assistant,
            "Perfect! Finally, tell us about your needs.",
            new ChatWidget[]
            {
                new DropdownWidget(
                    Label: "What are your main needs?",
                    Action: "step3_submit",
                    Options: new[]
                    {
                        "Sales",
                        "Marketing",
                        "Support",
                        "Other"
                    }
                )
            },
            threadId
        );
    }

    private async Task<ChatTurn> HandleStep3Async(
        Dictionary<string, object> payload,
        string threadId)
    {
        var needs = payload["selected"].ToString();

        await _formService.SaveStep3Async(threadId, needs);

        return new ChatTurn(
            ChatRole.Assistant,
            "Thank you for completing the form! " +
            "We'll be in touch shortly.",
            Array.Empty<ChatWidget>(),
            threadId
        );
    }
}
```

## Error Handling

```csharp
public class SafeActionHandler : IWidgetActionHandler
{
    private readonly ILogger<SafeActionHandler> _logger;

    public SafeActionHandler(ILogger<SafeActionHandler> logger)
    {
        _logger = logger;
    }

    public async Task<ChatTurn> HandleActionAsync(
        string action,
        Dictionary<string, object> payload,
        string threadId,
        IServiceProvider serviceProvider)
    {
        try
        {
            return await ProcessActionAsync(action, payload, threadId);
        }
        catch (ValidationException ex)
        {
            _logger.LogWarning(ex, "Validation failed");
            return new ChatTurn(
                ChatRole.Assistant,
                $"There was an issue: {ex.Message}",
                Array.Empty<ChatWidget>(),
                threadId
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Action handler failed");
            return new ChatTurn(
                ChatRole.Assistant,
                "An error occurred. Please try again later.",
                Array.Empty<ChatWidget>(),
                threadId
            );
        }
    }

    private async Task<ChatTurn> ProcessActionAsync(
        string action,
        Dictionary<string, object> payload,
        string threadId)
    {
        // Implementation here
        return new ChatTurn(ChatRole.Assistant, "", 
            Array.Empty<ChatWidget>(), threadId);
    }
}
```

## Best Practices

### Do's ✅
- Validate all input
- Log important actions
- Handle errors gracefully
- Provide user feedback
- Use dependency injection
- Return clear messages
- Validate thread ownership
- Sanitize user data

### Don'ts ❌
- Don't trust client input
- Don't expose sensitive data
- Don't make blocking calls
- Don't skip error handling
- Don't hardcode values
- Don't ignore security
- Don't return raw exceptions

## Testing Actions

```csharp
[Fact]
public async Task HandleAction_ValidPayload_ReturnsCorrectResponse()
{
    // Arrange
    var handler = new FormSubmissionActionHandler(
        new MockThreadService(),
        new MockLogger());

    var payload = new Dictionary<string, object>
    {
        { "name", "John Doe" },
        { "email", "john@example.com" }
    };

    // Act
    var result = await handler.HandleActionAsync(
        "submit_form",
        payload,
        "thread-123",
        new MockServiceProvider());

    // Assert
    Assert.NotNull(result);
    Assert.Contains("received", result.Content.ToLower());
}
```

## Next Steps

- **[Custom Widgets](CUSTOM_WIDGETS.md)** - Create custom widgets
- **[Custom AI Tools](CUSTOM_AI_TOOLS.md)** - Add AI tools
- **[Examples](../examples/)** - See working examples
- **[API Reference](../api/)** - Detailed API docs

---

**Back to:** [Guides](README.md) | [Documentation Index](../INDEX.md)
