namespace BbQ.ChatWidgets.Agents;

/// <summary>
/// Tracks the conversation history exchanged between agents during a single
/// multi-turn orchestration run.
/// </summary>
/// <remarks>
/// Each entry represents one agent response, recording which agent produced
/// it, the round index, and the response content.  The orchestrator attaches
/// the current context to every outgoing <see cref="ChatRequest"/> so that
/// downstream agents can inspect prior turns.
/// </remarks>
public sealed class AgentConversationContext
{
    private readonly List<AgentConversationTurn> _turns = [];

    /// <summary>All recorded turns, in chronological order.</summary>
    public IReadOnlyList<AgentConversationTurn> Turns => _turns;

    /// <summary>
    /// Appends a new turn to the conversation history.
    /// </summary>
    public void AddTurn(string agentName, int round, string content)
        => _turns.Add(new AgentConversationTurn(agentName, round, content));

    /// <summary>
    /// Builds a plain-text summary of all turns, suitable for inclusion in a
    /// downstream agent's context.
    /// </summary>
    public string BuildSummary()
    {
        if (_turns.Count == 0)
            return string.Empty;

        var lines = _turns.Select(t =>
            $"[Round {t.Round}] {t.AgentName}: {t.Content}");
        return string.Join("\n", lines);
    }
}

/// <summary>
/// A single recorded turn in an agent-to-agent conversation.
/// </summary>
/// <param name="AgentName">Name of the agent that produced the response.</param>
/// <param name="Round">Zero-based round index within the orchestration run.</param>
/// <param name="Content">The textual content of the agent response.</param>
public sealed record AgentConversationTurn(string AgentName, int Round, string Content);
