# Advanced Configuration Example

This example shows advanced features including custom widgets, AI tools, and action handlers.

## Overview

This example demonstrates:
- Multiple custom widgets
- Custom AI tools
- Action handlers
- Database integration
- Error handling

## Key Features

### Custom Widgets
- Rating widget (1-5 stars)
- Progress widget
- Alert widget
- Form widget

### Custom Tools
- Database queries
- External API calls
- User context

### Action Handlers
- Form submission
- Rating submission
- Multi-step workflows

## Code Structure

```
project/
— Program.cs (main setup)
— Handlers/
    — CustomActionHandler.cs
    — CustomToolsProvider.cs
— Models/
    — RatingWidget.cs
    — ProgressWidget.cs
    — AlertWidget.cs
— Services/
    — FormService.cs
    — ToolService.cs
```

## Program.cs Setup

```csharp
using BbQ.ChatWidgets.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddScoped<CustomActionHandler>();
builder.Services.AddScoped<CustomToolsProvider>();
builder.Services.AddDbContext<AppDbContext>();

// Register AI
var openaiClient = new ChatClient("gpt-4o-mini", apiKey)
    .AsIChatClient();

// Register BbQ with custom providers
builder.Services.AddBbQChatWidgets(options =>
{
    options.ChatClientFactory = sp => openaiClient;
    options.ToolProviderFactory = sp => 
        sp.GetRequiredService<CustomToolsProvider>();
});

var app = builder.Build();
app.MapBbQChatEndpoints();
app.Run();
```

## Custom Widgets Example

```csharp
// RatingWidget.cs
public record RatingWidget(
    string Label,
    string Action,
    int MaxRating = 5
) : ChatWidget(Label, Action);

// Register in Program.cs
builder.Services.ConfigureJsonSerializerOptions(options =>
{
    options.AddChatWidgetType<RatingWidget>("rating");
});
```

## Custom Tools Example

```csharp
// CustomToolsProvider.cs
public class CustomToolsProvider : IAIToolsProvider
{
    public IEnumerable<ToolDefinition> GetTools()
    {
        yield return new ToolDefinition
        {
            Name = "get_user_info",
            Description = "Get user information",
            InputSchema = new { /* schema */ }
        };
    }

    public async Task<string> HandleToolCallAsync(
        string toolName,
        Dictionary<string, object> arguments)
    {
        return toolName switch
        {
            "get_user_info" => await GetUserInfoAsync(arguments),
            _ => throw new InvalidOperationException()
        };
    }
}
```

## Action Handler Example

```csharp
// CustomActionHandler.cs
public class CustomActionHandler : IWidgetActionHandler
{
    public async Task<ChatTurn> HandleActionAsync(
        string action,
        Dictionary<string, object> payload,
        string threadId,
        IServiceProvider serviceProvider)
    {
        return action switch
        {
            "submit_rating" => await HandleRatingAsync(payload),
            "submit_form" => await HandleFormAsync(payload),
            _ => throw new InvalidOperationException()
        };
    }

    private async Task<ChatTurn> HandleRatingAsync(
        Dictionary<string, object> payload)
    {
        var rating = (int)payload["rating"];
        // Process rating...
        return new ChatTurn(
            ChatRole.Assistant,
            $"Thank you for rating: {rating}",
            Array.Empty<ChatWidget>(),
            ""
        );
    }
}
```

## Frontend with Custom Widgets

```javascript
function renderWidget(widget) {
    switch(widget.type) {
        case 'button':
            return renderButton(widget);
        case 'rating':
            return renderRating(widget);
        case 'progress':
            return renderProgress(widget);
        default:
            return renderDefault(widget);
    }
}

function renderRating(widget) {
    const div = document.createElement('div');
    for (let i = 1; i <= widget.maxRating; i++) {
        const star = document.createElement('span');
        star.textContent = '?';
        star.style.cursor = 'pointer';
        star.onclick = () => submitRating(i, widget.action);
        div.appendChild(star);
    }
    return div;
}
```

## Database Integration

```csharp
// Store form submissions
public class FormService
{
    private readonly AppDbContext _db;

    public async Task SaveSubmissionAsync(
        string threadId,
        Dictionary<string, object> data)
    {
        var submission = new FormSubmission
        {
            ThreadId = threadId,
            Data = JsonSerializer.Serialize(data),
            CreatedAt = DateTime.UtcNow
        };
        
        _db.FormSubmissions.Add(submission);
        await _db.SaveChangesAsync();
    }
}
```

## Error Handling

```csharp
try
{
    var result = await service.ProcessAsync();
}
catch (ValidationException ex)
{
    return new ChatTurn(
        ChatRole.Assistant,
        $"Validation error: {ex.Message}",
        Array.Empty<ChatWidget>(),
        threadId
    );
}
catch (Exception ex)
{
    logger.LogError(ex, "Processing failed");
    return new ChatTurn(
        ChatRole.Assistant,
        "An error occurred. Please try again.",
        Array.Empty<ChatWidget>(),
        threadId
    );
}
```

## Testing

```csharp
[Fact]
public async Task HandleAction_ValidRating_ReturnsThanks()
{
    var handler = new CustomActionHandler();
    var payload = new Dictionary<string, object> 
    { 
        { "rating", 5 } 
    };

    var result = await handler.HandleActionAsync(
        "submit_rating",
        payload,
        "thread-123",
        new MockServiceProvider());

    Assert.Contains("Thank you", result.Content);
}
```

## Next Steps

- **[CUSTOM_IMPLEMENTATION.md](CUSTOM_IMPLEMENTATION.md)** - Full app example
- **[guides/CUSTOM_WIDGETS.md](../guides/CUSTOM_WIDGETS.md)** - Custom widgets
- **[guides/CUSTOM_AI_TOOLS.md](../guides/CUSTOM_AI_TOOLS.md)** - Custom tools

---

**Back to:** [Examples](README.md) | [Documentation Index](../INDEX.md)
