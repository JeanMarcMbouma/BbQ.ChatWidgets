# Configuration Guide

BbQ.ChatWidgets is highly configurable via the `BbQChatOptions` class. This guide details the available options and how to use them to tailor the library to your needs.

## Basic Configuration

You configure the library when calling `AddBbQChatWidgets` in your `Program.cs`:

```csharp
builder.Services.AddBbQChatWidgets(options =>
{
    options.RoutePrefix = "/api/chat";
    options.ChatClientFactory = sp => sp.GetRequiredService<IChatClient>();
});
```

### Available Options

| Option | Type | Description |
| --- | --- | --- |
| `RoutePrefix` | `string` | The base path for all BbQ API endpoints. Default is `/api/chat`. |
| `ChatClientFactory` | `Func<IServiceProvider, IChatClient>` | A factory function that returns the `IChatClient` to be used for chat completions. |
| `WidgetRegistryConfigurator` | `Action<WidgetRegistry>` | A callback to register custom widget templates in the `WidgetRegistry`. |
| `WidgetActionRegistryFactory` | `Action<IServiceProvider, WidgetActionRegistry, IWidgetActionHandlerResolver>` | A callback to register custom action handlers. |
| `ToolProviderFactory` | `Func<IServiceProvider, IAIToolsProvider>` | A factory to provide a custom `IAIToolsProvider`. |
| `AIInstructionProviderFactory` | `Func<IServiceProvider, IAIInstructionProvider>` | A factory to provide a custom `IAIInstructionProvider`. |
| `WidgetToolsProviderFactory` | `Func<IServiceProvider, IWidgetToolsProvider>` | A factory to provide a custom `IWidgetToolsProvider`. |

## Advanced Configuration

### Customizing AI Instructions

The `IAIInstructionProvider` is responsible for generating the system prompt that guides the LLM. You can provide a custom implementation to change how the LLM perceives widgets or to add your own global rules.

```csharp
public class MyCustomInstructionProvider : IAIInstructionProvider
{
    public string GetSystemInstructions() 
    {
        return "You are a helpful assistant. You can use widgets to help the user...";
    }
}

// Registration
options.AIInstructionProviderFactory = sp => new MyCustomInstructionProvider();
```

### Customizing AI Tools

By default, the library provides a `get_widget_tools` function to the LLM. You can add your own tools by implementing `IAIToolsProvider`.

```csharp
public class MyToolsProvider : IAIToolsProvider
{
    public IEnumerable<AITool> GetTools()
    {
        yield return new AIFunction("get_weather", "Gets the weather", ...);
    }
}

// Registration
options.ToolProviderFactory = sp => new MyToolsProvider();
```

### Custom Serialization

BbQ.ChatWidgets uses a default JSON serialization profile (camelCase). If you need to customize how widgets or actions are serialized, you can interact with the `Serialization` utility class, although this is rarely necessary for most use cases.

## Dependency Injection

Most factories receive an `IServiceProvider`, allowing you to resolve other services from your application's DI container (e.g., database contexts, configuration, or other AI services).
