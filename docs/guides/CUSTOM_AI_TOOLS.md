Custom AI tools guide consolidated into `docs/guides/README.md` and `docs/USAGE.md`.
# Custom AI Tools Guide

Learn how to add custom AI tools that your assistant can use.

## Overview

This guide shows you how to:
1. Understand AI tools and functions
2. Create custom tool definitions
3. Implement tool handlers
4. Register tools with the AI client
5. Use tools in conversations

## Understanding AI Tools

### What Are Tools?

Tools are functions that the AI can call to get information or perform actions:

```csharp
public interface IAIToolsProvider
{
    // Returns the AI-facing tools that the model can call.
    IReadOnlyList<Microsoft.Extensions.AI.AITool> GetAITools();
}
```

### Tool Capabilities

With custom tools, your AI can:
- Fetch real-time data (weather, stock prices)
- Call external APIs
- Access user information
- Perform calculations
- Access your database
- Control external systems

## Creating Custom Tools

### Step 1: Define a Tool Definition

Create a class to provide AI tools. In this project there are two related extension points:

- `IAIToolsProvider` (returns `AITool` instances for the AI client), and
- `IWidgetToolsProvider` (returns `WidgetTool` instances that adapt `ChatWidget` objects).

An example `IAIToolsProvider` implementation (model-facing tools):

```csharp
public class CustomAIToolsProvider : IAIToolsProvider
{
    public IReadOnlyList<Microsoft.Extensions.AI.AITool> GetAITools()
    {
        // Return model-facing tools. For widget-based tools prefer IWidgetToolsProvider/WidgetTool.
        return new List<Microsoft.Extensions.AI.AITool>
        {
            // Construct AITool or reuse the WidgetTool adapter when appropriate.
        };
    }
}
```

If you want to expose widget types to the AI (recommended for widget authors), implement `IWidgetToolsProvider` and return `WidgetTool` instances that wrap `ChatWidget` objects:

```csharp
public class CustomWidgetToolsProvider : IWidgetToolsProvider
{
    public IReadOnlyList<BbQ.ChatWidgets.Models.WidgetTool> GetTools()
    {
        return new List<BbQ.ChatWidgets.Models.WidgetTool>
        {
            new BbQ.ChatWidgets.Models.WidgetTool(
                new BbQ.ChatWidgets.Models.ChatWidget("button") { Label = "Get weather", Action = "get_weather" }
            )
        };
    }
}
```

### Step 2: Register the Tool Provider

```csharp
builder.Services.AddBbQChatWidgets(options =>
{
    options.ChatClientFactory = sp => chatClient;
    options.ToolProviderFactory = sp => new CustomToolsProvider();
});
```

### Step 3: Update AI Instructions

Instruct the AI to use your tools:

```csharp
public class CustomInstructionProvider : IAIInstructionProvider
{
    public string GetSystemInstructions()
    {
        return @"You are a helpful assistant. Use the available tools 
                 to provide accurate, up-to-date information. 
                 Always use get_weather when asked about weather.
                 Always use get_user_profile when asked about the user.";
    }
}

builder.Services.AddBbQChatWidgets(options =>
{
    options.AIInstructionProviderFactory = sp => 
        new CustomInstructionProvider();
});
```

## Complete Example: Database Query Tool

### Backend

```csharp
// Example: register a widget-based tools provider backed by a database
public class DatabaseWidgetToolsProvider : IWidgetToolsProvider
{
    private readonly IDbContextFactory<AppDbContext> _dbFactory;

    public DatabaseWidgetToolsProvider(IDbContextFactory<AppDbContext> dbFactory)
    {
        _dbFactory = dbFactory;
    }

    public IReadOnlyList<BbQ.ChatWidgets.Models.WidgetTool> GetTools()
    {
        // Build WidgetTool instances from database metadata or configuration.
        return new List<BbQ.ChatWidgets.Models.WidgetTool>();
    }
}

// Register it
builder.Services.AddBbQChatWidgets(options =>
{
    options.WidgetToolsProviderFactory = sp =>
        sp.GetRequiredService<DatabaseWidgetToolsProvider>();
});

builder.Services.AddScoped<DatabaseWidgetToolsProvider>();
```

## Common Tool Patterns

### Read-Only Information Tools

```csharp
public class InfoToolsProvider : IWidgetToolsProvider
{
    public IReadOnlyList<BbQ.ChatWidgets.Models.WidgetTool> GetTools()
    {
        return new List<BbQ.ChatWidgets.Models.WidgetTool>
        {
            new BbQ.ChatWidgets.Models.WidgetTool(
                new BbQ.ChatWidgets.Models.ChatWidget("button") { Label = "Company info", Action = "get_company_info" }
            ),
            new BbQ.ChatWidgets.Models.WidgetTool(
                new BbQ.ChatWidgets.Models.ChatWidget("button") { Label = "Pricing", Action = "get_pricing" }
            )
        };
    }
}
```

### External API Integration

