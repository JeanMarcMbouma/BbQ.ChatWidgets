using BbQ.ChatWidgets.Agents;
using BbQ.ChatWidgets.Agents.Abstractions;
using BbQ.ChatWidgets.Models;
using BbQ.Outcome;
using Microsoft.Extensions.AI;

namespace BbQ.ChatWidgets.Sample.Shared.Agents;

/// <summary>
/// Help agent that handles user support requests.
/// </summary>
public sealed class HelpAgent : IAgent
{
    public Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken cancellationToken)
    {
        var userMessage = InterAgentCommunicationContext.GetUserMessage(request);
        var classification = InterAgentCommunicationContext.GetClassification<UserIntent>(request);

        var response = new SampleChatTurn(
            ChatRole.Assistant,
            $"I'm here to help! You asked: '{userMessage}' (classified as {classification}). " +
            "Please let me know what specific assistance you need.",
            [],
            request.ThreadId ?? "unknown",
            Helpers.GetMetadata(request, classification)
        );

        return Task.FromResult(Outcome<ChatTurn>.From(response));
    }
}

/// <summary>
/// Data query agent that handles information requests.
/// </summary>
public sealed class DataQueryAgent : IAgent
{
    public Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken cancellationToken)
    {
        var userMessage = InterAgentCommunicationContext.GetUserMessage(request);
        var classification = InterAgentCommunicationContext.GetClassification<UserIntent>(request);

        var response = new SampleChatTurn(
            ChatRole.Assistant,
            $"I found your data query: '{userMessage}' (classified as {classification}). " +
            "Here's the information you requested...",
            [],
            request.ThreadId ?? "unknown",
            Helpers.GetMetadata(request, classification)
        );

        return Task.FromResult(Outcome<ChatTurn>.From(response));
    }
}

/// <summary>
/// Action agent that handles action requests.
/// </summary>
public sealed class ActionAgent : IAgent
{
    public Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken cancellationToken)
    {
        var userMessage = InterAgentCommunicationContext.GetUserMessage(request);
        var classification = InterAgentCommunicationContext.GetClassification<UserIntent>(request);

        var response = new SampleChatTurn(
            ChatRole.Assistant,
            $"I'm processing your action request: '{userMessage}' (classified as {classification}). " +
            "Please confirm to proceed with this action.",
            new[]
            {
                new ButtonWidget(
                    Label: "Confirm",
                    Action: "confirm_action"
                ),
                new ButtonWidget(
                    Label: "Cancel",
                    Action: "cancel_action"
                )
            },
            request.ThreadId ?? "unknown",
            Helpers.GetMetadata(request, classification)
        );

        return Task.FromResult(Outcome<ChatTurn>.From(response));
    }
}

/// <summary>
/// Feedback agent that handles user feedback.
/// </summary>
public sealed class FeedbackAgent : IAgent
{
    public Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken cancellationToken)
    {
        var userMessage = InterAgentCommunicationContext.GetUserMessage(request);
        var classification = InterAgentCommunicationContext.GetClassification<UserIntent>(request);

        var response = new SampleChatTurn(
            ChatRole.Assistant,
            $"Thank you for your feedback: '{userMessage}' (classified as {classification}). " +
            "We appreciate your input and will use it to improve our service.",
            new[]
            {
                new ButtonWidget(
                    Label: "Submit Feedback",
                    Action: "submit_feedback"
                )
            },
            request.ThreadId ?? "unknown",
            Helpers.GetMetadata(request, classification)
        );

        return Task.FromResult(Outcome<ChatTurn>.From(response));
    }

}

public sealed record SampleChatTurn(ChatRole Role, string Message, IReadOnlyList<ChatWidget> Widgets, string ThreadId, Dictionary<string, object> Metadata) : 
        ChatTurn(Role, Message, Widgets, ThreadId);

static class Helpers
{

    public static Dictionary<string, object> GetMetadata(ChatRequest request, UserIntent classification)
    {
        return new Dictionary<string, object>
        {
            ["classification"] = Enum.GetName(classification)!,
            ["routedAgent"] = InterAgentCommunicationContext.GetRoutedAgent(request)!
        };
    }
}
