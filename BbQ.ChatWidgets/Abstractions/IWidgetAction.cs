using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Abstractions;

/// <summary>
/// Represents a widget action with a typed payload.
/// </summary>
/// <typeparam name="T">The type of the action payload.</typeparam>
public interface IWidgetAction<T>
{
    /// <summary>
    /// Gets the unique name of the action (e.g., "submit_form").
    /// </summary>
    string Name { get; }

    /// <summary>
    /// Gets a human-readable description of the action for LLM instructions.
    /// </summary>
    string Description { get; }

    /// <summary>
    /// Gets the JSON schema for the payload type, used for LLM awareness.
    /// </summary>
    string PayloadSchema { get; }
}

/// <summary>
/// Handles a specific widget action with type-safe payload processing.
/// </summary>
/// <typeparam name="TWidgetAction">The action type implementing <see cref="IWidgetAction{T}"/>.</typeparam>
/// <typeparam name="T">The payload type.</typeparam>
public interface IActionWidgetActionHandler<TWidgetAction, T> where TWidgetAction : IWidgetAction<T>
{
    /// <summary>
    /// Handles the specified action asynchronously.
    /// </summary>
    /// <param name="action">The action instance.</param>
    /// <param name="payload">The typed payload.</param>
    /// <param name="threadId">The conversation thread ID.</param>
    /// <param name="serviceProvider">Service provider for dependency injection.</param>
    /// <returns>A task resulting in a <see cref="ChatTurn"/> response.</returns>
    Task<ChatTurn> HandleActionAsync(TWidgetAction action, T payload, string threadId, IServiceProvider serviceProvider);
}
