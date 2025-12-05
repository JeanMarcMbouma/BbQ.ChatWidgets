// Services/WidgetRegistry.cs
using BbQ.ChatWidgets.Models;
using System.Collections.Concurrent;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// Central registry for widget type definitions.
/// </summary>
/// <remarks>
/// This registry maintains a mapping of widget type identifiers to their corresponding
/// .NET types. It enables:
/// - Discovering available widget types
/// - Looking up widget types by identifier
/// - Dynamically generating tools for each widget type
/// - Extending the system with custom widget types
/// 
/// The registry is initialized with all built-in widget types:
/// - button → ButtonWidget
/// - card → CardWidget
/// - input → InputWidget
/// - dropdown → DropdownWidget
/// - slider → SliderWidget
/// - toggle → ToggleWidget
/// - fileupload → FileUploadWidget
/// 
/// Additional widget types can be registered at runtime using the <see cref="Register{T}"/> method.
/// </remarks>
public sealed class WidgetRegistry
{
    private readonly ConcurrentDictionary<string, Type> _types = new();

    /// <summary>
    /// Initializes a new instance of the <see cref="WidgetRegistry"/> class.
    /// </summary>
    /// <remarks>
    /// The constructor automatically registers all built-in widget types.
    /// </remarks>
    public WidgetRegistry()
    {
        Register<ButtonWidget>("button");
        Register<CardWidget>("card");
        Register<InputWidget>("input");
        Register<DropdownWidget>("dropdown");
        Register<SliderWidget>("slider");
        Register<ToggleWidget>("toggle");
        Register<FileUploadWidget>("fileupload");
    }

    /// <summary>
    /// Registers a widget type with the specified identifier.
    /// </summary>
    /// <remarks>
    /// This method allows runtime registration of custom widget types or overriding
    /// existing widget type mappings.
    /// </remarks>
    /// <typeparam name="T">The widget class type to register. Must inherit from <see cref="ChatWidget"/>.</typeparam>
    /// <param name="type">The type identifier string (e.g., "button", "custom_widget").</param>
    /// <exception cref="ArgumentException">
    /// Thrown if the type parameter is null or empty.
    /// </exception>
    public void Register<T>(string type) where T : ChatWidget => _types[type] = typeof(T);

    /// <summary>
    /// Attempts to get the .NET type for a widget type identifier.
    /// </summary>
    /// <remarks>
    /// This method is useful for dynamic instantiation or reflection-based operations.
    /// </remarks>
    /// <param name="type">The widget type identifier to look up.</param>
    /// <param name="t">
    /// When this method returns, contains the .NET type associated with the identifier,
    /// or null if the type was not found.
    /// </param>
    /// <returns>
    /// True if the widget type was found; false otherwise.
    /// </returns>
    public bool TryGet(string type, out Type? t) => _types.TryGetValue(type, out t);

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
    public IEnumerable<Type> GetRegisteredTypes() => _types.Values;
}