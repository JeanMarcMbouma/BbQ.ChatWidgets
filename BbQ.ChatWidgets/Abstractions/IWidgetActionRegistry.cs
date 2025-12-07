namespace BbQ.ChatWidgets.Abstractions;

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