```csharp
public class ExternalAPIToolsProvider : IWidgetToolsProvider
{
    private readonly HttpClient _httpClient;

    public ExternalAPIToolsProvider(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public IReadOnlyList<BbQ.ChatWidgets.Models.WidgetTool> GetTools()
    {
        return new List<BbQ.ChatWidgets.Models.WidgetTool>
        {
            new BbQ.ChatWidgets.Models.WidgetTool(
                new BbQ.ChatWidgets.Models.ChatWidget("button") { Label = "Translate", Action = "translate_text" }
            )
        };
    }
}

// Register with HttpClient
builder.Services.AddHttpClient<ExternalAPIToolsProvider>();

builder.Services.AddBbQChatWidgets(options =>
{
    options.WidgetToolsProviderFactory = sp => 
        sp.GetRequiredService<ExternalAPIToolsProvider>();
});
```

### User Context Tools

```csharp
public class UserContextToolsProvider : IWidgetToolsProvider
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly UserService _userService;

    public UserContextToolsProvider(
        IHttpContextAccessor httpContextAccessor,
        UserService userService)
    {
        _httpContextAccessor = httpContextAccessor;
        _userService = userService;
    }

    public IReadOnlyList<BbQ.ChatWidgets.Models.WidgetTool> GetTools()
    {
        return new List<BbQ.ChatWidgets.Models.WidgetTool>
        {
            new BbQ.ChatWidgets.Models.WidgetTool(
                new BbQ.ChatWidgets.Models.ChatWidget("button") { Label = "User preferences", Action = "get_user_preferences" }
            )
        };
    }
}
```

## Tool Design Guidelines

### Do's ?
- Make tool names descriptive
- Include detailed descriptions
- Validate input parameters
- Handle errors gracefully
- Document required fields
- Return structured JSON
- Cache results when appropriate
- Log tool usage

### Don'ts ?
- Don't create tools that are too generic
- Don't forget parameter descriptions
- Don't skip validation
- Don't expose sensitive data
- Don't make synchronous blocking calls
- Don't ignore rate limits
- Don't return unformatted data

## Tool Input Validation

```csharp
public async Task<string> ExecuteToolAsync(
    string toolName,
    Dictionary<string, object> arguments)
{
    // Validate required parameters
    if (!arguments.ContainsKey("userId"))
        return "{\"error\": \"userId is required\"}";

    var userId = arguments["userId"];
    if (string.IsNullOrEmpty(userId.ToString()))
        return "{\"error\": \"userId cannot be empty\"}";

    // Validate parameter types
    if (!int.TryParse(userId.ToString(), out int id))
        return "{\"error\": \"userId must be a valid integer\"}";

    // Proceed with valid data
    return await GetUserAsync(id);
}
```

## Quick Comparison: Tools vs Widgets

Short decision guide:

- Use **AI tools** (`IAIToolsProvider` / `ToolProviderFactory`) when you need the model to call functions that perform backend work (search, translate, query DB). These return `AITool` instances.
- Use **Widget tools** (`IWidgetToolsProvider` / `WidgetToolsProviderFactory`) when you want the model to understand and embed interactive UI widgets (buttons, forms, cards). These return `WidgetTool` instances that wrap `ChatWidget` objects.

Example `IAIToolsProvider` snippet (simple function/tool):

```csharp
public class SampleAIToolsProvider : IAIToolsProvider
{
    public IReadOnlyList<Microsoft.Extensions.AI.AITool> GetAITools()
    {
        return new List<Microsoft.Extensions.AI.AITool>
        {
            new Microsoft.Extensions.AI.AITool("translate_text", "Translate text to another language")
        };
    }
}
```

Example `IWidgetToolsProvider` snippet (widget adapter):

```csharp
public class SampleWidgetToolsProvider : IWidgetToolsProvider
{
    public IReadOnlyList<BbQ.ChatWidgets.Models.WidgetTool> GetTools()
    {
        return new List<BbQ.ChatWidgets.Models.WidgetTool>
        {
            new BbQ.ChatWidgets.Models.WidgetTool(
                new BbQ.ChatWidgets.Models.ChatWidget("button") { Label = "Translate", Action = "translate_text" }
            )
        };
    }
}
```

## Error Handling

```csharp
public async Task<string> ExecuteToolAsync(
    string toolName,
    Dictionary<string, object> arguments)
{
    try
    {
        return toolName switch
        {
            "get_data" => await GetDataAsync(arguments),
            _ => throw new InvalidOperationException(
                $"Unknown tool: {toolName}")
        };
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Tool execution failed");
        return $"{{\"error\": \"{ex.Message}\"}}";
    }
}
```

## Next Steps

- **[Custom Widgets](CUSTOM_WIDGETS.md)** - Create custom widgets
- **[Custom Actions](CUSTOM_ACTION_HANDLERS.md)** - Handle widget actions
- **[Examples](../examples/)** - See working examples
- **[API Reference](../api/)** - Detailed API docs

---

**Back to:** [Guides](README.md) | [Documentation Index](../INDEX.md)
