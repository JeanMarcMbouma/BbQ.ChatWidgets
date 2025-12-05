using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Abstractions;

/// <summary>
/// Defines the contract for parsing widget hints from raw AI model output.
/// </summary>
/// <remarks>
/// Widget hints are embedded in AI-generated text using XML-style markers (&lt;widget&gt;...&lt;/widget&gt;).
/// Implementations of this interface extract these hints, deserialize the widget definitions,
/// and return both the cleaned content and the parsed widgets.
/// 
/// The parsing process:
/// 1. Identify widget markers in the raw output
/// 2. Extract JSON widget definitions between markers
/// 3. Deserialize JSON into typed ChatWidget instances
/// 4. Remove widget markers from content, leaving clean text
/// 5. Return tuple of (cleanContent, widgets)
/// 
/// Implementations should be resilient to malformed JSON and invalid widget types.
/// </remarks>
public interface IWidgetHintParser
{
    /// <summary>
    /// Parses widget hints from raw AI model output.
    /// </summary>
    /// <remarks>
    /// This method extracts widget definitions embedded in the format:
    /// &lt;widget&gt;{"type":"button","label":"Click","action":"submit"}&lt;/widget&gt;
    /// 
    /// Multiple widgets can be present in a single output:
    /// "Here are options: &lt;widget&gt;{...}&lt;/widget&gt; or &lt;widget&gt;{...}&lt;/widget&gt;"
    /// 
    /// The method handles:
    /// - Multiple widget definitions in one output
    /// - Optional properties on widgets
    /// - Malformed JSON (skipped with warning/log)
    /// - Invalid widget types (skipped)
    /// - Empty widget markers (ignored)
    /// - No widgets present (returns null)
    /// </remarks>
    /// <param name="rawModelOutput">
    /// The unprocessed output from the AI model, potentially containing embedded widget markers.
    /// </param>
    /// <returns>
    /// A tuple containing:
    /// - <c>Content</c>: The cleaned output with all widget markers removed
    /// - <c>Widgets</c>: A read-only list of successfully parsed widgets, or null if none found
    /// 
    /// The content is trimmed of excess whitespace.
    /// </returns>
    /// <exception cref="ArgumentNullException">
    /// Thrown if <paramref name="rawModelOutput"/> is null.
    /// </exception>
    /// <example>
    /// Input: "Click here: &lt;widget&gt;{"type":"button","label":"Submit","action":"submit"}&lt;/widget&gt;"
    /// Output: ("Click here:", [ButtonWidget(label: "Submit", action: "submit")])
    /// </example>
    (string Content, IReadOnlyList<ChatWidget>? Widgets) Parse(string rawModelOutput);
}
