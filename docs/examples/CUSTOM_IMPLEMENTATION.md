# Custom Implementation Example

A complete production-ready implementation with all features.

## Overview

This example includes:
- Complete ASP.NET Core application
- Multiple custom widgets
- Custom AI tools with database
- Action handlers with validation
- Error handling and logging
- Unit tests

## Architecture

```
CustomChatApp/
??? Program.cs
??? Controllers/
?   ??? ChatController.cs
??? Models/
?   ??? Domain/
?   ??? DTOs/
??? Services/
?   ??? ToolsProvider.cs
?   ??? ActionHandler.cs
?   ??? ValidationService.cs
??? Data/
?   ??? AppDbContext.cs
?   ??? Migrations/
??? Tests/
    ??? ChatServiceTests.cs
```

## Program.cs

```csharp
using BbQ.ChatWidgets.Extensions;
using CustomChatApp.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=chat.db"));

// Services
builder.Services.AddScoped<CustomToolsProvider>();
builder.Services.AddScoped<CustomActionHandler>();
builder.Services.AddScoped<ValidationService>();

// OpenAI
var openaiClient = new ChatClient("gpt-4o-mini", apiKey)
    .AsIChatClient();

// BbQ ChatWidgets
builder.Services.AddBbQChatWidgets(options =>
{
    options.ChatClientFactory = sp => openaiClient;
    options.ToolProviderFactory = sp => 
        sp.GetRequiredService<CustomToolsProvider>();
});

var app = builder.Build();
app.UseStaticFiles();
app.MapBbQChatEndpoints();
app.Run();
```

## Custom Widgets

```csharp
// Models/CustomWidgets.cs
public record RatingWidget(
    string Label,
    string Action,
    int MaxRating = 5,
    string? Placeholder = null
) : ChatWidget(Label, Action);

public record ProgressWidget(
    string Label,
    string Action,
    int Current,
    int Total,
    string? Color = null
) : ChatWidget(Label, Action);

public record FormWidget(
    string Label,
    string Action,
    Dictionary<string, FieldDefinition> Fields
) : ChatWidget(Label, Action);

public record FieldDefinition(
    string Type, // text, email, password, number
    string? Placeholder = null,
    int? MinLength = null,
    int? MaxLength = null,
    bool Required = false
);
```

## Custom Tools Provider

```csharp
// Services/CustomToolsProvider.cs
public class CustomToolsProvider : IAIToolsProvider
{
    private readonly AppDbContext _db;
    private readonly ILogger<CustomToolsProvider> _logger;

    public CustomToolsProvider(
        AppDbContext db,
        ILogger<CustomToolsProvider> logger)
    {
        _db = db;
        _logger = logger;
    }

    public IEnumerable<ToolDefinition> GetTools()
    {
        yield return new ToolDefinition
        {
            Name = "search_products",
            Description = "Search products by keyword",
            InputSchema = new
            {
                type = "object",
                properties = new
                {
                    keyword = new { type = "string" },
                    maxResults = new { type = "integer" }
                },
                required = new[] { "keyword" }
            }
        };

        yield return new ToolDefinition
        {
            Name = "get_user_profile",
            Description = "Get current user profile",
            InputSchema = new { type = "object" }
        };
    }

    public async Task<string> HandleToolCallAsync(
        string toolName,
        Dictionary<string, object> arguments)
    {
        try
        {
            return toolName switch
            {
                "search_products" => 
                    await SearchProductsAsync(arguments),
                "get_user_profile" => 
                    await GetUserProfileAsync(),
                _ => throw new InvalidOperationException()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Tool failed: {Tool}", toolName);
            throw;
        }
    }

    private async Task<string> SearchProductsAsync(
        Dictionary<string, object> args)
    {
        var keyword = (string)args["keyword"];
        var maxResults = args.TryGetValue("maxResults", out var mr) 
            ? Convert.ToInt32(mr) : 10;

        var products = await _db.Products
            .Where(p => EF.Functions.Like(p.Name, $"%{keyword}%"))
            .Take(maxResults)
            .Select(p => new { p.Id, p.Name, p.Price })
            .ToListAsync();

        return JsonSerializer.Serialize(products);
    }

    private async Task<string> GetUserProfileAsync()
    {
        var user = new { Id = 1, Name = "John Doe" };
        return JsonSerializer.Serialize(user);
    }
}
```

## Custom Action Handler

