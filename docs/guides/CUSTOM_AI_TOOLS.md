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
    IEnumerable<ToolDefinition> GetTools();
    Task<string> HandleToolCallAsync(
        string toolName,
        Dictionary<string, object> arguments);
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

Create a class to provide tool definitions:

```csharp
public class CustomToolsProvider : IAIToolsProvider
{
    public IEnumerable<ToolDefinition> GetTools()
    {
        yield return new ToolDefinition
        {
            Name = "get_weather",
            Description = "Get current weather for a city",
            InputSchema = new
            {
                type = "object",
                properties = new
                {
                    city = new
                    {
                        type = "string",
                        description = "City name"
                    },
                    units = new
                    {
                        type = "string",
                        description = "Temperature units (celsius/fahrenheit)",
                        @enum = new[] { "celsius", "fahrenheit" }
                    }
                },
                required = new[] { "city" }
            }
        };

        yield return new ToolDefinition
        {
            Name = "get_user_profile",
            Description = "Get current user's profile information",
            InputSchema = new
            {
                type = "object",
                properties = new { },
                required = new string[] { }
            }
        };
    }

    public async Task<string> HandleToolCallAsync(
        string toolName,
        Dictionary<string, object> arguments)
    {
        return toolName switch
        {
            "get_weather" => await GetWeatherAsync(arguments),
            "get_user_profile" => await GetUserProfileAsync(arguments),
            _ => throw new InvalidOperationException($"Unknown tool: {toolName}")
        };
    }

    private async Task<string> GetWeatherAsync(
        Dictionary<string, object> arguments)
    {
        var city = (string)arguments["city"];
        var units = arguments.TryGetValue("units", out var u) 
            ? (string)u 
            : "celsius";

        // Call weather API
        // This is a mock implementation
        return $@"{{
            ""city"": ""{city}"",
            ""temperature"": 22,
            ""units"": ""{units}"",
            ""condition"": ""Sunny""
        }}";
    }

    private async Task<string> GetUserProfileAsync(
        Dictionary<string, object> arguments)
    {
        // Get user from context
        return @"{
            ""name"": ""John Doe"",
            ""email"": ""john@example.com"",
            ""subscription"": ""premium""
        }";
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
public class DatabaseToolsProvider : IAIToolsProvider
{
    private readonly IDbContextFactory<AppDbContext> _dbFactory;

    public DatabaseToolsProvider(
        IDbContextFactory<AppDbContext> dbFactory)
    {
        _dbFactory = dbFactory;
    }

    public IEnumerable<ToolDefinition> GetTools()
    {
        yield return new ToolDefinition
        {
            Name = "query_products",
            Description = "Search for products in the database",
            InputSchema = new
            {
                type = "object",
                properties = new
                {
                    keyword = new
                    {
                        type = "string",
                        description = "Search keyword"
                    },
                    maxResults = new
                    {
                        type = "integer",
                        description = "Maximum number of results",
                        minimum = 1,
                        maximum = 100
                    }
                },
                required = new[] { "keyword" }
            }
        };
    }

    public async Task<string> HandleToolCallAsync(
        string toolName,
        Dictionary<string, object> arguments)
    {
        if (toolName != "query_products")
            throw new InvalidOperationException($"Unknown tool: {toolName}");

        var keyword = (string)arguments["keyword"];
        var maxResults = arguments.TryGetValue("maxResults", out var mr)
            ? Convert.ToInt32(mr)
            : 10;

        using var context = await _dbFactory.CreateDbContextAsync();

        var products = await context.Products
            .Where(p => p.Name.Contains(keyword) || 
                       p.Description.Contains(keyword))
            .Take(maxResults)
            .ToListAsync();

        return JsonSerializer.Serialize(products);
    }
}

// Register it
builder.Services.AddBbQChatWidgets(options =>
{
    options.ToolProviderFactory = sp => 
        sp.GetRequiredService<DatabaseToolsProvider>();
});

builder.Services.AddScoped<DatabaseToolsProvider>();
```

## Common Tool Patterns

### Read-Only Information Tools

```csharp
public class InfoToolsProvider : IAIToolsProvider
{
    public IEnumerable<ToolDefinition> GetTools()
    {
        yield return new ToolDefinition
        {
            Name = "get_company_info",
            Description = "Get company information",
            InputSchema = new { type = "object", properties = new { } }
        };

        yield return new ToolDefinition
        {
            Name = "get_pricing",
            Description = "Get current pricing",
            InputSchema = new { type = "object", properties = new { } }
        };
    }

    public async Task<string> HandleToolCallAsync(
        string toolName,
        Dictionary<string, object> arguments)
    {
        return toolName switch
        {
            "get_company_info" => @"{
                ""name"": ""Company Inc"",
                ""founded"": 2020,
                ""employees"": 150
            }",
            "get_pricing" => @"{
                ""basic"": 29,
                ""pro"": 99,
                ""enterprise"": ""Contact us""
            }",
            _ => throw new InvalidOperationException($"Unknown tool: {toolName}")
        };
    }
}
```

### External API Integration

```csharp
public class ExternalAPIToolsProvider : IAIToolsProvider
{
    private readonly HttpClient _httpClient;

    public ExternalAPIToolsProvider(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public IEnumerable<ToolDefinition> GetTools()
    {
        yield return new ToolDefinition
        {
            Name = "translate_text",
            Description = "Translate text to another language",
            InputSchema = new
            {
                type = "object",
                properties = new
                {
                    text = new { type = "string" },
                    targetLanguage = new { type = "string" }
                },
                required = new[] { "text", "targetLanguage" }
            }
        };
    }

    public async Task<string> HandleToolCallAsync(
        string toolName,
        Dictionary<string, object> arguments)
    {
        if (toolName != "translate_text")
            throw new InvalidOperationException($"Unknown tool: {toolName}");

        var text = (string)arguments["text"];
        var language = (string)arguments["targetLanguage"];

        // Call external translation API
        var response = await _httpClient.GetAsync(
            $"https://api.example.com/translate?" +
            $"text={text}&lang={language}");

        return await response.Content.ReadAsStringAsync();
    }
}

// Register with HttpClient
builder.Services.AddHttpClient<ExternalAPIToolsProvider>();

builder.Services.AddBbQChatWidgets(options =>
{
    options.ToolProviderFactory = sp => 
        sp.GetRequiredService<ExternalAPIToolsProvider>();
});
```

### User Context Tools

```csharp
public class UserContextToolsProvider : IAIToolsProvider
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

    public IEnumerable<ToolDefinition> GetTools()
    {
        yield return new ToolDefinition
        {
            Name = "get_user_preferences",
            Description = "Get current user's preferences",
            InputSchema = new { type = "object", properties = new { } }
        };
    }

    public async Task<string> HandleToolCallAsync(
        string toolName,
        Dictionary<string, object> arguments)
    {
        if (toolName != "get_user_preferences")
            throw new InvalidOperationException($"Unknown tool: {toolName}");

        var userId = _httpContextAccessor.HttpContext?
            .User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (userId == null)
            return "{\"error\": \"User not authenticated\"}";

        var preferences = await _userService
            .GetUserPreferencesAsync(userId);

        return JsonSerializer.Serialize(preferences);
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
public async Task<string> HandleToolCallAsync(
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

## Error Handling

```csharp
public async Task<string> HandleToolCallAsync(
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
