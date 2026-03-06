namespace BbQ.ChatWidgets.Agents;

/// <summary>
/// Represents an event raised during agent processing.
/// </summary>
/// <remarks>
/// Instances of this record are dispatched through <see cref="Abstractions.IAgentEventDispatcher"/>
/// to every registered <see cref="Abstractions.IAgentEventHandler"/>.
/// </remarks>
/// <param name="EventType">The type of event that occurred.</param>
/// <param name="ThreadId">
/// The conversation thread identifier associated with this event, or <c>null</c> when the thread
/// has not yet been established.
/// </param>
/// <param name="AgentName">
/// The name of the agent that raised the event, or <c>null</c> when the event originates outside
/// a named agent (e.g. from <see cref="BbQ.ChatWidgets.Services.ChatWidgetService"/>).
/// </param>
/// <param name="Message">
/// An optional human-readable description of the event, suitable for display in a UI placeholder.
/// </param>
public record AgentEvent(
    AgentEventType EventType,
    string? ThreadId,
    string? AgentName = null,
    string? Message = null);
