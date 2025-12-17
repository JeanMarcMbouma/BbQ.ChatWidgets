# Custom AI Tools Guide

While BbQ.ChatWidgets automatically provides tools for managing widgets, you may want to expose additional capabilities to the LLM, such as fetching data from an external API or performing complex calculations. This is done by implementing the `IAIToolsProvider` interface.

## The `IAIToolsProvider` Interface

The interface has a single method that returns a list of `AITool` objects.

```csharp
public interface IAIToolsProvider
{
    IEnumerable<AITool> GetTools();
}
```

## Implementing a Custom Provider

You can use the `AIFunctionFactory` from `Microsoft.Extensions.AI` to easily create tools from C# methods.

```csharp
using Microsoft.Extensions.AI;

public class MyToolsProvider : IAIToolsProvider
{
    private readonly IWeatherService _weatherService;

    public MyToolsProvider(IWeatherService weatherService)
    {
        _weatherService = weatherService;
    }

    public IEnumerable<AITool> GetTools()
    {
        // Expose a C# method as an AI tool
        yield return AIFunctionFactory.Create(
            (string city) => _weatherService.GetWeather(city),
            "get_weather",
            "Gets the current weather for a city"
        );
    }
}
```

## Registering the Provider

Register your custom provider using the `ToolProviderFactory` option in `AddBbQChatWidgets`.

```csharp
builder.Services.AddScoped<IWeatherService, WeatherService>();

builder.Services.AddBbQChatWidgets(options =>
{
    options.ToolProviderFactory = sp => 
        new MyToolsProvider(sp.GetRequiredService<IWeatherService>());
});
```

## The Default Provider

If you don't provide a custom `ToolProviderFactory`, the library uses `DefaultAIToolsProvider`, which includes a `retry_tool`. This tool is used by the LLM to signal that it needs to retry a previous operation with different parameters.

If you want to *keep* the default tools while adding your own, you can resolve the `DefaultAIToolsProvider` (if registered) or simply include the `retry_tool` in your own provider.

## How the LLM Uses Tools

When the `ChatWidgetService` calls the `IChatClient`, it includes all tools returned by your provider. The LLM can then choose to call these tools as part of its response generation. The `ChatWidgetService` handles the execution of these tool calls and feeds the results back to the LLM.

## Best Practices

- **Provide Clear Descriptions**: The LLM relies on the tool and parameter descriptions to understand when and how to use a tool.
- **Keep Tools Idempotent**: Ideally, tools should not have side effects that could cause issues if called multiple times (e.g., during a retry).
- **Handle Errors Gracefully**: Ensure your tool methods handle exceptions and return meaningful error messages that the LLM can understand.