```csharp
// Services/CustomActionHandler.cs
public class CustomActionHandler : IWidgetActionHandler
{
    private readonly AppDbContext _db;
    private readonly ValidationService _validator;
    private readonly ILogger<CustomActionHandler> _logger;

    public CustomActionHandler(
        AppDbContext db,
        ValidationService validator,
        ILogger<CustomActionHandler> logger)
    {
        _db = db;
        _validator = validator;
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
            _logger.LogInformation("Handling action: {Action}", action);

            return action switch
            {
                "submit_rating" => 
                    await HandleRatingAsync(payload, threadId),
                "submit_form" => 
                    await HandleFormAsync(payload, threadId),
                "confirm_order" => 
                    await HandleOrderAsync(payload, threadId),
                _ => throw new InvalidOperationException(
                    $"Unknown action: {action}")
            };
        }
        catch (ValidationException ex)
        {
            _logger.LogWarning(ex, "Validation failed");
            return ErrorTurn(ex.Message, threadId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Action failed");
            return ErrorTurn("An error occurred", threadId);
        }
    }

    private async Task<ChatTurn> HandleRatingAsync(
        Dictionary<string, object> payload,
        string threadId)
    {
        var rating = Convert.ToInt32(payload["rating"]);
        
        if (rating < 1 || rating > 5)
            throw new ValidationException("Rating must be 1-5");

        var submission = new RatingSubmission
        {
            ThreadId = threadId,
            Rating = rating,
            CreatedAt = DateTime.UtcNow
        };

        _db.RatingSubmissions.Add(submission);
        await _db.SaveChangesAsync();

        return new ChatTurn(
            ChatRole.Assistant,
            $"Thanks for rating {rating}/5! Your feedback helps us improve.",
            Array.Empty<ChatWidget>(),
            threadId
        );
    }

    private async Task<ChatTurn> HandleFormAsync(
        Dictionary<string, object> payload,
        string threadId)
    {
        var validationErrors = await _validator
            .ValidateFormAsync(payload);
        
        if (validationErrors.Any())
            throw new ValidationException(
                string.Join(", ", validationErrors));

        var submission = new FormSubmission
        {
            ThreadId = threadId,
            Data = JsonSerializer.Serialize(payload),
            CreatedAt = DateTime.UtcNow
        };

        _db.FormSubmissions.Add(submission);
        await _db.SaveChangesAsync();

        return new ChatTurn(
            ChatRole.Assistant,
            "Form submitted successfully!",
            Array.Empty<ChatWidget>(),
            threadId
        );
    }

    private ChatTurn ErrorTurn(
        string message,
        string threadId) =>
        new ChatTurn(
            ChatRole.Assistant,
            $"Error: {message}",
            Array.Empty<ChatWidget>(),
            threadId
        );
}
```

## Tests

```csharp
// Tests/ChatServiceTests.cs
public class ChatServiceTests
{
    [Fact]
    public async Task HandleRating_ValidInput_SavesToDatabase()
    {
        // Arrange
        var dbContext = CreateInMemoryDb();
        var handler = new CustomActionHandler(
            dbContext,
            new ValidationService(),
            new MockLogger());

        var payload = new Dictionary<string, object>
        {
            { "rating", 5 }
        };

        // Act
        var result = await handler.HandleActionAsync(
            "submit_rating",
            payload,
            "thread-123",
            new MockServiceProvider());

        // Assert
        Assert.Contains("Thanks", result.Content);
        Assert.Single(dbContext.RatingSubmissions);
    }

    [Fact]
    public async Task HandleRating_InvalidRating_ThrowsException()
    {
        var handler = new CustomActionHandler(...);
        var payload = new Dictionary<string, object>
        {
            { "rating", 10 }
        };

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(
            () => handler.HandleActionAsync(
                "submit_rating",
                payload,
                "thread-123",
                ...));
    }
}
```

## Database Models

```csharp
public class AppDbContext : DbContext
{
    public DbSet<Product> Products { get; set; }
    public DbSet<FormSubmission> FormSubmissions { get; set; }
    public DbSet<RatingSubmission> RatingSubmissions { get; set; }

    protected override void OnConfiguring(
        DbContextOptionsBuilder options)
    {
        options.UseSqlite("Data Source=chat.db");
    }
}

public class RatingSubmission
{
    public int Id { get; set; }
    public string ThreadId { get; set; }
    public int Rating { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class FormSubmission
{
    public int Id { get; set; }
    public string ThreadId { get; set; }
    public string Data { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

## Key Features

? Database integration
? Error handling & logging
? Input validation
? Custom widgets & tools
? Action handlers
? Unit tests
? TypeScript support

## Next Steps

- Deploy to production
- Add authentication
- Implement caching
- Scale to multiple instances

---

**Back to:** [Examples](README.md) | [Documentation Index](../INDEX.md)
