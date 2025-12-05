using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Abstractions;

/// <summary>
/// Defines the contract for rendering <see cref="ChatWidget"/> instances to HTML or markup.
/// </summary>
/// <remarks>
/// Implementations of this interface convert abstract widget definitions into framework-specific
/// HTML or markup that can be displayed in a user interface. Different renderers can target
/// different frameworks (e.g., Bootstrap, Tailwind, Material Design, custom HTML).
/// 
/// Implementers should:
/// - Generate valid, accessible HTML for each widget type
/// - Include appropriate CSS classes for styling
/// - Handle optional properties gracefully
/// - Ensure proper escaping of user-provided content
/// </remarks>
internal interface IChatWidgetRenderer
{
    /// <summary>
    /// Gets the name of the UI framework this renderer targets.
    /// </summary>
    /// <remarks>
    /// Examples: "Bootstrap", "Tailwind", "Material", "Default", "Vue", "React"
    /// This can be used to identify which renderer is active or to select appropriate renderers.
    /// </remarks>
    string Framework { get; }

    /// <summary>
    /// Renders a widget to HTML or framework-specific markup.
    /// </summary>
    /// <remarks>
    /// This method converts an abstract widget definition into concrete HTML that can be
    /// displayed in a user interface. The renderer should:
    /// - Handle all widget properties appropriately
    /// - Generate valid HTML with proper escaping
    /// - Include framework-specific CSS classes
    /// - Ensure accessibility (ARIA labels, semantic HTML, etc.)
    /// - Generate valid data attributes for client-side handling
    /// 
    /// The returned markup should be ready for direct insertion into the DOM.
    /// </remarks>
    /// <param name="widget">The widget to render.</param>
    /// <returns>
    /// HTML or markup string representing the rendered widget.
    /// The string should be complete and valid markup (e.g., a complete &lt;button&gt; or &lt;input&gt; element).
    /// </returns>
    string RenderWidget(ChatWidget widget);
}
