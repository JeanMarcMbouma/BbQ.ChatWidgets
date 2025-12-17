# Configuration Guide

Override default options through `BbQChatOptions` when calling `AddBbQChatWidgets(...)`.

Common options that match the library + samples:

- `RoutePrefix` (default: `/api/chat`)
- `ChatClientFactory` (required unless you register `IChatClient` yourself)
- `WidgetRegistryConfigurator` (register built-in/custom widget templates)
- `WidgetActionRegistryFactory` (register actions + handlers)
- `ToolProviderFactory` / `AIInstructionProviderFactory` / `WidgetToolsProviderFactory` (advanced extension points)

Minimal example (matches the WebApp sample pattern):

```csharp
using Microsoft.Extensions.AI;
using BbQ.ChatWidgets.Extensions;

IChatClient openaiClient = new OpenAI.Chat.ChatClient("gpt-4o-mini", "your-api-key").AsIChatClient();
IChatClient chatClient = new ChatClientBuilder(openaiClient).UseFunctionInvocation().Build();

builder.Services.AddBbQChatWidgets(options =>
{
	options.RoutePrefix = "/api/chat";
	options.ChatClientFactory = _ => chatClient;

	// options.WidgetRegistryConfigurator = registry => registry.Register(new MyCustomWidget(...), "mycustom");
	// options.WidgetActionRegistryFactory = (sp, registry, resolver) => registry.RegisterHandler<MyAction, MyPayload, MyHandler>(resolver);
});

app.MapBbQChatEndpoints();
```
