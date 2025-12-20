using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Agents.Abstractions;
using BbQ.Outcome;

namespace BbQ.ChatWidgets.Agents.Middleware;

/// <summary>
/// Middleware that enforces agent classification and routing.
/// </summary>
/// <remarks>
/// This middleware integrates the triage agent into the pipeline, ensuring
/// that all requests are classified and routed through the appropriate agent.
/// 
/// It can be used to:
/// - Add a triage layer to existing pipelines
/// - Ensure consistent request routing
/// - Provide classification context to downstream middleware
/// - Enable agent-to-agent communication through metadata
/// 
/// Usage in pipeline:
/// <code>
/// builder.Services.AddAgentMiddleware&lt;TriageMiddleware&gt;();
/// </code>
/// </remarks>
/// <remarks>
/// Initializes a new instance of the <see cref="TriageMiddleware"/> class.
/// </remarks>
/// <param name="triageAgent">The triage agent to use for routing.</param>
public sealed class TriageMiddleware(IAgent triageAgent) : IAgentMiddleware
{
    private readonly IAgent _triageAgent = triageAgent ?? throw new ArgumentNullException(nameof(triageAgent));

    public Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, AgentDelegate next, CancellationToken cancellationToken)
    {
        // Delegate to the triage agent, which will route to the appropriate handler
        return _triageAgent.InvokeAsync(request, cancellationToken);
    }
}
