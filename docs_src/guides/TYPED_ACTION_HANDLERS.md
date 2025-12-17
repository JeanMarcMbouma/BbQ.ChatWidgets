# Typed Action Handlers

Use strongly typed payloads by implementing `IWidgetAction<TPayload>` and a matching `IActionWidgetActionHandler<TAction,TPayload>`.

This is the pattern used by the samples (e.g., `GreetingAction : IWidgetAction<GreetingPayload>`).

Register via:

```csharp
actionRegistry.RegisterHandler<GreetingAction, GreetingPayload, GreetingHandler>(handlerResolver);
```
