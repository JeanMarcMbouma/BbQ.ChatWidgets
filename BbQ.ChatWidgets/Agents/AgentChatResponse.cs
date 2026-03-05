using BbQ.ChatWidgets.Models;
using Microsoft.Extensions.AI;

namespace BbQ.ChatWidgets.Agents;

/// <summary>
/// HTTP response DTO returned by the <c>POST /api/chat/agent</c> endpoint.
/// Wraps the underlying <see cref="ChatTurn"/> and, when the request was
/// processed by a <see cref="MultiTurnAgentOrchestrator"/>, also includes
/// the step-by-step agent pipeline trace.
/// </summary>
/// <param name="Role">The role of the message sender (assistant).</param>
/// <param name="Content">The text content of the response.</param>
/// <param name="Widgets">Optional interactive widgets embedded in the response.</param>
/// <param name="ThreadId">The conversation thread identifier.</param>
/// <param name="Metadata">
/// Arbitrary key/value metadata produced by the agent (e.g. classification and routed-agent info).
/// </param>
/// <param name="AgentPipeline">
/// Optional pipeline trace populated by <see cref="MultiTurnAgentOrchestrator"/>.
/// <c>null</c> when the request was handled by a non-orchestrating agent.
/// </param>
public sealed record AgentChatResponse(
    ChatRole Role,
    string Content,
    IReadOnlyList<ChatWidget>? Widgets,
    string ThreadId,
    IReadOnlyDictionary<string, object>? Metadata,
    AgentPipelineTrace? AgentPipeline);

/// <summary>
/// Summarises the step-by-step interactions performed by a <see cref="MultiTurnAgentOrchestrator"/>.
/// </summary>
/// <param name="Turns">Ordered list of agent invocations.</param>
public sealed record AgentPipelineTrace(IReadOnlyList<AgentPipelineTurn> Turns);

/// <summary>
/// A single invocation step within an orchestrated agent pipeline.
/// </summary>
/// <param name="AgentName">Name of the agent that was invoked.</param>
/// <param name="Round">Zero-based round index within the pipeline run.</param>
/// <param name="Content">The textual content produced by this agent.</param>
public sealed record AgentPipelineTurn(string AgentName, int Round, string Content);
