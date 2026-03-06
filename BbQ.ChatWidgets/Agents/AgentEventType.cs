namespace BbQ.ChatWidgets.Agents;

/// <summary>
/// Defines the types of internal events that can be raised during agent processing.
/// </summary>
/// <remarks>
/// Consumers can subscribe to these events via <see cref="Abstractions.IAgentEventHandler"/>
/// to observe what the agent pipeline is doing at any point in time — useful for building
/// real-time "thinking" indicator widgets.
/// </remarks>
public enum AgentEventType
{
    /// <summary>
    /// Raised just before the AI model begins generating a response (i.e. the model is "thinking").
    /// </summary>
    Thinking,

    /// <summary>
    /// Raised just before the AI model invokes a registered tool function.
    /// The <see cref="AgentEvent.Message"/> property contains the tool's name.
    /// </summary>
    /// <remarks>
    /// Implemented by wrapping every <see cref="Microsoft.Extensions.AI.AIFunction"/> in
    /// <see cref="BbQ.ChatWidgets.Services.ChatWidgetService"/> with an event-firing decorator.
    /// Fires once per individual tool invocation — the AI may call multiple tools per response turn.
    /// </remarks>
    ToolCallStarted,

    /// <summary>
    /// Raised when a tool invocation has finished (whether successfully or with an exception).
    /// The <see cref="AgentEvent.Message"/> property contains the tool's name.
    /// </summary>
    ToolCallCompleted,

    /// <summary>
    /// Raised by a <see cref="TriageAgent{TCategory}"/> when it begins classifying a request.
    /// </summary>
    Triaging,

    /// <summary>
    /// Raised by a <see cref="TriageAgent{TCategory}"/> once it has classified the request and
    /// resolved the target agent.
    /// </summary>
    TriageCompleted,

    /// <summary>
    /// Raised by <see cref="MultiTurnAgentOrchestrator"/> just before invoking an agent in the pipeline.
    /// </summary>
    AgentStarted,

    /// <summary>
    /// Raised by <see cref="MultiTurnAgentOrchestrator"/> immediately after an agent in the pipeline
    /// has returned its result.
    /// </summary>
    AgentCompleted,
}
