namespace BbQ.ChatWidgets.Agents.Abstractions;

/// <summary>
/// Handles agent lifecycle events raised during chat processing.
/// </summary>
/// <remarks>
/// Implement this interface and register it via
/// <c>services.AddAgentEventHandler&lt;THandler&gt;()</c> to observe internal
/// agent communication events such as thinking, tool calls, triaging, and
/// per-agent pipeline progress.
///
/// Multiple handlers may be registered simultaneously; each will be invoked in
/// registration order for every event.
///
/// Example — building a "thinking" indicator:
/// <code>
/// public class ThinkingWidgetHandler : IAgentEventHandler
/// {
///     public Task HandleAsync(AgentEvent agentEvent, CancellationToken cancellationToken)
///     {
///         if (agentEvent.EventType == AgentEventType.Thinking)
///             Console.WriteLine($"[{agentEvent.ThreadId}] AI is thinking…");
///         return Task.CompletedTask;
///     }
/// }
/// </code>
/// </remarks>
public interface IAgentEventHandler
{
    /// <summary>
    /// Called each time an agent lifecycle event is raised.
    /// </summary>
    /// <param name="agentEvent">The event that was raised.</param>
    /// <param name="cancellationToken">Token to cancel the async operation.</param>
    Task HandleAsync(AgentEvent agentEvent, CancellationToken cancellationToken);
}
