# Action Handlers Guide

Action handlers are the backbone of interactivity in BbQ.ChatWidgets. They allow your server to respond to user interactions with widgets, such as clicking a button, submitting a form, or selecting an item from a dropdown.

## How Actions Work

1. **Trigger**: A user interacts with a widget in the frontend.
2. **Dispatch**: The frontend sends a `POST` request to `/api/chat/action` containing the action name and a payload.
3. **Resolution**: The `ChatWidgetService` uses the `IWidgetActionHandlerResolver` to find the registered handler for that action.
4. **Execution**: The handler's `HandleAsync` method is called with the deserialized payload and the current conversation context.
5. **Response**: The handler returns a `ChatTurn`, which is appended to the conversation thread and sent back to the client.

## Implementing an Action Handler

To implement a custom action, you need three components: a payload class, an action class, and a handler class.

### 1. Define the Payload

The payload is a simple DTO that represents the data sent from the client.

```csharp
public class FeedbackPayload
{
    public int Rating { get; set; }
    public string Comments { get; set; }
}
```

### 2. Define the Action

The action class identifies the action and links it to the payload type. It must implement `IWidgetAction<TPayload>`.

```csharp
using BbQ.ChatWidgets.Abstractions;

public class SubmitFeedbackAction : IWidgetAction<FeedbackPayload>
{
    public string ActionName => "submit_feedback";
}
```

### 3. Implement the Handler

The handler contains the logic to be executed when the action is triggered. It must implement `IActionWidgetActionHandler<TAction, TPayload>`.

```csharp
using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Models;

public class FeedbackHandler : IActionWidgetActionHandler<SubmitFeedbackAction, FeedbackPayload>
{
    public async Task<ChatTurn> HandleAsync(
        SubmitFeedbackAction action, 
        FeedbackPayload payload, 
        ChatRequest context, 
        CancellationToken ct)
    {
        // Perform logic (e.g., save to database)
        Console.WriteLine($"Received rating {payload.Rating}: {payload.Comments}");

        // Return a response to the user
        return new ChatTurn(
            ChatRole.Assistant, 
            "Thank you for your feedback!", 
            context.ThreadId
        );
    }
}
```

## Registering the Handler

Register the handler and its metadata in your `Program.cs` using the `WidgetActionRegistryFactory` option.

```csharp
builder.Services.AddScoped<FeedbackHandler>();

builder.Services.AddBbQChatWidgets(options =>
{
    options.WidgetActionRegistryFactory = (sp, registry, resolver) =>
    {
        // Register the handler and its metadata
        registry.RegisterHandler<SubmitFeedbackAction, FeedbackPayload, FeedbackHandler>(resolver);
    };
});
```

## Using Actions in Widgets

When creating a widget, you specify the action name it should trigger.

```csharp
var button = new ButtonWidget("Submit Feedback", "submit_feedback");
```

When the user clicks this button, the frontend will send the `submit_feedback` action to the server, which will then be routed to your `FeedbackHandler`.

## Best Practices

- **Keep Handlers Focused**: Each handler should perform one specific task.
- **Return Meaningful Responses**: Use the returned `ChatTurn` to provide feedback to the user or to present the next set of widgets.
- **Use Dependency Injection**: Resolve your services (like database contexts) via the handler's constructor.
