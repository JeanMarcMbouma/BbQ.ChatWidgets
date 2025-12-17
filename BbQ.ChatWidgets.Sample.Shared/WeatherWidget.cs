using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Sample.Shared;

/// <summary>
/// A custom Weather widget demonstrating SSE integration for real-time server-pushed weather data.
/// Displays weather information updated via Server-Sent Events.
/// </summary>
public sealed record WeatherWidget(
    string Label,
    string Action,
    string City,           // City name for weather display
    string StreamId        // SSE stream identifier for server-pushed updates
) : ChatWidget(Label, Action)
{
    public override string Purpose =>
        """
        ***Weather Widget***
        Format: <widget>{"type":"weather","label":"Weather","action":"on_weather_update","city":"San Francisco","streamId":"weather-stream-1"}</widget>
        Displays weather data via SSE (Server-Sent Events) for real-time updates.
        Use when you need to show live weather conditions that update from the server.
        """;
}
