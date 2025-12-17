# Strongly Typed Action Payloads

BbQ.ChatWidgets encourages the use of strongly typed payloads for action handlers. This provides several benefits:

- **Type Safety**: Catch errors at compile time rather than runtime.
- **Automatic Deserialization**: The library handles the conversion from JSON to your C# classes.
- **Better LLM Guidance**: The library uses your payload types to generate JSON schemas, which are then provided to the LLM to help it generate valid action payloads.

## Example: Complex Form Submission

Consider a form with multiple fields. You can define a single payload class to represent the entire form state.

### 1. The Payload

```csharp
public class RegistrationPayload
{
    public string FullName { get; set; }
    public string Email { get; set; }
    public string Plan { get; set; }
    public bool AcceptTerms { get; set; }
}
```

### 2. The Action

```csharp
public class RegisterUserAction : IWidgetAction<RegistrationPayload>
{
    public string ActionName => "register_user";
}
```

### 3. The Handler

```csharp
public class RegistrationHandler : IActionWidgetActionHandler<RegisterUserAction, RegistrationPayload>
{
    public async Task<ChatTurn> HandleAsync(
        RegisterUserAction action, 
        RegistrationPayload payload, 
        ChatRequest context, 
        CancellationToken ct)
    {
        // Logic to register the user...
        return new ChatTurn(ChatRole.Assistant, $"Welcome, {payload.FullName}!", context.ThreadId);
    }
}
```

## How the LLM Sees This

When you register this handler, the `DefaultInstructionProvider` includes the schema for `RegistrationPayload` in the system prompt. This tells the LLM exactly what fields are expected when it wants to "call" the `register_user` action.

## Registration Reminder

Don't forget to register both the handler in DI and the action-handler mapping in the `WidgetActionRegistry`.

```csharp
services.AddScoped<RegistrationHandler>();

services.AddBbQChatWidgets(options => {
    options.WidgetActionRegistryFactory = (sp, reg, res) => {
        reg.RegisterHandler<RegisterUserAction, RegistrationPayload, RegistrationHandler>(res);
    };
});
```

For more details on the general action handling flow, see the [Action Handlers Guide](CUSTOM_ACTION_HANDLERS.md).
