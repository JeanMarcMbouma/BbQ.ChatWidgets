namespace BbQ.ChatWidgets.Agents;

/// <summary>
/// Options for configuring per-agent behavior in a multi-turn orchestrated conversation.
/// </summary>
/// <remarks>
/// Use these options when registering an agent with
/// <see cref="MultiTurnAgentOrchestrator"/> to control the agent's persona,
/// the tools it may use, and how many turns it participates in before the
/// orchestrator stops querying it.
/// </remarks>
public sealed class AgentConversationOptions
{
    /// <summary>
    /// Optional persona / system-prompt fragment injected for this agent's turns.
    /// When <c>null</c> the global persona (if any) is used unchanged.
    /// </summary>
    public string? Persona { get; init; }

    /// <summary>
    /// Maximum number of rounds this agent may be queried per orchestration run.
    /// <c>null</c> means use the orchestrator-level <see cref="MultiTurnAgentOrchestratorOptions.MaxRoundsPerAgent"/> value.
    /// </summary>
    public int? MaxRoundsOverride { get; init; }
}
