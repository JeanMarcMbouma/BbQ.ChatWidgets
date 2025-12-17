# Advanced Configuration Example

This example shows how to use the various extension points in `BbQChatOptions` to customize the library's behavior, including registering custom widgets and action handlers.

## Server-Side Configuration

```csharp
using BbQ.ChatWidgets.Extensions;
using BbQ.ChatWidgets.Models;

builder.Services.AddBbQChatWidgets(options =>
{
    // 1. Change the API route prefix
    options.RoutePrefix = "/api/v1/chat";

    // 2. Provide the chat client
    options.ChatClientFactory = sp => sp.GetRequiredService<IChatClient>();

    // 3. Register custom widget templates
    options.WidgetRegistryConfigurator = registry =>
    {
        registry.Register(new MyCustomWidget("Default Label"), "custom_type");
    };

    // 4. Register custom action handlers
    options.WidgetActionRegistryFactory = (sp, registry, resolver) =>
    {
        // Register a typed handler
        registry.RegisterHandler<MyAction, MyPayload, MyHandler>(resolver);
    };

    // 5. Customize AI instructions
    options.AIInstructionProviderFactory = sp => new MyCustomInstructionProvider();
});

// Don't forget to register your handlers in DI
builder.Services.AddScoped<MyHandler>();
```

## Key Extension Points Explained

### `WidgetRegistryConfigurator`
This is where you tell the library about your custom widgets. By registering a template instance, the library can automatically generate the tool definition for the LLM, ensuring it knows how to "call" your widget.

### `WidgetActionRegistryFactory`
This is where you map widget actions (sent from the client) to server-side handlers. Using `RegisterHandler` ensures that the library can correctly deserialize the incoming payload and route it to the right class.

### `RoutePrefix`
Useful if you need to avoid collisions with other APIs in your application or if you want to version your chat API.

### `AIInstructionProviderFactory`
Allows you to completely override the system prompt sent to the LLM. This is useful for adding global constraints, changing the "personality" of the assistant, or providing additional context about your application's domain.
