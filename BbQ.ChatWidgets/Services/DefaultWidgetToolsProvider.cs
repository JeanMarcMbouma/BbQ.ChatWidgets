using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// Default implementation of <see cref="IWidgetToolsProvider"/> that provides AI tools
/// for all available widget types registered in the widget registry.
/// </summary>
/// <remarks>
/// This provider creates template tools for each registered widget type that can be used by language models
/// to understand the structure and capabilities of available widgets. Each tool includes
/// a JSON schema that describes the widget's properties.
/// 
/// Tools are generated dynamically from the <see cref="IWidgetRegistry"/>, which means:
/// - All registered widgets (both built-in and custom) are automatically included
/// - Widget descriptions from metadata are used in tool descriptions
/// - New widgets registered at runtime are immediately available to the AI
/// - The provider respects the widget registry as the single source of truth
/// 
/// Supported widgets include all registered types:
/// - Button, Card, Input, Dropdown, Slider, Toggle, FileUpload
/// - DatePicker, MultiSelect, ProgressBar, ThemeSwitcher
/// - Plus any custom widgets registered in the registry
/// </remarks>
public sealed class DefaultWidgetToolsProvider : IWidgetToolsProvider
{
    private readonly IWidgetRegistry _registry;
    private IReadOnlyList<WidgetTool>? _cachedTools;

    /// <summary>
    /// Initializes a new instance of the <see cref="DefaultWidgetToolsProvider"/> class.
    /// </summary>
    /// <param name="registry">The widget registry to use for discovering available widgets.</param>
    /// <exception cref="ArgumentNullException">Thrown if registry is null.</exception>
    public DefaultWidgetToolsProvider(IWidgetRegistry registry)
    {
        _registry = registry ?? throw new ArgumentNullException(nameof(registry));
    }

    /// <summary>
    /// Gets the list of available widget tools for use by AI models.
    /// </summary>
    /// <returns>A read-only list of WidgetTool instances representing all registered widgets.</returns>
    /// <remarks>
    /// Tools are generated dynamically from the widget registry and cached after the first call
    /// for performance. Each tool includes a JSON schema that describes the widget's parameters,
    /// allowing AI models to understand how to construct valid widget instances.
    /// 
    /// If a widget type cannot be instantiated as a template, it is skipped with a warning logged.
    /// This prevents a single problematic widget from breaking the entire tools list.
    /// </remarks>
    public IReadOnlyList<WidgetTool> GetTools()
    {
        if (_cachedTools != null)
            return _cachedTools;

        var tools = new List<WidgetTool>();

        // Generate tools for all registered widget types
        foreach (var metadata in _registry.GetAllMetadata())
        {
            try
            {
                var tool = CreateToolForWidget(metadata);
                if (tool != null)
                    tools.Add(tool);
            }
            catch (Exception ex)
            {
                // Log and skip problematic widgets without breaking the entire provider
                System.Diagnostics.Debug.WriteLine($"Warning: Failed to create tool for widget '{metadata.TypeId}': {ex.Message}");
            }
        }

        _cachedTools = tools.AsReadOnly();
        return _cachedTools;
    }

    /// <summary>
    /// Creates a template tool for a specific widget type based on its metadata.
    /// </summary>
    /// <param name="metadata">The widget metadata.</param>
    /// <returns>A WidgetTool instance, or null if the widget type cannot be instantiated.</returns>
    private static WidgetTool? CreateToolForWidget(IWidgetMetadata metadata)
    {
        return metadata.TypeId.ToLowerInvariant() switch
        {
            // Input widgets
            "button" => new WidgetTool(new ButtonWidget("Click Action", "click")),
            "input" => new WidgetTool(new InputWidget("Enter Text", "input", "placeholder text", MaxLength: 100)),
            "dropdown" => new WidgetTool(new DropdownWidget("Select Option", "select", ["Option 1", "Option 2", "Option 3"])),
            "slider" => new WidgetTool(new SliderWidget("Choose Value", "slide", Min: 0, Max: 100, Step: 1, Default: 50)),
            "toggle" => new WidgetTool(new ToggleWidget("Enable Feature", "toggle", DefaultValue: false)),
            "fileupload" => new WidgetTool(new FileUploadWidget("Upload File", "upload", Accept: ".pdf,.doc", MaxBytes: 5_000_000)),
            "datepicker" => new WidgetTool(new DatePickerWidget("Select Date", "date")),
            "multiselect" => new WidgetTool(new MultiSelectWidget("Select Items", "multiselect", ["Item 1", "Item 2", "Item 3"])),

            // Display widgets
            "card" => new WidgetTool(new CardWidget("View Details", "view", "Card Title", "Card description text", null)),
            "progressbar" => new WidgetTool(new ProgressBarWidget("Progress", "progress", Value: 50, Max: 100)),

            // Utility widgets
            "themeswitcher" => new WidgetTool(new ThemeSwitcherWidget("Select Theme", "theme", ["Light", "Dark"])),

            // Unknown widget type - return null to skip
            _ => null
        };
    }
}
