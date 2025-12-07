# Configuration Guide

Complete reference for all BbQ.ChatWidgets configuration options.

## Overview

This guide covers:
- Service registration options
- Chat client configuration
- Widget and tool providers
- Custom instruction providers
- Route configuration

## Basic Configuration

### Minimal Setup

```csharp
builder.Services.AddBbQChatWidgets(options =>
{
    options.ChatClientFactory = sp => chatClient;
});
app.MapBbQChatEndpoints();
```

### Full Configuration Example

```csharp
builder.Services.AddBbQChatWidgets(options =>
{
    // API route prefix (default: "/api/chat")
    options.RoutePrefix = "/api/chat";
    
    // Chat client factory (required)
    options.ChatClientFactory = sp => chatClient;
    
    // Custom widget tools provider (optional)
    options.WidgetToolsProviderFactory = sp => 
        new DefaultWidgetToolsProvider();
    
    // Custom AI tools provider (optional)
    options.ToolProviderFactory = sp => 
        new DefaultToolsProvider();
    
    // Custom instruction provider (optional)
    options.AIInstructionProviderFactory = sp => 
        new DefaultInstructionProvider();
});
```

## Configuration Options Reference

### RoutePrefix
```csharp
options.RoutePrefix = "/api/chat";
```
**Type**: `string`  
**Default**: `"/api/chat"`  
**Description**: Base URL path for chat endpoints
- `/api/chat/message` - Send user messages
- `/api/chat/action` - Handle widget actions

### ChatClientFactory
```csharp
options.ChatClientFactory = sp => chatClient;
```
**Type**: `Func<IServiceProvider, IChatClient>`  
**Required**: Yes  
**Description**: Factory to create the chat client instance

### WidgetToolsProviderFactory
```csharp
options.WidgetToolsProviderFactory = sp => provider;
```
**Type**: `Func<IServiceProvider, IWidgetToolsProvider>`  
**Default**: `DefaultWidgetToolsProvider`  
**Description**: Provides available widget definitions to AI

### ToolProviderFactory
```csharp
options.ToolProviderFactory = sp => provider;
```
**Type**: `Func<IServiceProvider, IAIToolsProvider>`  
**Default**: `DefaultToolsProvider`  
**Description**: Provides custom AI tools/functions

### AIInstructionProviderFactory
```csharp
options.AIInstructionProviderFactory = sp => provider;
```
**Type**: `Func<IServiceProvider, IAIInstructionProvider>`  
**Default**: `DefaultInstructionProvider`  
**Description**: Provides system instructions for AI

## Common Configurations

### OpenAI Configuration

```csharp
var openaiClient = new OpenAI.Chat.ChatClient(
    modelId: "gpt-4o-mini",
    apiKey: builder.Configuration["OpenAI:ApiKey"]
).AsIChatClient();

var chatClient = new ChatClientBuilder(openaiClient)
    .UseFunctionInvocation()
    .Build();

builder.Services.AddBbQChatWidgets(options =>
{
    options.ChatClientFactory = sp => chatClient;
});
```

### Azure OpenAI Configuration

```csharp
var azureClient = new Azure.AI.OpenAI.AzureOpenAIClient(
    new Uri(builder.Configuration["AzureOpenAI:Endpoint"]),
    new Azure.AzureKeyCredential(
        builder.Configuration["AzureOpenAI:ApiKey"]
    )
);

var chatClient = azureClient
    .GetChatClient("gpt-4-deployment")
    .AsIChatClient();

builder.Services.AddBbQChatWidgets(options =>
{
    options.ChatClientFactory = sp => chatClient;
});
```

### Custom Route Prefix

```csharp
builder.Services.AddBbQChatWidgets(options =>
{
    options.RoutePrefix = "/api/v1/assistant";
    options.ChatClientFactory = sp => chatClient;
});

// Creates endpoints:
// POST /api/v1/assistant/message
// POST /api/v1/assistant/action
```

## Advanced Configuration

### Custom Widget Provider

