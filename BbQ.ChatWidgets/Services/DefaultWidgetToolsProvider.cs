using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// Default implementation of <see cref="IWidgetToolsProvider"/> that provides AI tools
/// for all available widget types.
/// </summary>
/// <remarks>
/// This provider creates template tools for each widget type that can be used by language models
/// to understand the structure and capabilities of available widgets. Each tool includes
/// a JSON schema that describes the widget's properties.
/// 
/// Supported widgets:
/// - Button: Simple action button
/// - Card: Displayable card with optional image and description
/// - Input: Text input field
/// - Dropdown: Selection list
/// - Slider: Range selection
/// - Toggle: Boolean checkbox
/// - FileUpload: File selection
/// </remarks>
internal sealed class DefaultWidgetToolsProvider : IWidgetToolsProvider
{
    private IReadOnlyList<WidgetTool>? _cachedTools;

    /// <summary>
    /// Gets the list of available widget tools for use by AI models.
    /// </summary>
    /// <returns>A read-only list of WidgetTool instances representing all available widgets.</returns>
    /// <remarks>
    /// Tools are cached after the first call for performance. Each tool includes a JSON schema
    /// that describes the widget's parameters, allowing AI models to understand how to construct
    /// valid widget instances.
    /// </remarks>
    public IReadOnlyList<WidgetTool> GetTools()
    {
        if (_cachedTools != null)
            return _cachedTools;

        var tools = new List<WidgetTool>
        {
            new(new ButtonWidget("Click Action", "click")),
            new(new CardWidget("View Details", "view", "Card Title", "Card description text", null)),
            new(new InputWidget("Enter Text", "input", "placeholder text", MaxLength: 100)),
            new(new DropdownWidget("Select Option", "select", new[] { "Option 1", "Option 2", "Option 3" })),
            new(new SliderWidget("Choose Value", "slide", Min: 0, Max: 100, Step: 1, Default: 50)),
            new(new ToggleWidget("Enable Feature", "toggle", DefaultValue: false)),
            new(new FileUploadWidget("Upload File", "upload", Accept: ".pdf,.doc", MaxBytes: 5_000_000))
        };

        _cachedTools = tools.AsReadOnly();
        return _cachedTools;
    }
}
