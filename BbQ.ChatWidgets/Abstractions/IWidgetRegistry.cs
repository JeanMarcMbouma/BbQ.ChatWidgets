using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Abstractions;

/// <summary>
/// Central registry for widget instances and their tools.
/// </summary>
/// <remarks>
/// This registry maintains:
/// - Mapping of widget type identifiers to template widget instances
/// - Each registered instance serves as a template for creating tools
/// - Support for discovering available widget types
/// - Extensibility for custom widget types
/// 
/// The registry is initialized with all built-in widget types and can be extended
/// with custom instances at runtime.
/// 
/// Key principle: Register actual widget instances, not types. The instance
/// becomes the template used to generate AI tools.
/// </remarks>
public interface IWidgetRegistry
{
    /// <summary>
    /// Registers a widget instance as a template for tool generation.
    /// </summary>
    /// <remarks>
    /// The provided instance serves as the template that will be wrapped in a WidgetTool
    /// when generating AI tools for the language model. This simplifies registration
    /// by working with concrete instances instead of abstract metadata.
    /// The type identifier is automatically extracted from the widget instance.
    /// </remarks>
    /// <param name="instance">The widget instance to register as a template.</param>
    /// <exception cref="ArgumentNullException">Thrown if instance is null.</exception>
    void Register(ChatWidget instance);

    /// <summary>
    /// Registers a widget instance with an optional custom type identifier.
    /// </summary>
    /// <remarks>
    /// This overload allows specifying a custom type identifier instead of extracting it
    /// from the widget instance. Useful when you want to register the same widget type
    /// under different identifiers.
    /// </remarks>
    /// <param name="instance">The widget instance to register as a template.</param>
    /// <param name="typeIdOverride">Optional custom type identifier. If not provided, the instance's Type is used.</param>
    /// <exception cref="ArgumentNullException">Thrown if instance is null.</exception>
    void Register(ChatWidget instance, string? typeIdOverride = null);

    /// <summary>
    /// Gets all registered widget entries as (TypeId, Widget) pairs.
    /// </summary>
    /// <remarks>
    /// Unlike <see cref="GetInstances"/>, this method also exposes the registry key (typeId)
    /// for each widget. Use this when the typeId may differ from <c>widget.Type</c> due to
    /// a custom registration override.
    /// </remarks>
    /// <returns>An enumeration of (TypeId, Widget) pairs for all registered widgets.</returns>
    IEnumerable<(string TypeId, ChatWidget Widget)> GetEntries();

    /// <summary>
    /// Gets all registered widget instances.
    /// </summary>
    /// <returns>An enumeration of all registered widget instances.</returns>
    IEnumerable<ChatWidget> GetInstances() => GetEntries().Select(e => e.Widget);

    /// <summary>
    /// Gets the template instance for a specific widget type.
    /// </summary>
    /// <param name="typeId">The widget type identifier.</param>
    /// <returns>The template instance, or null if not registered.</returns>
    ChatWidget? GetInstance(string typeId);

    /// <summary>
    /// Attempts to get the template instance for a widget type.
    /// </summary>
    /// <param name="typeId">The widget type identifier.</param>
    /// <param name="instance">The template instance, or null if not found.</param>
    /// <returns>True if found; false otherwise.</returns>
    bool TryGetInstance(string typeId, out ChatWidget? instance);

    /// <summary>
    /// Checks if a widget type is registered.
    /// </summary>
    /// <param name="typeId">The widget type identifier.</param>
    /// <returns>True if registered; false otherwise.</returns>
    bool IsRegistered(string typeId);

    /// <summary>
    /// Gets the number of registered widgets.
    /// </summary>
    /// <returns>The count of registered widget types.</returns>
    int GetCount();
}
