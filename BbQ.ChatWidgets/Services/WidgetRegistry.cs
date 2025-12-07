// Services/WidgetRegistry.cs
using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Models;
using System.Collections.Concurrent;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// Metadata for a registered widget type.
/// </summary>
internal sealed class WidgetMetadata : IWidgetMetadata
{
    public string TypeId { get; }
    public Type Type { get; }
    public string Description { get; }
    public string Category { get; }
    public IReadOnlyList<string> Tags { get; }
    public bool IsInteractive { get; }
    public bool IsBuiltIn { get; }

    public WidgetMetadata(
        string typeId,
        Type type,
        string description,
        string category,
        bool isInteractive,
        bool isBuiltIn,
        params string[] tags)
    {
        if (string.IsNullOrWhiteSpace(typeId))
            throw new ArgumentException("TypeId cannot be null or empty.", nameof(typeId));
        if (type == null)
            throw new ArgumentNullException(nameof(type));

        TypeId = typeId;
        Type = type;
        Description = description ?? "";
        Category = category ?? "custom";
        IsInteractive = isInteractive;
        IsBuiltIn = isBuiltIn;
        Tags = new List<string>(tags ?? []).AsReadOnly();
    }
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
/// The registry is initialized with all built-in widget types:
/// - button → ButtonWidget (interactive, input)
/// - card → CardWidget (display)
/// - input → InputWidget (interactive, form, input)
/// - dropdown → DropdownWidget (interactive, form, input)
/// - slider → SliderWidget (interactive, form, input)
/// - toggle → ToggleWidget (interactive, form, input)
/// - fileupload → FileUploadWidget (interactive, form, input)
/// - datepicker → DatePickerWidget (interactive, form, input)
/// - multiselect → MultiSelectWidget (interactive, form, input)
/// - progressbar → ProgressBarWidget (display, feedback)
/// - themeswitcher → ThemeSwitcherWidget (interactive, utility)
/// 
/// Additional widget types can be registered at runtime using the <see cref="Register{T}"/> method.
/// </remarks>
public sealed class WidgetRegistry : IWidgetRegistry
{
    private readonly ConcurrentDictionary<string, WidgetMetadata> _metadata = new();

    /// <summary>
    /// Initializes a new instance of the <see cref="WidgetRegistry"/> class.
    /// </summary>
    /// <remarks>
    /// The constructor automatically registers all built-in widget types with their metadata.
    /// </remarks>
    public WidgetRegistry()
    {
        // Input/Form widgets
        Register<ButtonWidget>("button", "Clickable button for triggering actions", "interaction", isInteractive: true, "form", "action");
        Register<InputWidget>("input", "Text input field for user entry", "input", isInteractive: true, "form", "text-input");
        Register<DropdownWidget>("dropdown", "Single-select dropdown menu", "input", isInteractive: true, "form", "selection");
        Register<SliderWidget>("slider", "Range slider for numeric input", "input", isInteractive: true, "form", "numeric");
        Register<ToggleWidget>("toggle", "On/off toggle switch", "input", isInteractive: true, "form", "boolean");
        Register<FileUploadWidget>("fileupload", "File selection and upload", "input", isInteractive: true, "form", "file");
        Register<DatePickerWidget>("datepicker", "Date selection widget", "input", isInteractive: true, "form", "date");
        Register<MultiSelectWidget>("multiselect", "Multi-select list for multiple choices", "input", isInteractive: true, "form", "selection");

        // Display/Output widgets
        Register<CardWidget>("card", "Rich content card for displaying information", "display", isInteractive: false, "content", "card");
        Register<ProgressBarWidget>("progressbar", "Progress indicator bar", "display", isInteractive: false, "feedback", "progress");

        // Utility widgets
        Register<ThemeSwitcherWidget>("themeswitcher", "Theme selection and switching", "utility", isInteractive: true, "settings", "theme");
    }

    /// <summary>
    /// Registers a widget type with optional metadata.
    /// </summary>
    /// <remarks>
    /// This method allows runtime registration of custom widget types or overriding
    /// existing widget type mappings.
    /// </remarks>
    /// <typeparam name="T">The widget class type to register. Must inherit from <see cref="ChatWidget"/>.</typeparam>
    /// <param name="typeId">The type identifier string (e.g., "button", "custom_widget").</param>
    /// <param name="description">Optional description of the widget.</param>
    /// <param name="category">Optional category or group (e.g., "input", "display").</param>
    /// <param name="isInteractive">Whether this widget supports user interaction.</param>
    /// <param name="tags">Optional tags for filtering.</param>
    /// <exception cref="ArgumentException">
    /// Thrown if the typeId parameter is null or empty.
    /// </exception>
    public void Register<T>(
        string typeId,
        string description = "",
        string category = "custom",
        bool isInteractive = false,
        params string[] tags) where T : ChatWidget
    {
        if (string.IsNullOrWhiteSpace(typeId))
            throw new ArgumentException("Type ID cannot be null or empty.", nameof(typeId));

        var metadata = new WidgetMetadata(
            typeId,
            typeof(T),
            description,
            category,
            isInteractive,
            isBuiltIn: false,
            tags ?? []);

        _metadata[typeId] = metadata;
    }

