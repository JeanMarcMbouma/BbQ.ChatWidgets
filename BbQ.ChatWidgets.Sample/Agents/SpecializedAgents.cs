using BbQ.ChatWidgets.Agents;
using BbQ.ChatWidgets.Agents.Abstractions;
using BbQ.ChatWidgets.Models;
using BbQ.Outcome;
using Microsoft.Extensions.AI;

namespace BbQ.ChatWidgets.Sample.Agents;

/// <summary>
/// Help agent that handles user support requests.
/// </summary>
/// <remarks>
/// This agent processes help requests, providing guidance, support, and
/// troubleshooting assistance to users.
/// </remarks>
public sealed class HelpAgent : IAgent
{
    public Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken cancellationToken)
    {
        var userMessage = InterAgentCommunicationContext.GetUserMessage(request);
        var classification = InterAgentCommunicationContext.GetClassification<UserIntent>(request);

        var response = new ChatTurn(
            ChatRole.Assistant,
            $"""I'm here to help! You asked: '{userMessage}' (classified as {classification}). """ +
            """Please let me know what specific assistance you need.""",
            [],
            request.ThreadId ?? """unknown"""
        );

        return Task.FromResult(Outcome<ChatTurn>.From(response));
    }
}

/// <summary>
/// Data query agent that handles information requests.
/// </summary>
/// <remarks>
/// This agent processes data queries, retrieving and presenting information
/// to answer user questions.
/// </remarks>
public sealed class DataQueryAgent : IAgent
{
    public Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken cancellationToken)
    {
        var userMessage = InterAgentCommunicationContext.GetUserMessage(request);
        var classification = InterAgentCommunicationContext.GetClassification<UserIntent>(request);

        var response = new ChatTurn(
            ChatRole.Assistant,
            $"""I found your data query: '{userMessage}' (classified as {classification}). """ +
            """Here's the information you requested...""",
            [],
            request.ThreadId ?? """unknown"""
        );

        return Task.FromResult(Outcome<ChatTurn>.From(response));
    }
}

/// <summary>
/// Action agent that handles action requests.
/// </summary>
/// <remarks>
/// This agent processes action requests, performing operations requested by the user
/// such as creating, modifying, or deleting data.
/// </remarks>
public sealed class ActionAgent : IAgent
{
    public Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken cancellationToken)
    {
        var userMessage = InterAgentCommunicationContext.GetUserMessage(request);
        var classification = InterAgentCommunicationContext.GetClassification<UserIntent>(request);

        var response = new ChatTurn(
            ChatRole.Assistant,
            $"""I'm processing your action request: '{userMessage}' (classified as {classification}). """ +
            """Please confirm to proceed with this action.""",
            new[]
            {
                new ButtonWidget(
                    Label: """Confirm""",
                    Action: """confirm_action"""
                ),
                new ButtonWidget(
                    Label: """Cancel""",
                    Action: """cancel_action"""
                )
            },
            request.ThreadId ?? """unknown"""
        );

        return Task.FromResult(Outcome<ChatTurn>.From(response));
    }
}

/// <summary>
/// Feedback agent that handles user feedback.
/// </summary>
/// <remarks>
/// This agent processes user feedback, collecting suggestions, complaints,
/// and compliments for improvement and analytics.
/// </remarks>
public sealed class FeedbackAgent : IAgent
{
    public Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken cancellationToken)
    {
        var userMessage = InterAgentCommunicationContext.GetUserMessage(request);
        var classification = InterAgentCommunicationContext.GetClassification<UserIntent>(request);

        var response = new ChatTurn(
            ChatRole.Assistant,
            $"""Thank you for your feedback: '{userMessage}' (classified as {classification}). """ +
            """We appreciate your input and will use it to improve our service.""",
            new[]
            {
                new ButtonWidget(
                    Label: """Submit Feedback""",
                    Action: """submit_feedback"""
                )
            },
            request.ThreadId ?? """unknown"""
        );

        return Task.FromResult(Outcome<ChatTurn>.From(response));
    }
}
