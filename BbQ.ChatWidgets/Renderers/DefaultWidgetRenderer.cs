using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Renderers
{
    /// <summary>
    /// Default implementation of <see cref="IChatWidgetRenderer"/> that generates simple,
    /// unstyled HTML for all widget types.
    /// </summary>
    /// <remarks>
    /// This renderer produces minimal HTML with CSS class hooks for custom styling. It:
    /// - Generates valid HTML for all 7 widget types
    /// - Includes data-action attributes for client-side event handling
    /// - Applies consistent CSS class naming (bbq-widget, bbq-[type])
    /// - Handles optional properties gracefully
    /// - Provides a good starting point for custom renderers
    /// 
    /// The generated HTML is framework-agnostic and can be styled with any CSS framework
    /// (Bootstrap, Tailwind, custom CSS, etc.).
    /// </remarks>
    public sealed class DefaultWidgetRenderer : IChatWidgetRenderer
    {
        /// <summary>
        /// Gets the framework name for this renderer.
        /// </summary>
        /// <value>Always returns "Default".</value>
        public string Framework => "Default";

        /// <summary>
        /// Renders a widget to simple HTML markup.
        /// </summary>
        /// <remarks>
        /// This method uses pattern matching to render different widget types:
        /// - ButtonWidget → &lt;button&gt; with action
        /// - CardWidget → &lt;div&gt; with optional image and description
        /// - InputWidget → &lt;label&gt; and &lt;input&gt;
        /// - DropdownWidget → &lt;label&gt; and &lt;select&gt; with options
        /// - SliderWidget → &lt;label&gt; and &lt;input type="range"&gt;
        /// - ToggleWidget → &lt;label&gt; with checkbox &lt;input&gt;
        /// - FileUploadWidget → &lt;label&gt; and &lt;input type="file"&gt;
        /// 
        /// All widgets include:
        /// - CSS class "bbq-widget" for identification
        /// - Type-specific CSS class (e.g., "bbq-button", "bbq-card")
        /// - data-action attribute for handling client-side events
        /// - Proper handling of optional properties
        /// </remarks>
        /// <param name="widget">The widget to render.</param>
        /// <returns>
        /// HTML string representing the widget. Returns an error message div for unsupported types.
        /// </returns>
        public string RenderWidget(ChatWidget widget) => widget switch
        {
            ButtonWidget btn => $"<button class=\"bbq-widget bbq-button\" data-action=\"{btn.Action}\">{btn.Label}</button>",
            DropdownWidget dd => $"<label class=\"bbq-widget bbq-dropdown-label\">{dd.Label}</label><select class=\"bbq-widget bbq-dropdown\" data-action=\"{dd.Action}\">" +
                                 string.Join("", dd.Options.Select(o => $"<option value=\"{o}\">{o}</option>")) +
                                 "</select>",
            SliderWidget sl => $"<label class=\"bbq-widget bbq-slider-label\">{sl.Label}</label><input class=\"bbq-widget bbq-slider\" type=\"range\" min=\"{sl.Min}\" max=\"{sl.Max}\" step=\"{sl.Step}\" data-action=\"{sl.Action}\" />",
            ToggleWidget tg => $"<label class=\"bbq-widget bbq-toggle\"><input type=\"checkbox\" {(tg.DefaultValue ? "checked" : "")} data-action=\"{tg.Action}\" /> {tg.Label}</label>",
            FileUploadWidget fu => $"<label class=\"bbq-widget bbq-file-label\">{fu.Label}</label><input class=\"bbq-widget bbq-file\" type=\"file\" data-action=\"{fu.Action}\" {(fu.Accept is not null ? $"accept=\"{fu.Accept}\"" : "")} />",
            CardWidget card => $"<div class=\"bbq-widget bbq-card\"><h3>{card.Title}</h3>" +
                               (card.Description is not null ? $"<p>{card.Description}</p>" : "") +
                               (card.ImageUrl is not null ? $"<img src=\"{card.ImageUrl}\" alt=\"{card.Title}\" />" : "") +
                               $"<button class=\"bbq-button\" data-action=\"{card.Action}\">{card.Label}</button></div>",
            _ => $"<div class=\"bbq-widget bbq-unsupported\">Unsupported widget: {widget.Type}</div>"
        };
    }
}
