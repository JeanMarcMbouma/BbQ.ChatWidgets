using System.Text.Json;
using System.Text.Json.Serialization;

namespace BbQ.ChatWidgets.Models;

/// <summary>
/// Versioned event kinds used by the transport-neutral widget stream protocol.
/// </summary>
[JsonConverter(typeof(WidgetStreamEventKindJsonConverter))]
public enum WidgetStreamEventKind
{
    Snapshot,
    Upsert,
    Patch,
    Remove,
    Status,
    ActionResult,
    ResyncRequired,
    Heartbeat
}

/// <summary>
/// A transport-neutral, revision-aware widget stream event.
/// </summary>
public sealed record WidgetStreamEvent
{
    public const string CurrentProtocolVersion = "1.0";

    [JsonConstructor]
    public WidgetStreamEvent(
        string protocolVersion,
        string eventId,
        string streamId,
        Guid? instanceId,
        long? baseRevision,
        long? revision,
        WidgetStreamEventKind kind,
        DateTimeOffset occurredAtUtc,
        JsonElement payload)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(protocolVersion);
        ArgumentException.ThrowIfNullOrWhiteSpace(eventId);
        ArgumentException.ThrowIfNullOrWhiteSpace(streamId);
        if (instanceId is { } id && id == Guid.Empty)
            throw new ArgumentException("A widget instance ID cannot be empty.", nameof(instanceId));
        if (baseRevision is < 0)
            throw new ArgumentOutOfRangeException(nameof(baseRevision));
        if (revision is < 0)
            throw new ArgumentOutOfRangeException(nameof(revision));
        if (payload.ValueKind is JsonValueKind.Undefined)
            throw new ArgumentException("An event payload must be defined.", nameof(payload));

        ValidateKind(kind, instanceId, baseRevision, revision, payload);

        ProtocolVersion = protocolVersion;
        EventId = eventId;
        StreamId = streamId;
        InstanceId = instanceId;
        BaseRevision = baseRevision;
        Revision = revision;
        Kind = kind;
        OccurredAtUtc = occurredAtUtc.ToUniversalTime();
        Payload = payload.Clone();
    }

    public string ProtocolVersion { get; }
    public string EventId { get; }
    public string StreamId { get; }
    public Guid? InstanceId { get; }
    public long? BaseRevision { get; }
    public long? Revision { get; }
    public WidgetStreamEventKind Kind { get; }
    public DateTimeOffset OccurredAtUtc { get; }
    public JsonElement Payload { get; }

    private static void ValidateKind(
        WidgetStreamEventKind kind,
        Guid? instanceId,
        long? baseRevision,
        long? revision,
        JsonElement payload)
    {
        switch (kind)
        {
            case WidgetStreamEventKind.Snapshot:
            case WidgetStreamEventKind.Upsert:
                RequireInstanceAndRevision(instanceId, revision, kind);
                if (baseRevision is not null)
                    throw new ArgumentException($"{kind} events cannot declare a base revision.", nameof(baseRevision));
                if (payload.ValueKind is not JsonValueKind.Object)
                    throw new ArgumentException($"{kind} events require an object payload.", nameof(payload));
                break;

            case WidgetStreamEventKind.Patch:
                RequireForwardRevision(instanceId, baseRevision, revision, kind);
                if (payload.ValueKind is not JsonValueKind.Array)
                    throw new ArgumentException("Patch events require an RFC 6902 operation array.", nameof(payload));
                break;

            case WidgetStreamEventKind.Remove:
            case WidgetStreamEventKind.Status:
            case WidgetStreamEventKind.ActionResult:
                RequireForwardRevision(instanceId, baseRevision, revision, kind);
                break;

            case WidgetStreamEventKind.ResyncRequired:
                if (revision is null)
                    throw new ArgumentException("A resynchronisation event must expose the current revision.", nameof(revision));
                break;

            case WidgetStreamEventKind.Heartbeat:
                if (instanceId is not null || baseRevision is not null || revision is not null)
                    throw new ArgumentException("Heartbeat events are stream-level and cannot carry widget revisions.");
                break;

            default:
                throw new ArgumentOutOfRangeException(nameof(kind));
        }
    }

    private static void RequireInstanceAndRevision(
        Guid? instanceId,
        long? revision,
        WidgetStreamEventKind kind)
    {
        if (instanceId is null)
            throw new ArgumentException($"{kind} events require a widget instance ID.", nameof(instanceId));
        if (revision is null)
            throw new ArgumentException($"{kind} events require a revision.", nameof(revision));
    }

    private static void RequireForwardRevision(
        Guid? instanceId,
        long? baseRevision,
        long? revision,
        WidgetStreamEventKind kind)
    {
        RequireInstanceAndRevision(instanceId, revision, kind);
        if (baseRevision is null)
            throw new ArgumentException($"{kind} events require a base revision.", nameof(baseRevision));
        if (revision <= baseRevision)
            throw new ArgumentException($"{kind} events must advance beyond their base revision.", nameof(revision));
    }
}

/// <summary>
/// Serializes event kinds to the stable dotted protocol names.
/// </summary>
public sealed class WidgetStreamEventKindJsonConverter : JsonConverter<WidgetStreamEventKind>
{
    public override WidgetStreamEventKind Read(
        ref Utf8JsonReader reader,
        Type typeToConvert,
        JsonSerializerOptions options)
    {
        var value = reader.GetString();
        return value switch
        {
            "widget.snapshot" => WidgetStreamEventKind.Snapshot,
            "widget.upsert" => WidgetStreamEventKind.Upsert,
            "widget.patch" => WidgetStreamEventKind.Patch,
            "widget.remove" => WidgetStreamEventKind.Remove,
            "widget.status" => WidgetStreamEventKind.Status,
            "widget.action-result" => WidgetStreamEventKind.ActionResult,
            "stream.resync-required" => WidgetStreamEventKind.ResyncRequired,
            "stream.heartbeat" => WidgetStreamEventKind.Heartbeat,
            _ => throw new JsonException($"Unknown widget stream event kind '{value}'.")
        };
    }

    public override void Write(
        Utf8JsonWriter writer,
        WidgetStreamEventKind value,
        JsonSerializerOptions options) =>
        writer.WriteStringValue(value switch
        {
            WidgetStreamEventKind.Snapshot => "widget.snapshot",
            WidgetStreamEventKind.Upsert => "widget.upsert",
            WidgetStreamEventKind.Patch => "widget.patch",
            WidgetStreamEventKind.Remove => "widget.remove",
            WidgetStreamEventKind.Status => "widget.status",
            WidgetStreamEventKind.ActionResult => "widget.action-result",
            WidgetStreamEventKind.ResyncRequired => "stream.resync-required",
            WidgetStreamEventKind.Heartbeat => "stream.heartbeat",
            _ => throw new JsonException($"Unknown widget stream event kind '{value}'.")
        });
}
