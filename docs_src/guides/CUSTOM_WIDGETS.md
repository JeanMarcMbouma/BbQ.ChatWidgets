# Custom Widgets Guide

On the server, register widget *template instances* so the library can:
- describe widgets to the LLM (tools + schemas)
- parse `<widget>{...}</widget>` hints
- serialize/deserialize widget payloads consistently

Registering a custom widget template (server-side):

```csharp
builder.Services.AddBbQChatWidgets(options =>
{
	options.WidgetRegistryConfigurator = registry =>
	{
		registry.Register(new MyCustomWidget("Label", "my_action"), "mycustom");
	};
});
```

On the client, register a factory/renderer for your custom `type` using the JS custom widget registry.