    /// <summary>
    /// Attempts to get the .NET type for a widget type identifier.
    /// </summary>
    /// <remarks>
    /// This method is useful for dynamic instantiation or reflection-based operations.
    /// </remarks>
    /// <param name="typeId">The widget type identifier to look up.</param>
    /// <param name="type">
    /// When this method returns, contains the .NET type associated with the identifier,
    /// or null if the type was not found.
    /// </param>
    /// <returns>
    /// True if the widget type was found; false otherwise.
    /// </returns>
    public bool TryGet(string typeId, out Type? type)
    {
        if (_metadata.TryGetValue(typeId, out var metadata))
        {
            type = metadata.Type;
            return true;
        }
        type = null;
        return false;
    }

    /// <summary>
    /// Gets all registered widget types.
    /// </summary>
    /// <remarks>
    /// This method returns the collection of all registered .NET types.
    /// Useful for:
    /// - Generating tools for all available widgets
    /// - Validating widget availability
    /// - Listing supported widget types
    /// </remarks>
    /// <returns>
    /// An enumeration of all registered widget types. The collection includes both
    /// built-in and any custom registered types.
    /// </returns>
    public IEnumerable<Type> GetRegisteredTypes() => _metadata.Values.Select(m => m.Type);

    /// <summary>
    /// Gets all registered widget metadata.
    /// </summary>
    /// <returns>An enumeration of metadata for all registered widgets.</returns>
    public IEnumerable<IWidgetMetadata> GetAllMetadata() => _metadata.Values.AsEnumerable();

    /// <summary>
    /// Gets metadata for a registered widget by its type identifier.
    /// </summary>
    /// <param name="typeId">The widget type identifier.</param>
    /// <returns>The widget metadata, or null if not found.</returns>
    public IWidgetMetadata? GetMetadata(string typeId)
    {
        _metadata.TryGetValue(typeId, out var metadata);
        return metadata;
    }

    /// <summary>
    /// Checks if a widget type is registered.
    /// </summary>
    /// <param name="typeId">The widget type identifier.</param>
    /// <returns>True if registered; false otherwise.</returns>
    public bool IsRegistered(string typeId) => _metadata.ContainsKey(typeId);

    /// <summary>
    /// Gets all widgets in a specific category.
    /// </summary>
    /// <param name="category">The category to filter by.</param>
    /// <returns>Metadata for all widgets in the category.</returns>
    public IEnumerable<IWidgetMetadata> GetByCategory(string category) =>
        _metadata.Values.Where(m => m.Category.Equals(category, StringComparison.OrdinalIgnoreCase));

    /// <summary>
    /// Gets all widgets that support user interaction.
    /// </summary>
    /// <returns>Metadata for all interactive widgets.</returns>
    public IEnumerable<IWidgetMetadata> GetInteractiveWidgets() =>
        _metadata.Values.Where(m => m.IsInteractive);

    /// <summary>
    /// Gets all built-in widgets.
    /// </summary>
    /// <returns>Metadata for all built-in widgets.</returns>
    public IEnumerable<IWidgetMetadata> GetBuiltInWidgets() =>
        _metadata.Values.Where(m => m.IsBuiltIn);

    /// <summary>
    /// Gets all custom (non-built-in) registered widgets.
    /// </summary>
    /// <returns>Metadata for all custom widgets.</returns>
    public IEnumerable<IWidgetMetadata> GetCustomWidgets() =>
        _metadata.Values.Where(m => !m.IsBuiltIn);

    /// <summary>
    /// Gets widgets that have a specific tag.
    /// </summary>
    /// <param name="tag">The tag to search for.</param>
    /// <returns>Metadata for all widgets with the specified tag.</returns>
    public IEnumerable<IWidgetMetadata> GetByTag(string tag) =>
        _metadata.Values.Where(m => m.Tags.Contains(tag, StringComparer.OrdinalIgnoreCase));

    /// <summary>
    /// Gets a count of all registered widgets.
    /// </summary>
    /// <returns>The number of registered widget types.</returns>
    public int GetCount() => _metadata.Count;
}