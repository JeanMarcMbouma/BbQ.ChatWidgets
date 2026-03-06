namespace BbQ.ChatWidgets.Agents.Abstractions;

/// <summary>
/// Dispatches <see cref="AgentEvent"/> instances to all registered <see cref="IAgentEventHandler"/>s.
/// </summary>
/// <remarks>
/// The default implementation (<see cref="BbQ.ChatWidgets.Agents.DefaultAgentEventDispatcher"/>)
/// is registered automatically by <c>AddBbQChatWidgets</c>. Replace it with a custom
/// implementation via the DI container if you need custom dispatching behaviour (e.g. fan-out,
/// filtering, or fire-and-forget).
/// </remarks>
public interface IAgentEventDispatcher
{
    /// <summary>
    /// Dispatches the given event to all registered handlers.
    /// </summary>
    /// <param name="agentEvent">The event to dispatch.</param>
    /// <param name="cancellationToken">Token to cancel the async operation.</param>
    Task DispatchAsync(AgentEvent agentEvent, CancellationToken cancellationToken);
}
