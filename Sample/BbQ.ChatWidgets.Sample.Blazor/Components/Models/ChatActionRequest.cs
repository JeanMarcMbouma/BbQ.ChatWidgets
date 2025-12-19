using System.Text.Json.Serialization;

namespace BbQ.ChatWidgets.Sample.Blazor.Components.Models;

public sealed record ChatActionRequest(
    [property: JsonPropertyName("action")] string Action,
    [property: JsonPropertyName("payload")] object? Payload,
    [property: JsonPropertyName("threadId")] string ThreadId);
