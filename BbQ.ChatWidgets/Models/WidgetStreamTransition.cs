using System.Text.Json;

namespace BbQ.ChatWidgets.Models;

/// <summary>
/// Validated complete widget state paired with its server-owned revision.
/// </summary>
public sealed record WidgetRevisionedState
{
    public WidgetRevisionedState(Guid instanceId, long revision, JsonElement state)
    {
        if (instanceId == Guid.Empty)
            throw new ArgumentException("A widget instance ID cannot be empty.", nameof(instanceId));
        if (revision < 0)
            throw new ArgumentOutOfRangeException(nameof(revision));
        if (state.ValueKind is not JsonValueKind.Object)
            throw new ArgumentException("Widget state must be a complete JSON object.", nameof(state));

        InstanceId = instanceId;
        Revision = revision;
        State = state.Clone();
    }

    public Guid InstanceId { get; }
    public long Revision { get; }
    public JsonElement State { get; }
}

public enum WidgetTransitionOutcome
{
    Applied,
    NoChange,
    ResyncRequired
}

/// <summary>
/// Result of reconciling validated complete widget state against a current revision.
/// </summary>
public sealed record WidgetTransitionResult(
    WidgetTransitionOutcome Outcome,
    WidgetStreamEvent? Event,
    WidgetRevisionedState? NextState);
