using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Sample.WebApp.Models;

/// <summary>
/// Server-side weather widget used for the SSE demo.
/// Displays current weather conditions pushed via SSE with real-time updates.
/// </summary>
public sealed record WeatherWidget(
    string Label,
    string Action,
    string? City = null,
    string? StreamId = null
) : ChatWidget(Label, Action)
{
    public override string Purpose => """
           **Weather Widget** - Displays weather data pushed via SSE
           Emitted through the schema-constrained emit_widgets tool as complete weather state.
        """;
}
