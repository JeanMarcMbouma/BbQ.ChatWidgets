using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Abstractions;

/// <summary>
/// Metadata describing a registered widget type.
/// </summary>
public interface IWidgetMetadata
{
    /// <summary>
    /// Gets the unique identifier for the widget type (e.g., "button", "input").
    /// </summary>
    string TypeId { get; }

    /// <summary>
    /// Gets the .NET type associated with this widget.
    /// </summary>
    Type Type { get; }

    /// <summary>
    /// Gets a human-readable description of the widget.
    /// </summary>
    string Description { get; }

    /// <summary>
    /// Gets the category or group this widget belongs to (e.g., "input", "display", "interaction").
    /// </summary>
    string Category { get; }

    /// <summary>
    /// Gets optional tags for filtering or searching (e.g., "form", "user-input", "validation").
    /// </summary>
    IReadOnlyList<string> Tags { get; }

    /// <summary>
    /// Gets whether this widget supports user interaction.
    /// </summary>
    bool IsInteractive { get; }

    /// <summary>
    /// Gets whether this is a built-in widget or custom.
    /// </summary>
    bool IsBuiltIn { get; }
}

/// <summary>
/// Central registry for widget type definitions and metadata.
/// </summary>
/// <remarks>
/// This registry maintains:
/// - Mapping of widget type identifiers to their corresponding .NET types
/// - Metadata describing each widget (description, category, tags)
/// - Support for discovering, looking up, and filtering widget types
/// - Extensibility for custom widget types
/// 
/// The registry is initialized with all built-in widget types and can be extended
/// with custom types at runtime.
/// </remarks>
public interface IWidgetRegistry
{
    /// <summary>
    /// Gets all registered widget types.
    /// </summary>
    /// <returns>An enumeration of all registered widget types.</returns>
    IEnumerable<Type> GetRegisteredTypes();

    /// <summary>
    /// Gets all registered widget metadata.
    /// </summary>
    /// <returns>An enumeration of metadata for all registered widgets.</returns>
    IEnumerable<IWidgetMetadata> GetAllMetadata();

    /// <summary>
    /// Attempts to get the .NET type for a widget type identifier.
    /// </summary>
    /// <param name="typeId">The widget type identifier to look up.</param>
    /// <param name="type">The .NET type associated with the identifier, or null if not found.</param>
    /// <returns>True if the widget type was found; false otherwise.</returns>
    bool TryGet(string typeId, out Type? type);

    /// <summary>
    /// Gets metadata for a registered widget by its type identifier.
    /// </summary>
    /// <param name="typeId">The widget type identifier.</param>
    /// <returns>The widget metadata, or null if not found.</returns>
    IWidgetMetadata? GetMetadata(string typeId);

    /// <summary>
    /// Registers a widget type with optional metadata.
    /// </summary>
    /// <typeparam name="T">The widget class type to register. Must inherit from <see cref="ChatWidget"/>.</typeparam>
    /// <param name="typeId">The type identifier string (e.g., "button", "custom_widget").</param>
    /// <param name="description">Optional description of the widget.</param>
    /// <param name="category">Optional category or group (e.g., "input", "display").</param>
    /// <param name="isInteractive">Whether this widget supports user interaction.</param>
    /// <param name="tags">Optional tags for filtering.</param>
    void Register<T>(
        string typeId,
        string description = "",
        string category = "custom",
        bool isInteractive = false,
        params string[] tags) where T : ChatWidget;

    /// <summary>
    /// Checks if a widget type is registered.
    /// </summary>
    /// <param name="typeId">The widget type identifier.</param>
    /// <returns>True if registered; false otherwise.</returns>
    bool IsRegistered(string typeId);

    /// <summary>
    /// Gets all widgets in a specific category.
    /// </summary>
    /// <param name="category">The category to filter by.</param>
    /// <returns>Metadata for all widgets in the category.</returns>
    IEnumerable<IWidgetMetadata> GetByCategory(string category);

    /// <summary>
    /// Gets all widgets that support user interaction.
    /// </summary>
    /// <returns>Metadata for all interactive widgets.</returns>
    IEnumerable<IWidgetMetadata> GetInteractiveWidgets();

    /// <summary>
    /// Gets all built-in widgets.
    /// </summary>
    /// <returns>Metadata for all built-in widgets.</returns>
    IEnumerable<IWidgetMetadata> GetBuiltInWidgets();

    /// <summary>
    /// Gets all custom (non-built-in) registered widgets.
    /// </summary>
    /// <returns>Metadata for all custom widgets.</returns>
    IEnumerable<IWidgetMetadata> GetCustomWidgets();

    /// <summary>
    /// Gets widgets that have a specific tag.
    /// </summary>
    /// <param name="tag">The tag to search for.</param>
    /// <returns>Metadata for all widgets with the specified tag.</returns>
    IEnumerable<IWidgetMetadata> GetByTag(string tag);

    /// <summary>
    /// Gets a count of all registered widgets.
    /// </summary>
    /// <returns>The number of registered widget types.</returns>
    int GetCount();
}
