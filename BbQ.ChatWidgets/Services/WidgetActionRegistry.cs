using BbQ.ChatWidgets.Abstractions;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// Default in-memory implementation of <see cref="IWidgetActionRegistry"/>.
/// </summary>
/// <remarks>
/// This registry maintains a dictionary of widget action metadata indexed by action name.
/// It provides:
/// - Registration of action metadata with validation
/// - Lookup of action metadata by name
/// - Discovery of all registered actions
///
/// The implementation is thread-safe through dictionary operations on the concurrent collection.
/// Actions are looked up by name, making name uniqueness essential.
/// </remarks>
public sealed class WidgetActionRegistry : IWidgetActionRegistry
{
    private readonly Dictionary<string, IWidgetActionMetadata> _actions = [];

    /// <summary>
    /// Gets all registered widget action metadata.
    /// </summary>
    /// <remarks>
    /// Returns an enumeration of all action metadata that has been registered.
    /// Useful for discovering available actions or generating documentation.
    /// </remarks>
    /// <returns>An enumeration of <see cref="IWidgetActionMetadata"/> for all registered actions.</returns>
    public IEnumerable<IWidgetActionMetadata> GetActions() => _actions.Values;

    /// <summary>
    /// Retrieves the metadata for a specific widget action by name.
    /// </summary>
    /// <remarks>
    /// Used to look up action information (payload type, description, schema) before
    /// executing the action handler. Returns null if the action is not registered.
    /// </remarks>
    /// <param name="actionName">The name of the action to look up.</param>
    /// <returns>The action metadata, or null if not found.</returns>
    public IWidgetActionMetadata? GetAction(string actionName)
    {
        _actions.TryGetValue(actionName, out var action);
        return action;
    }

    /// <summary>
    /// Registers a widget action with its metadata.
    /// </summary>
    /// <remarks>
    /// Action metadata includes the action name, description, JSON schema for the payload,
    /// and the CLR type for payload deserialization. Each action name can only be registered once;
    /// subsequent registrations with the same name will overwrite the previous registration.
    /// </remarks>
    /// <param name="action">The action metadata to register.</param>
    /// <exception cref="ArgumentException">Thrown if the action name is null, empty, or whitespace.</exception>
    public void RegisterAction(IWidgetActionMetadata action)
    {
        if (string.IsNullOrWhiteSpace(action.Name))
            throw new ArgumentException("Action name cannot be null or empty.", nameof(action));

        _actions[action.Name] = action;
    }
}