```csharp
public class CustomWidgetProvider : IWidgetToolsProvider
{
    public IEnumerable<ToolDefinition> GetTools()
    {
        // Return your custom widget definitions
        yield return new ToolDefinition
        {
            Name = "custom_button",
            Description = "A custom button widget",
            InputSchema = new { /* schema */ }
        };
    }
}

// Register it
builder.Services.AddBbQChatWidgets(options =>
{
    options.WidgetToolsProviderFactory = sp => 
        new CustomWidgetProvider();
});
```

### Custom AI Tools

```csharp
public class CustomToolsProvider : IAIToolsProvider
{
    public IEnumerable<ToolDefinition> GetTools()
    {
        yield return new ToolDefinition
        {
            Name = "get_user_info",
            Description = "Get information about the current user",
            InputSchema = new { /* schema */ }
        };
    }
}

// Register it
builder.Services.AddBbQChatWidgets(options =>
{
    options.ToolProviderFactory = sp => 
        new CustomToolsProvider();
});
```

### Custom Instructions

```csharp
public class CustomInstructionProvider : IAIInstructionProvider
{
    public string GetSystemInstructions()
    {
        return @"You are a helpful assistant that uses widgets to 
                 provide interactive experiences. Always use widgets 
                 when appropriate to make responses more engaging.";
    }
}

// Register it
builder.Services.AddBbQChatWidgets(options =>
{
    options.AIInstructionProviderFactory = sp => 
        new CustomInstructionProvider();
});
```

### Custom Thread Service

```csharp
// Register a custom thread service
builder.Services.AddScoped<IThreadService, CustomThreadService>();

builder.Services.AddBbQChatWidgets(options =>
{
    options.ChatClientFactory = sp => chatClient;
});

// Your custom implementation
public class CustomThreadService : IThreadService
{
    // Store threads in database instead of memory
    public Task<bool> ThreadExistsAsync(string threadId) { /* ... */ }
    public Task<ThreadData> CreateThreadAsync() { /* ... */ }
    // ... other methods
}
```

## Settings File Configuration

### appsettings.json

```json
{
  "OpenAI": {
    "ApiKey": "sk-...",
    "ModelId": "gpt-4o-mini"
  },
  "ChatWidgets": {
    "RoutePrefix": "/api/chat",
    "EnableWidgets": true,
    "MaxContextTurns": 10
  }
}
```

### Reading from Settings

```csharp
var openaiConfig = builder.Configuration.GetSection("OpenAI");
var chatWidgetsConfig = builder.Configuration
    .GetSection("ChatWidgets");

var openaiClient = new OpenAI.Chat.ChatClient(
    modelId: openaiConfig["ModelId"],
    apiKey: openaiConfig["ApiKey"]
).AsIChatClient();

builder.Services.AddBbQChatWidgets(options =>
{
    options.RoutePrefix = chatWidgetsConfig["RoutePrefix"] 
    — "/api/chat";
    options.ChatClientFactory = sp => openaiClient;
});
```

## Environment-Specific Configuration

### Development

```csharp
if (app.Environment.IsDevelopment())
{
    builder.Services.AddBbQChatWidgets(options =>
    {
        options.RoutePrefix = "/api/chat";
        options.ChatClientFactory = sp => mockChatClient;
    });
}
```

### Production

```csharp
if (app.Environment.IsProduction())
{
    builder.Services.AddBbQChatWidgets(options =>
    {
        options.RoutePrefix = "/api/chat";
        options.ChatClientFactory = sp => productionChatClient;
    });
}
```

## Troubleshooting Configuration

### "No suitable constructor found"
- Ensure chat client is properly registered
- Check factory function returns correct type

### "Routes not mapped"
- Verify `app.MapBbQChatEndpoints()` is called
- Check route prefix is correctly set

### "Settings not found"
- Verify appsettings.json path and name
- Check configuration keys are correct

## Next Steps

- **[Custom Widgets](CUSTOM_WIDGETS.md)** - Create custom widgets
- **[Custom AI Tools](CUSTOM_AI_TOOLS.md)** - Add AI tools
- **[Installation Guide](INSTALLATION.md)** - Installation steps
- **[Examples](../examples/)** - See working configurations

---

**Back to:** [Guides](README.md) | [Documentation Index](../INDEX.md)
