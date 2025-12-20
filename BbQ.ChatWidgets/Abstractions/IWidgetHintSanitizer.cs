namespace BbQ.ChatWidgets.Abstractions;

/// <summary>
/// Defines the contract for sanitizing content containing incomplete or malformed widget markup.
/// </summary>
/// <remarks>
/// This interface is useful for cleaning up streaming responses that may contain partial widget syntax,
/// ensuring that content is free of incomplete widget tags and markers.
/// </remarks>
public interface IWidgetHintSanitizer
{
    /// <summary>
    /// Sanitizes content by removing incomplete or malformed widget markup.
    /// </summary>
    /// <remarks>
    /// This method handles both complete &lt;widget&gt;...&lt;/widget&gt; blocks and incomplete 
    /// &lt;widget&gt; tags without closing tags, ensuring clean content output.
    /// </remarks>
    /// <param name="content">The content to sanitize.</param>
    /// <returns>The cleaned content with all incomplete widget markers removed.</returns>
    /// <exception cref="ArgumentNullException">Thrown when <paramref name="content"/> is null.</exception>
    string Sanitize(string content);
}
