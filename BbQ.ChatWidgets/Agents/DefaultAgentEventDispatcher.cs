using BbQ.ChatWidgets.Agents.Abstractions;

namespace BbQ.ChatWidgets.Agents;

/// <summary>
/// Default implementation of <see cref="IAgentEventDispatcher"/> that sequentially
/// invokes every registered <see cref="IAgentEventHandler"/>.
/// </summary>
/// <remarks>
/// Handlers are called in the order they were registered. If no handlers are registered the
/// dispatch is a no-op. Handler exceptions propagate to the caller.
/// </remarks>
public sealed class DefaultAgentEventDispatcher(IEnumerable<IAgentEventHandler> handlers) : IAgentEventDispatcher
{
    private readonly IReadOnlyList<IAgentEventHandler> _handlers = [.. handlers];

    /// <inheritdoc />
    public async Task DispatchAsync(AgentEvent agentEvent, CancellationToken cancellationToken)
    {
        foreach (var handler in _handlers)
        {
            await handler.HandleAsync(agentEvent, cancellationToken);
        }
    }
}
