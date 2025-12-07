using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Abstractions;

/// <summary>
/// Registry for custom widget types that enables extensibility beyond built-in widgets.
/// </summary>
/// <remarks>
/// This interface allows external code to register custom ChatWidget types at runtime
/// without modifying the library. Custom widgets are automatically available for
/// serialization and deserialization.
/// 
/// Example:
/// <code>
/// // In your application startup
/// var customRegistry = new CustomWidgetRegistry();
/// customRegistry.Register(typeof(MyRatingWidget), "rating");
/// 
/// // Register in DI container
/// services.AddSingleton(customRegistry);
/// </code>
/// </remarks>
public interface ICustomWidgetRegistry
{
    /// <summary>
    /// Registers a custom widget type for polymorphic serialization.
    /// </summary>
    /// <param name="widgetType">The type (must inherit from ChatWidget).</param>
    /// <param name="discriminator">The JSON type discriminator (e.g., "mywidget").</param>
    void Register(Type widgetType, string discriminator);

    /// <summary>
    /// Registers a custom widget type with auto-extracted discriminator.
    /// </summary>
    /// <remarks>
    /// Discriminator is extracted by removing "Widget" suffix and lowercasing.
    /// Example: MyCustomWidget → "mycustom".
    /// </remarks>
    void Register(Type widgetType);

    /// <summary>
    /// Registers a custom widget type (generic).
    /// </summary>
    void Register<T>(string discriminator) where T : ChatWidget;

    /// <summary>
    /// Registers a custom widget type with auto-extracted discriminator (generic).
    /// </summary>
    void Register<T>() where T : ChatWidget;

    /// <summary>
    /// Gets the type for a discriminator.
    /// </summary>
    Type? GetWidgetType(string discriminator);

    /// <summary>
    /// Gets the discriminator for a type.
    /// </summary>
    string? GetDiscriminator(Type widgetType);

    /// <summary>
    /// Gets all registered custom widgets.
    /// </summary>
    IReadOnlyDictionary<string, Type> GetAllRegistrations();
}
