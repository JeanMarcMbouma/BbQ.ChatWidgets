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
}
