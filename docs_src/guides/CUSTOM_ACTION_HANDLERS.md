# Custom Action Handlers

Actions are triggered by widgets (buttons, forms, custom widgets) and handled via the `/action` endpoint.

The library pattern is:

1. Define an action implementing `IWidgetAction<TPayload>` (must have a parameterless constructor).
2. Implement a handler implementing `IActionWidgetActionHandler<TAction, TPayload>`.
3. Register the pair using the `RegisterHandler<TAction,TPayload,THandler>()` extension on `IWidgetActionRegistry`.

Example registration (matches the WebApp sample):

```csharp
builder.Services.AddBbQChatWidgets(options =>
{
	options.WidgetActionRegistryFactory = (sp, actionRegistry, handlerResolver) =>
	{
		actionRegistry.RegisterHandler<MyAction, MyPayload, MyHandler>(handlerResolver);
	};
});

builder.Services.AddScoped<MyHandler>();
```

Handlers return a `ChatTurn` so the server can append the result to the same thread.
