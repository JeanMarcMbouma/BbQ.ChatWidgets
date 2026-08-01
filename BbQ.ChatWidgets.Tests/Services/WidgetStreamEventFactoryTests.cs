using System.Text.Json;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Options;
using BbQ.ChatWidgets.Services;
using Xunit;

namespace BbQ.ChatWidgets.Tests.Services;

public sealed class WidgetStreamEventFactoryTests
{
    private readonly WidgetStreamEventFactory _factory = new();
    private readonly Guid _instanceId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private readonly DateTimeOffset _occurredAt = DateTimeOffset.Parse("2026-08-01T12:00:00Z");

    [Fact]
    public void Transition_GeneratesDeterministicPatchFromCompleteStates()
    {
        var current = State(4, """{"type":"button","label":"Review","action":"review"}""");
        var next = Parse("""{"action":"review","label":"Approve","type":"button"}""");

        var first = _factory.Transition("orders", current, 4, next, "event-5", _occurredAt);
        var second = _factory.Transition("orders", current, 4, next, "event-5", _occurredAt);

        Assert.Equal(WidgetTransitionOutcome.Applied, first.Outcome);
        Assert.Equal(first.Event!.Payload.GetRawText(), second.Event!.Payload.GetRawText());
        Assert.Equal(4L, first.Event.BaseRevision);
        Assert.Equal(5L, first.Event.Revision);
        var operation = Assert.Single(first.Event.Payload.EnumerateArray());
        Assert.Equal("replace", operation.GetProperty("op").GetString());
        Assert.Equal("/label", operation.GetProperty("path").GetString());
        Assert.Equal("Approve", operation.GetProperty("value").GetString());
    }

    [Fact]
    public void Transition_EquivalentStateWithDifferentPropertyOrderIsNoOp()
    {
        var current = State(2, """{"type":"button","label":"Review","action":"review"}""");
        var reordered = Parse("""{"action":"review","type":"button","label":"Review"}""");

        var result = _factory.Transition("orders", current, 2, reordered);

        Assert.Equal(WidgetTransitionOutcome.NoChange, result.Outcome);
        Assert.Null(result.Event);
        Assert.Same(current, result.NextState);
    }

    [Fact]
    public void Transition_StaleBaseProducesDefinedResyncEvent()
    {
        var current = State(7, """{"type":"progressbar","label":"Import","action":"cancel","value":40,"max":100}""");
        var next = Parse("""{"type":"progressbar","label":"Import","action":"cancel","value":50,"max":100}""");

        var result = _factory.Transition("imports", current, 5, next, "resync-1", _occurredAt);

        Assert.Equal(WidgetTransitionOutcome.ResyncRequired, result.Outcome);
        Assert.Equal(WidgetStreamEventKind.ResyncRequired, result.Event!.Kind);
        Assert.Equal(7L, result.Event.Revision);
        Assert.Equal("revision_mismatch", result.Event.Payload.GetProperty("reason").GetString());
        Assert.Equal(5, result.Event.Payload.GetProperty("receivedBaseRevision").GetInt64());
    }

    [Fact]
    public void Remove_AdvancesRevisionAndDropsState()
    {
        var current = State(3, """{"type":"button","label":"Close","action":"close"}""");

        var result = _factory.Remove("dialog", current, 3, "remove-4", _occurredAt);

        Assert.Equal(WidgetTransitionOutcome.Applied, result.Outcome);
        Assert.Equal(WidgetStreamEventKind.Remove, result.Event!.Kind);
        Assert.Equal(3L, result.Event.BaseRevision);
        Assert.Equal(4L, result.Event.Revision);
        Assert.Null(result.NextState);
    }

    [Fact]
    public void Snapshot_SerializesStableProtocolNamesAndFields()
    {
        var state = State(1, """{"type":"button","label":"Open","action":"open"}""");
        var streamEvent = _factory.CreateSnapshot("dialog", state, "snapshot-1", _occurredAt);

        var json = JsonSerializer.SerializeToElement(streamEvent, Serialization.Default);

        Assert.Equal("1.0", json.GetProperty("protocolVersion").GetString());
        Assert.Equal("widget.snapshot", json.GetProperty("kind").GetString());
        Assert.Equal("snapshot-1", json.GetProperty("eventId").GetString());
        Assert.Equal(_instanceId, json.GetProperty("instanceId").GetGuid());
        Assert.False(json.TryGetProperty("baseRevision", out var baseRevision) && baseRevision.ValueKind != JsonValueKind.Null);

        var roundTrip = JsonSerializer.Deserialize<WidgetStreamEvent>(json, Serialization.Default);
        Assert.NotNull(roundTrip);
        Assert.Equal(streamEvent.ProtocolVersion, roundTrip.ProtocolVersion);
        Assert.Equal(streamEvent.Kind, roundTrip.Kind);
        Assert.Equal(streamEvent.Revision, roundTrip.Revision);
        Assert.Equal(streamEvent.Payload.GetRawText(), roundTrip.Payload.GetRawText());
    }

    [Fact]
    public void Patch_EscapesJsonPointerSegmentsAndOrdersOperations()
    {
        var previous = Parse("""{"z":1,"a/b":true,"type":"custom"}""");
        var next = Parse("""{"type":"custom","a~b":false,"m":2}""");

        var operations = WidgetJsonPatch.Create(previous, next);

        Assert.Collection(
            operations,
            operation => Assert.Equal(("remove", "/a~1b"), (operation.Op, operation.Path)),
            operation => Assert.Equal(("remove", "/z"), (operation.Op, operation.Path)),
            operation => Assert.Equal(("add", "/a~0b"), (operation.Op, operation.Path)),
            operation => Assert.Equal(("add", "/m"), (operation.Op, operation.Path)));
    }

    [Fact]
    public void Event_RejectsNonAdvancingPatchRevision()
    {
        Assert.Throws<ArgumentException>(() => new WidgetStreamEvent(
            WidgetStreamEvent.CurrentProtocolVersion,
            "event",
            "stream",
            _instanceId,
            4,
            4,
            WidgetStreamEventKind.Patch,
            _occurredAt,
            Parse("[]")));
    }

    [Fact]
    public void SnapshotPolicy_TriggersOnPatchCountOrAge()
    {
        var policy = new WidgetSnapshotPolicy(3, TimeSpan.FromMinutes(5));

        Assert.False(policy.ShouldEmitSnapshot(2, _occurredAt, _occurredAt.AddMinutes(4)));
        Assert.True(policy.ShouldEmitSnapshot(3, _occurredAt, _occurredAt.AddMinutes(1)));
        Assert.True(policy.ShouldEmitSnapshot(1, _occurredAt, _occurredAt.AddMinutes(5)));
    }

    private WidgetRevisionedState State(long revision, string json) =>
        new(_instanceId, revision, Parse(json));

    private static JsonElement Parse(string json) => JsonSerializer.Deserialize<JsonElement>(json);
}
