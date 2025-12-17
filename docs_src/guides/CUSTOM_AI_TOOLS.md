# Custom AI Tools

Implement `IAIToolsProvider` to expose additional AI-callable tools to the model.

The default provider includes a single helper tool: `retry_tool`.
To add your own tools, provide `BbQChatOptions.ToolProviderFactory`:

```csharp
builder.Services.AddBbQChatWidgets(options =>
{
	options.ToolProviderFactory = sp => new MyToolsProvider(/* deps */);
});
```

Your provider returns `IReadOnlyList<AITool>` (typically built with `AIFunctionFactory`).
