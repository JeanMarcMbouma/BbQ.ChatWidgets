using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Models;
using Microsoft.Extensions.AI;
using System.Text.Json;

namespace BbQ.ChatWidgets.Sample.Actions;

/// <summary>
/// Payload for a simple greeting action.
/// </summary>
public sealed record GreetingPayload(
    string Name,
    string Message
);

/// <summary>
/// Action definition for greeting.
/// </summary>
public sealed class GreetingAction : IWidgetAction<GreetingPayload>
{
    public string Name => "greet";

    public string Description => 
        "Sends a greeting with a name and optional message.";

    public string PayloadSchema =>
        JsonSerializer.Serialize(new
        {
            name = "string (required, the person's name)",
            message = "string (optional, custom message)"
        });
}

/// <summary>
/// Handler for greeting actions.
/// </summary>
public sealed class GreetingHandler : 
    IActionWidgetActionHandler<GreetingAction, GreetingPayload>
{
    public async Task<ChatTurn> HandleActionAsync(
        GreetingPayload payload,
        string threadId,
        IServiceProvider serviceProvider)
    {
        // Type-safe access to payload
        var greeting = $"Hello, {payload.Name}!";

        if (!string.IsNullOrEmpty(payload.Message))
            greeting += $" {payload.Message}";

        return new ChatTurn(
            ChatRole.Assistant,
            greeting,
            new[]
            {
                new ButtonWidget("Say Goodbye", "farewell")
            },
            threadId
        );
    }
}

/// <summary>
/// Payload for a feedback action.
/// </summary>
public sealed record FeedbackPayload(
    int Rating,
    string Comments
);

/// <summary>
/// Action definition for feedback submission.
/// </summary>
public sealed class FeedbackAction : IWidgetAction<FeedbackPayload>
{
    public string Name => "submit_feedback";

    public string Description =>
        "Submits user feedback with a rating and optional comments.";

    public string PayloadSchema =>
        JsonSerializer.Serialize(new
        {
            rating = "number (1-5, required)",
            comments = "string (optional, max 500 chars)"
        });
}

/// <summary>
/// Handler for feedback submission.
/// </summary>
public sealed class FeedbackHandler :
    IActionWidgetActionHandler<FeedbackAction, FeedbackPayload>
{
    public async Task<ChatTurn> HandleActionAsync(
        FeedbackPayload payload,
        string threadId,
        IServiceProvider serviceProvider)
    {
        // Type-safe access to payload
        var stars = new string('⭐', payload.Rating);
        var message = $"Thank you for your feedback! {stars}";

        if (!string.IsNullOrEmpty(payload.Comments))
            message += $"\n\nYour comment: {payload.Comments}";

        return new ChatTurn(
            ChatRole.Assistant,
            message,
            Array.Empty<ChatWidget>(),
            threadId
        );
    }
}
