using BbQ.ChatWidgets.Abstractions;
using System.Text.Json;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// Registry for managing widget actions and their handlers.
/// </summary>
/// <remarks>
/// This service maintains a collection of registered actions and provides
/// methods to retrieve action metadata for LLM awareness and handler resolution.
/// </remarks>
public interface IWidgetActionRegistry
{
    /// <summary>
    /// Gets all registered widget actions.
    /// </summary>
    /// <returns>An enumerable of registered widget actions.</returns>
    IEnumerable<IWidgetActionMetadata> GetActions();

    /// <summary>
    /// Gets an action by its name.
    /// </summary>
    /// <param name="actionName">The name of the action.</param>
    /// <returns>The action metadata, or null if not found.</returns>
    IWidgetActionMetadata? GetAction(string actionName);

    /// <summary>
    /// Registers an action with the registry.
    /// </summary>
    /// <param name="action">The action metadata to register.</param>
    void RegisterAction(IWidgetActionMetadata action);
}

/// <summary>
/// Metadata for a widget action.
/// </summary>
public interface IWidgetActionMetadata
{
    /// <summary>
    /// Gets the unique name of the action (e.g., "submit_form").
    /// </summary>
    string Name { get; }

    /// <summary>
    /// Gets a human-readable description of the action.
    /// </summary>
    string Description { get; }

    /// <summary>
    /// Gets the JSON schema for the payload type.
    /// </summary>
    string PayloadSchema { get; }

    /// <summary>
    /// Gets the payload type for deserialization.
    /// </summary>
    Type PayloadType { get; }
}

/// <summary>
/// Default implementation of <see cref="IWidgetActionRegistry"/>.
/// </summary>
internal class DefaultWidgetActionRegistry : IWidgetActionRegistry
{
    private readonly Dictionary<string, IWidgetActionMetadata> _actions = [];

    public IEnumerable<IWidgetActionMetadata> GetActions() => _actions.Values;

    public IWidgetActionMetadata? GetAction(string actionName)
    {
        _actions.TryGetValue(actionName, out var action);
        return action;
    }

    public void RegisterAction(IWidgetActionMetadata action)
    {
        if (string.IsNullOrWhiteSpace(action.Name))
            throw new ArgumentException("Action name cannot be null or empty.", nameof(action));

        _actions[action.Name] = action;
    }
}

/// <summary>
/// Default implementation of <see cref="IWidgetActionMetadata"/>.
/// </summary>
public sealed class WidgetActionMetadata : IWidgetActionMetadata
{
    public string Name { get; }
    public string Description { get; }
    public string PayloadSchema { get; }
    public Type PayloadType { get; }

    public WidgetActionMetadata(string name, string description, string payloadSchema, Type payloadType)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name cannot be null or empty.", nameof(name));

        Name = name;
        Description = description ?? "";
        PayloadSchema = payloadSchema ?? "{}";
        PayloadType = payloadType ?? typeof(object);
    }
}
