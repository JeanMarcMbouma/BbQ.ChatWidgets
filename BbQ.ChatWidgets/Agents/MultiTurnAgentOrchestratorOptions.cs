namespace BbQ.ChatWidgets.Agents;

/// <summary>
/// Global options for <see cref="MultiTurnAgentOrchestrator"/> behaviour.
/// </summary>
public sealed class MultiTurnAgentOrchestratorOptions
{
    /// <summary>
    /// Default maximum number of rounds each agent may be queried in a single
    /// orchestration run.  Must be at least 1.  Defaults to 5.
    /// </summary>
    public int MaxRoundsPerAgent { get; init; } = 5;

    /// <summary>
    /// Hard cap on the total number of agent-to-agent turns across <em>all</em> agents
    /// in a single orchestration run.  Prevents runaway conversations when many
    /// agents are chained.  Must be at least 1.  Defaults to 20.
    /// </summary>
    public int MaxTotalRounds { get; init; } = 20;

    /// <summary>
    /// When <c>true</c>, the orchestrator repeats the agent pipeline from the
    /// beginning after the last agent finishes, allowing agents to review and
    /// rework each other's output in a loop.  The loop continues until
    /// <see cref="MaxTotalRounds"/> or per-agent <see cref="MaxRoundsPerAgent"/>
    /// limits are exhausted, or until no agent in a full cycle is eligible to
    /// run.  Defaults to <c>false</c>.
    /// </summary>
    public bool Loop { get; init; }
}
