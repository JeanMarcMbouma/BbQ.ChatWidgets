using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Sample.WebApp.Models;

/// <summary>
/// Simple server-side clock widget used for the SSE demo.
/// Supports SSE-driven time updates with configurable stream ID.
/// </summary>
public sealed record ClockWidget(
    string Label,
    string Action,
    string? TimeZone = null,
    string? StreamId = null
) : ChatWidget(Label, Action)
{
    public override string Purpose => """
           **Clock Widget** - Displays server time pushed via SSE
           Emitted through the schema-constrained emit_widgets tool as complete clock state.
        """;
}
