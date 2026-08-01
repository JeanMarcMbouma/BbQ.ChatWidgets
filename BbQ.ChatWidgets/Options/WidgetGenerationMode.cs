namespace BbQ.ChatWidgets.Options;

/// <summary>
/// Selects the protocol used by a model to emit widgets.
/// </summary>
public enum WidgetGenerationMode
{
    /// <summary>
    /// Parses widgets embedded in assistant text inside legacy
    /// <c>&lt;widget&gt;</c> markers.
    /// </summary>
    EmbeddedMarkupLegacy = 0,

    /// <summary>
    /// Uses an invocable, schema-constrained <c>emit_widgets</c> tool.
    /// </summary>
    StrictToolCall = 1,

    /// <summary>
    /// Uses a provider's structured response format when tool calling is not
    /// available but JSON Schema response constraints are supported.
    /// </summary>
    StructuredResponse = 2
}
