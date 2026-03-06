using Microsoft.Extensions.AI;
using BbQ.ChatWidgets.Agents;
using BbQ.ChatWidgets.Agents.Abstractions;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// Decorates an <see cref="AIFunction"/> to fire <see cref="AgentEventType.ToolCallStarted"/>
/// and <see cref="AgentEventType.ToolCallCompleted"/> events via <see cref="IAgentEventDispatcher"/>
/// whenever the underlying function is invoked by the AI model.
/// </summary>
internal sealed class EventFiringAIFunction : AIFunction
{
    private readonly AIFunction _inner;
    private readonly IAgentEventDispatcher _dispatcher;
    private readonly string? _threadId;

    /// <summary>
    /// Initializes a new wrapper over the given <paramref name="inner"/> function.
    /// </summary>
    /// <param name="inner">The original <see cref="AIFunction"/> to delegate invocations to.</param>
    /// <param name="dispatcher">The event dispatcher used to fire lifecycle events.</param>
    /// <param name="threadId">The conversation thread id, forwarded in each event.</param>
    internal EventFiringAIFunction(AIFunction inner, IAgentEventDispatcher dispatcher, string? threadId)
    {
        _inner = inner;
        _dispatcher = dispatcher;
        _threadId = threadId;
    }

    /// <inheritdoc />
    public override string Name => _inner.Name;

    /// <inheritdoc />
    public override string Description => _inner.Description;

    /// <inheritdoc />
    protected override async ValueTask<object?> InvokeCoreAsync(
        AIFunctionArguments arguments,
        CancellationToken cancellationToken)
    {
        await _dispatcher.DispatchAsync(
            new AgentEvent(AgentEventType.ToolCallStarted, _threadId, Message: _inner.Name),
            cancellationToken);
        try
        {
            var result = await _inner.InvokeAsync(arguments, cancellationToken);

            await _dispatcher.DispatchAsync(
                new AgentEvent(AgentEventType.ToolCallCompleted, _threadId, Message: _inner.Name),
                cancellationToken);

            return result;
        }
        catch
        {
            await _dispatcher.DispatchAsync(
                new AgentEvent(AgentEventType.ToolCallCompleted, _threadId, Message: _inner.Name),
                cancellationToken);
            throw;
        }
    }
}
