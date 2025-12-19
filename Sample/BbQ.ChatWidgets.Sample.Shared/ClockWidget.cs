using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Sample.Shared;

/// <summary>
/// A custom Clock widget demonstrating SSE integration for real-time server-pushed updates.
/// Displays server time updated via Server-Sent Events.
/// </summary>
public sealed record ClockWidget(
    string Label,
    string Action,
    string TimeZone,       // IANA timezone (e.g., "UTC", "America/New_York")
    string StreamId        // SSE stream identifier for server-pushed updates
) : ChatWidget(Label, Action)
{
    public override string Purpose =>
        """
        ***Clock Widget***
        Format: <widget>{"type":"clock","label":"Server Clock","action":"on_tick","timeZone":"UTC","streamId":"clock-stream-1"}</widget>
        Displays server time via SSE (Server-Sent Events) for real-time updates.
        Use when you need a live clock that updates from the server.
        """;
}
