using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Agents.Abstractions;
using BbQ.Outcome;

namespace BbQ.ChatWidgets.Agents;

/// <summary>
/// An <see cref="IAgent"/> that orchestrates multi-turn conversations across
/// multiple specialist agents before returning a final response to the user.
/// </summary>
/// <remarks>
/// <para>
/// The orchestrator works by sequentially querying a pipeline of named agents.
/// Between each turn it injects the accumulated conversation context into the
/// <see cref="ChatRequest"/> metadata so that every agent can see the prior
/// exchanges.
/// </para>
/// <para>
/// <strong>Max-rounds guard.</strong>  Each agent is queried at most
/// <see cref="AgentConversationOptions.MaxRoundsOverride"/> times (falling
/// back to <see cref="MultiTurnAgentOrchestratorOptions.MaxRoundsPerAgent"/>).
/// Additionally <see cref="MultiTurnAgentOrchestratorOptions.MaxTotalRounds"/>
/// caps the total number of turns across all agents in a single run.  When
/// either limit is hit the orchestrator stops early and returns the most
/// recent agent response.
/// </para>
/// <para>
/// <strong>Per-agent persona.</strong>  If an agent's
/// <see cref="AgentConversationOptions.Persona"/> is set, the orchestrator
/// injects it into the <see cref="ChatRequest"/> metadata via
/// <see cref="InterAgentCommunicationContext"/> before invoking that agent.
/// Downstream agents that honour the persona key (e.g.
/// <c>ChatWidgetService</c>) will apply it automatically.
/// </para>
/// </remarks>
public sealed class MultiTurnAgentOrchestrator : IAgent
{
    private const string ConversationContextKey = "AgentConversationContext";

    private readonly IAgentRegistry _registry;
    private readonly IReadOnlyList<(string AgentName, AgentConversationOptions Options)> _pipeline;
    private readonly MultiTurnAgentOrchestratorOptions _orchestratorOptions;

    /// <summary>
    /// Initialises a new orchestrator with the specified pipeline.
    /// </summary>
    /// <param name="registry">Registry used to resolve agents by name.</param>
    /// <param name="pipeline">
    /// Ordered sequence of (agent-name, options) pairs describing the conversation pipeline.
    /// Agents are queried in the order they appear.
    /// </param>
    /// <param name="orchestratorOptions">
    /// Global max-rounds configuration.  Pass <c>null</c> to use defaults.
    /// </param>
    public MultiTurnAgentOrchestrator(
        IAgentRegistry registry,
        IEnumerable<(string AgentName, AgentConversationOptions Options)> pipeline,
        MultiTurnAgentOrchestratorOptions? orchestratorOptions = null)
    {
        _registry = registry ?? throw new ArgumentNullException(nameof(registry));

        var list = pipeline?.ToList()
            ?? throw new ArgumentNullException(nameof(pipeline));
        if (list.Count == 0)
            throw new ArgumentException("Pipeline must contain at least one agent.", nameof(pipeline));
        _pipeline = list;

        _orchestratorOptions = orchestratorOptions ?? new MultiTurnAgentOrchestratorOptions();

        if (_orchestratorOptions.MaxRoundsPerAgent < 1)
            throw new ArgumentException("MaxRoundsPerAgent must be at least 1.");
        if (_orchestratorOptions.MaxTotalRounds < 1)
            throw new ArgumentException("MaxTotalRounds must be at least 1.");
    }

    /// <inheritdoc/>
    public async Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken cancellationToken)
    {
        var conversationContext = new AgentConversationContext();
        request.Metadata[ConversationContextKey] = conversationContext;

        Outcome<ChatTurn>? lastOutcome = null;
        int totalRounds = 0;

        // Track how many rounds each agent has been called
        var roundsPerAgent = new Dictionary<string, int>(StringComparer.Ordinal);

        foreach (var (agentName, agentOptions) in _pipeline)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (totalRounds >= _orchestratorOptions.MaxTotalRounds)
                break;

            var agent = _registry.GetAgent(agentName);
            if (agent == null)
                return Outcome<ChatTurn>.FromError("AgentNotFound", $"Agent '{agentName}' not found in registry.");

            roundsPerAgent.TryGetValue(agentName, out var agentRoundCount);
            var maxRoundsForAgent = agentOptions.MaxRoundsOverride ?? _orchestratorOptions.MaxRoundsPerAgent;

            if (agentRoundCount >= maxRoundsForAgent)
                continue;

            // Inject per-agent persona if set, otherwise clear any persona left by a previous agent
            if (!string.IsNullOrWhiteSpace(agentOptions.Persona))
                InterAgentCommunicationContext.SetPersona(request, agentOptions.Persona);
            else
                InterAgentCommunicationContext.SetPersona(request, string.Empty);

            // Inject accumulated conversation summary into metadata
            var summary = conversationContext.BuildSummary();
            if (!string.IsNullOrWhiteSpace(summary))
                request.Metadata["PriorAgentContext"] = summary;

            // Track which agent is about to be called
            InterAgentCommunicationContext.SetRoutedAgent(request, agentName);

            var outcome = await agent.InvokeAsync(request, cancellationToken);

            // Record the turn regardless of success/failure
            var content = outcome.IsSuccess
                ? outcome.Value?.Content ?? string.Empty
                : $"[Error: {outcome.GetError<string>()?.Description ?? "unknown"}]";
            conversationContext.AddTurn(agentName, totalRounds, content);

            lastOutcome = outcome;
            roundsPerAgent[agentName] = agentRoundCount + 1;
            totalRounds++;

            // Store the conversation context back into metadata so the next
            // agent can read the accumulated turns
            request.Metadata[ConversationContextKey] = conversationContext;

            // Propagate previous result for inter-agent communication
            if (outcome.IsSuccess && outcome.Value is not null)
                InterAgentCommunicationContext.SetPreviousResult(request, outcome.Value);
        }

        return lastOutcome
            ?? Outcome<ChatTurn>.FromError("NoPipelineResult", "The agent pipeline produced no result.");
    }

    /// <summary>
    /// Retrieves the <see cref="AgentConversationContext"/> stored in request metadata,
    /// if present.
    /// </summary>
    public static AgentConversationContext? GetConversationContext(ChatRequest request)
    {
        if (request.Metadata.TryGetValue(ConversationContextKey, out var obj) &&
            obj is AgentConversationContext ctx)
            return ctx;
        return null;
    }
}
