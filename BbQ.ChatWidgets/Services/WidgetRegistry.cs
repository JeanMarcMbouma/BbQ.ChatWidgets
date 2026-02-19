// Services/WidgetRegistry.cs
using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Models;
using System.Collections.Concurrent;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// Central registry for widget instances.
/// </summary>
/// <remarks>
/// This registry maintains a mapping of widget type identifiers to their template instances.
/// Each registered instance serves as the template for generating AI tools via WidgetTool.
/// 
/// The registry is initialized with all built-in widget types and can be extended
/// with custom instances at runtime.
/// 
/// Key principle: Register actual widget instances, not types. The instance
/// becomes the template used to generate AI tools.
/// </remarks>
public sealed class WidgetRegistry : IWidgetRegistry
{
    private readonly ConcurrentDictionary<string, ChatWidget> _instances = new();

    /// <summary>
    /// Initializes a new instance of the <see cref="WidgetRegistry"/> class.
    /// </summary>
    /// <remarks>
    /// The constructor automatically registers all built-in widget types with template instances.
    /// </remarks>
    public WidgetRegistry()
    {
        // Register built-in widgets with template instances
        // Type identifiers are extracted from the widget instances
        Register(new ButtonWidget("Click Action", "click"));
        Register(new CardWidget("View Details", "view", "Card Title", "Card description text", null));
        Register(new InputWidget("Enter Text", "input", "placeholder text", MaxLength: 100));
        Register(new DropdownWidget("Select Option", "select", ["Option 1", "Option 2", "Option 3"]));
        Register(new SliderWidget("Choose Value", "slide", Min: 0, Max: 100, Step: 1, Default: 50));
        Register(new ToggleWidget("Enable Feature", "toggle", DefaultValue: false));
        Register(new FileUploadWidget("Upload File", "upload", Accept: ".pdf,.doc", MaxBytes: 5_000_000));
        Register(new DatePickerWidget("Select Date", "date"));
        Register(new MultiSelectWidget("Select Items", "multiselect", ["Item 1", "Item 2", "Item 3"]));
        Register(new ProgressBarWidget("Progress", "progress", Value: 50, Max: 100));
        Register(new ThemeSwitcherWidget("Select Theme", "theme", ["Light", "Dark"]));
        Register(new FormWidget("Submit Form", "form",
        [
            new FormField("Name", "name_input", "input", true),
            new FormField("Email", "email_input", "input", true),
            new FormField("Submit", "submit_button", "button", true)
        ], [new FormAction("submit", "Submit Form"), new FormAction("cancel", "Cancel Form")]));
        Register(new TextAreaWidget("Enter Description", "textarea", "Type here...", Rows: 5, MaxLength: 500));

        Register(new ImageWidget("Open Image", "open_image", "https://via.placeholder.com/640x360", Alt: "Sample image", Width: 640, Height: 360));
        Register(new ImageCollectionWidget("Image Gallery", "open_gallery",
        [
            new ImageItem("https://via.placeholder.com/320x180", Alt: "Image 1"),
            new ImageItem("https://via.placeholder.com/320x180", Alt: "Image 2")
        ]));
    }

    /// <summary>
    /// Registers a widget instance as a template for tool generation.
    /// </summary>
    /// <remarks>
    /// The provided instance serves as the template that will be wrapped in a WidgetTool
    /// when generating AI tools for the language model.
    /// The type identifier is automatically extracted from the widget instance.
    /// </remarks>
    /// <param name="instance">The widget instance to register as a template.</param>
    /// <exception cref="ArgumentNullException">Thrown if instance is null.</exception>
    public void Register(ChatWidget instance)
    {
        if (instance == null)
            throw new ArgumentNullException(nameof(instance));

        var typeId = instance.Type;
        _instances[typeId] = instance;
    }

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
    public void Register(ChatWidget instance, string? typeIdOverride = null)
    {
        if (instance == null)
            throw new ArgumentNullException(nameof(instance));

        var typeId = typeIdOverride ?? instance.Type;
        _instances[typeId] = instance;
    }

    /// <summary>
    /// Gets all registered widget entries as (TypeId, Widget) pairs.
    /// </summary>
    /// <returns>An enumeration of (TypeId, Widget) pairs for all registered widgets.</returns>
    public IEnumerable<(string TypeId, ChatWidget Widget)> GetEntries() =>
        _instances.Select(kv => (kv.Key, kv.Value));

    /// <summary>
    /// Gets all registered widget instances.
    /// </summary>
    /// <returns>An enumeration of all registered widget instances.</returns>
    public IEnumerable<ChatWidget> GetInstances() => _instances.Values;

    /// <summary>
    /// Gets the template instance for a specific widget type.
    /// </summary>
    /// <param name="typeId">The widget type identifier.</param>
    /// <returns>The template instance, or null if not registered.</returns>
    public ChatWidget? GetInstance(string typeId)
    {
        _instances.TryGetValue(typeId, out var instance);
        return instance;
    }

    /// <summary>
    /// Attempts to get the template instance for a widget type.
    /// </summary>
    /// <param name="typeId">The widget type identifier.</param>
    /// <param name="instance">The template instance, or null if not found.</param>
    /// <returns>True if found; false otherwise.</returns>
    public bool TryGetInstance(string typeId, out ChatWidget? instance)
    {
        return _instances.TryGetValue(typeId, out instance);
    }

    /// <summary>
    /// Checks if a widget type is registered.
    /// </summary>
    /// <param name="typeId">The widget type identifier.</param>
    /// <returns>True if registered; false otherwise.</returns>
    public bool IsRegistered(string typeId) => _instances.ContainsKey(typeId);

    /// <summary>
    /// Gets the number of registered widgets.
    /// </summary>
    /// <returns>The count of registered widget types.</returns>
    public int GetCount() => _instances.Count;
}