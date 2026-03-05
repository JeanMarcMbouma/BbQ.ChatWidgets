using BbQ.ChatWidgets.Agents;
using BbQ.ChatWidgets.Agents.Abstractions;
using BbQ.ChatWidgets.Models;
using BbQ.Outcome;
using Microsoft.Extensions.AI;

namespace BbQ.ChatWidgets.Sample.Shared.Agents;

/// <summary>
/// Researcher agent — first step in the multi-turn data-query pipeline.
/// Simulates gathering raw information relevant to the user's question.
/// </summary>
public sealed class ResearcherAgent : IAgent
{
    public Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken cancellationToken)
    {
        var userMessage = InterAgentCommunicationContext.GetUserMessage(request) ?? "(no message)";

        var content =
            $"[Researcher] I searched our knowledge base for: \"{userMessage}\". " +
            "Found 3 relevant sources. Key findings: (1) Historical context established in 2015, " +
            "(2) Current best practices updated in 2023, (3) Industry adoption at ~64%.";

        return Task.FromResult(Outcome<ChatTurn>.From(new SampleChatTurn(
            ChatRole.Assistant,
            content,
            [],
            request.ThreadId ?? string.Empty,
            new Dictionary<string, object> { ["step"] = "research" }
        )));
    }
}

/// <summary>
/// Analyst agent — second step in the multi-turn data-query pipeline.
/// Simulates analysing the researcher's findings and drawing conclusions.
/// </summary>
public sealed class AnalystAgent : IAgent
{
    public Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken cancellationToken)
    {
        var priorContext = request.Metadata.TryGetValue("PriorAgentContext", out var ctx)
            ? ctx?.ToString() ?? string.Empty
            : string.Empty;

        var content =
            "[Analyst] Based on the research findings, the data suggests a clear upward trend. " +
            "The 64% adoption rate combined with the 2023 best-practice update indicates strong " +
            "maturity. Recommendation: proceed with implementation using the 2023 guidelines.";

        if (!string.IsNullOrWhiteSpace(priorContext))
            content += $" (Context reviewed: {priorContext.Length} chars from prior agents.)";

        return Task.FromResult(Outcome<ChatTurn>.From(new SampleChatTurn(
            ChatRole.Assistant,
            content,
            [],
            request.ThreadId ?? string.Empty,
            new Dictionary<string, object> { ["step"] = "analysis" }
        )));
    }
}

/// <summary>
/// Summarizer agent — final step in the multi-turn data-query pipeline.
/// Combines all prior findings into a concise user-facing response.
/// </summary>
public sealed class SummarizerAgent : IAgent
{
    public Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken cancellationToken)
    {
        var userMessage = InterAgentCommunicationContext.GetUserMessage(request) ?? "(no message)";
        var classification = InterAgentCommunicationContext.GetClassification<UserIntent>(request);

        var content =
            $"Here is a concise summary for your query \"{userMessage}\" " +
            $"(intent: {classification}):\n\n" +
            "• Research identified 3 relevant sources with 64% industry adoption\n" +
            "• Analysis confirms strong maturity following the 2023 guidelines update\n" +
            "• Recommendation: implement using 2023 best practices for optimal results";

        return Task.FromResult(Outcome<ChatTurn>.From(new SampleChatTurn(
            ChatRole.Assistant,
            content,
            [],
            request.ThreadId ?? string.Empty,
            Helpers.GetMetadata(request, classification)
        )));
    }
}
