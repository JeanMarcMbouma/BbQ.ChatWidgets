using System.Text.Json;
using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// Produces server-owned stream events from validated complete widget states.
/// </summary>
public sealed class WidgetStreamEventFactory
{
    /// <summary>Creates a complete snapshot event for validated revisioned state.</summary>
    /// <param name="streamId">Logical stream identifier.</param>
    /// <param name="state">Complete validated state.</param>
    /// <param name="eventId">Optional replay identifier.</param>
    /// <param name="occurredAtUtc">Optional occurrence time.</param>
    /// <returns>A snapshot event.</returns>
    public WidgetStreamEvent CreateSnapshot(
        string streamId,
        WidgetRevisionedState state,
        string? eventId = null,
        DateTimeOffset? occurredAtUtc = null) =>
        Create(
            streamId,
            state.InstanceId,
            null,
            state.Revision,
            WidgetStreamEventKind.Snapshot,
            state.State,
            eventId,
            occurredAtUtc);

    /// <summary>Reconciles complete desired state against a known base revision.</summary>
    /// <param name="streamId">Logical stream identifier.</param>
    /// <param name="current">Current validated state.</param>
    /// <param name="expectedBaseRevision">Revision on which the caller based its transition.</param>
    /// <param name="nextCompleteState">Next complete validated state.</param>
    /// <param name="eventId">Optional replay identifier.</param>
    /// <param name="occurredAtUtc">Optional occurrence time.</param>
    /// <returns>An applied patch, no-change result, or resynchronisation request.</returns>
    public WidgetTransitionResult Transition(
        string streamId,
        WidgetRevisionedState current,
        long expectedBaseRevision,
        JsonElement nextCompleteState,
        string? eventId = null,
        DateTimeOffset? occurredAtUtc = null)
    {
        if (expectedBaseRevision != current.Revision)
            return Resync(streamId, current, expectedBaseRevision, eventId, occurredAtUtc);
        if (nextCompleteState.ValueKind is not JsonValueKind.Object)
            throw new ArgumentException("The next widget state must be a complete JSON object.", nameof(nextCompleteState));

        var operations = WidgetJsonPatch.Create(current.State, nextCompleteState);
        if (operations.Count == 0)
            return new(WidgetTransitionOutcome.NoChange, null, current);

        var next = new WidgetRevisionedState(current.InstanceId, checked(current.Revision + 1), nextCompleteState);
        var payload = JsonSerializer.SerializeToElement(operations, Serialization.Default);
        var patchEvent = Create(
            streamId,
            current.InstanceId,
            current.Revision,
            next.Revision,
            WidgetStreamEventKind.Patch,
            payload,
            eventId,
            occurredAtUtc);
        return new(WidgetTransitionOutcome.Applied, patchEvent, next);
    }

    /// <summary>Creates a revision-checked widget removal transition.</summary>
    /// <param name="streamId">Logical stream identifier.</param>
    /// <param name="current">Current validated state.</param>
    /// <param name="expectedBaseRevision">Revision on which the caller based removal.</param>
    /// <param name="eventId">Optional replay identifier.</param>
    /// <param name="occurredAtUtc">Optional occurrence time.</param>
    /// <returns>An applied removal or resynchronisation request.</returns>
    public WidgetTransitionResult Remove(
        string streamId,
        WidgetRevisionedState current,
        long expectedBaseRevision,
        string? eventId = null,
        DateTimeOffset? occurredAtUtc = null)
    {
        if (expectedBaseRevision != current.Revision)
            return Resync(streamId, current, expectedBaseRevision, eventId, occurredAtUtc);

        var removeEvent = Create(
            streamId,
            current.InstanceId,
            current.Revision,
            checked(current.Revision + 1),
            WidgetStreamEventKind.Remove,
            JsonSerializer.SerializeToElement(new { }),
            eventId,
            occurredAtUtc);
        return new(WidgetTransitionOutcome.Applied, removeEvent, null);
    }

    private static WidgetTransitionResult Resync(
        string streamId,
        WidgetRevisionedState current,
        long receivedBaseRevision,
        string? eventId,
        DateTimeOffset? occurredAtUtc)
    {
        var payload = JsonSerializer.SerializeToElement(new
        {
            reason = "revision_mismatch",
            expectedRevision = current.Revision,
            receivedBaseRevision
        });
        var resyncEvent = Create(
            streamId,
            current.InstanceId,
            null,
            current.Revision,
            WidgetStreamEventKind.ResyncRequired,
            payload,
            eventId,
            occurredAtUtc);
        return new(WidgetTransitionOutcome.ResyncRequired, resyncEvent, current);
    }

    private static WidgetStreamEvent Create(
        string streamId,
        Guid? instanceId,
        long? baseRevision,
        long? revision,
        WidgetStreamEventKind kind,
        JsonElement payload,
        string? eventId,
        DateTimeOffset? occurredAtUtc) =>
        new(
            WidgetStreamEvent.CurrentProtocolVersion,
            eventId ?? Guid.NewGuid().ToString("N"),
            streamId,
            instanceId,
            baseRevision,
            revision,
            kind,
            occurredAtUtc ?? DateTimeOffset.UtcNow,
            payload);
}
