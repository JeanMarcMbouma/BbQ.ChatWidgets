using System.Text.Json.Serialization;

namespace BbQ.ChatWidgets.Sample.Blazor.Components.Models;

public sealed record UserMessageRequest(
    [property: JsonPropertyName("message")] string Message,
    [property: JsonPropertyName("threadId")] string ThreadId);
