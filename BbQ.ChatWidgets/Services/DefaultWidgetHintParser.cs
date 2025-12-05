using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Models;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// Default implementation of <see cref="IWidgetHintParser"/> that extracts widget definitions
/// from AI model output using XML-style markers.
/// </summary>
/// <remarks>
/// The parser looks for widget definitions enclosed in &lt;widget&gt;...&lt;/widget&gt; tags.
/// Each widget must be valid JSON that deserializes to one of the supported widget types:
/// - ButtonWidget: Interactive button for triggering actions
/// - CardWidget: Displayable card with title, description, and image
/// - InputWidget: Text input field for user input
/// - DropdownWidget: Dropdown selection with multiple options
/// - SliderWidget: Range slider for numeric selection (min, max, step)
/// - ToggleWidget: Checkbox toggle for boolean values
/// - FileUploadWidget: File upload input with optional file type restrictions
/// </remarks>
public sealed class DefaultWidgetHintParser : IWidgetHintParser
{
    private const string WidgetMarkerStart = "<widget>";
    private const string WidgetMarkerEnd = "</widget>";
    private static readonly Regex WidgetBlockRegex = new(
        $@"{Regex.Escape(WidgetMarkerStart)}(.*?){Regex.Escape(WidgetMarkerEnd)}",
        RegexOptions.Singleline | RegexOptions.IgnoreCase
    );

    /// <summary>
    /// Parses the raw model output to extract widget definitions and clean content.
    /// </summary>
    /// <param name="rawModelOutput">The unprocessed output from the AI model.</param>
    /// <returns>
    /// A tuple containing:
    /// - Content: The model output with all widget markers removed
    /// - Widgets: A list of parsed widgets, or null if none were found
    /// </returns>
    /// <exception cref="ArgumentNullException">Thrown when <paramref name="rawModelOutput"/> is null.</exception>
    /// <example>
    /// Input: "Here's a button: &lt;widget&gt;{"type":"button","label":"Click","action":"submit"}&lt;/widget&gt;"
    /// Output: ("Here's a button:", [ButtonWidget])
    /// </example>
    public (string Content, IReadOnlyList<ChatWidget>? Widgets) Parse(string rawModelOutput)
    {
        ArgumentNullException.ThrowIfNull(rawModelOutput);

        var widgets = ExtractWidgets(rawModelOutput);
        var content = RemoveWidgetMarkers(rawModelOutput);

        return (content, widgets?.Count > 0 ? widgets : null);
    }

    /// <summary>
    /// Extracts and deserializes widget definitions from the model output.
    /// </summary>
    /// <param name="rawModelOutput">The raw model output containing widget markers.</param>
    /// <returns>A list of successfully parsed widgets, or null if none were found.</returns>
    private static List<ChatWidget>? ExtractWidgets(string rawModelOutput)
    {
        var matches = WidgetBlockRegex.Matches(rawModelOutput);
        if (matches.Count == 0)
            return null;

        var widgets = new List<ChatWidget>();

        foreach (Match match in matches)
        {
            var jsonContent = match.Groups[1].Value.Trim();
            if (!TryParseWidget(jsonContent, out var widget))
                continue;

            if (widget != null)
                widgets.Add(widget);
        }

        return widgets.Count > 0 ? widgets : null;
    }

    /// <summary>
    /// Attempts to deserialize a JSON string into a ChatWidget instance.
    /// </summary>
    /// <param name="jsonContent">The JSON string to deserialize.</param>
    /// <param name="widget">The parsed widget instance, or null if parsing failed.</param>
    /// <returns>True if the widget was successfully parsed; false otherwise.</returns>
    private static bool TryParseWidget(string jsonContent, out ChatWidget? widget)
    {
        widget = null;

        if (string.IsNullOrWhiteSpace(jsonContent))
            return false;

        try
        {
            widget = JsonSerializer.Deserialize<ChatWidget>(jsonContent, Serialization.Default);
            return widget != null;
        }
        catch (JsonException)
        {
            // Widget JSON is malformed; skip it and continue
            return false;
        }
        catch (Exception)
        {
            // Other unexpected errors; skip widget
            return false;
        }
    }

    /// <summary>
    /// Removes all widget markers from the model output, leaving only the text content.
    /// </summary>
    /// <param name="rawModelOutput">The raw model output containing widget markers.</param>
    /// <returns>The cleaned output with all widget markers removed and whitespace trimmed.</returns>
    private static string RemoveWidgetMarkers(string rawModelOutput)
    {
        return WidgetBlockRegex.Replace(rawModelOutput, string.Empty).Trim();
    }
}
