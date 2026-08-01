using System.Text.Json;

namespace BbQ.ChatWidgets.Models;

/// <summary>
/// Validated complete widget state paired with its server-owned revision.
/// </summary>
public sealed record WidgetRevisionedState
{
    /// <summary>Initializes validated state at a server-owned revision.</summary>
    /// <param name="instanceId">Stable widget instance identifier.</param>
    /// <param name="revision">Non-negative state revision.</param>
    /// <param name="state">Complete validated widget JSON object.</param>
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

    /// <summary>Gets the stable widget instance identifier.</summary>
    public Guid InstanceId { get; }
    /// <summary>Gets the current server-owned revision.</summary>
    public long Revision { get; }
    /// <summary>Gets the complete validated widget state.</summary>
    public JsonElement State { get; }
}

/// <summary>Describes the result of reconciling a requested state transition.</summary>
public enum WidgetTransitionOutcome
{
    /// <summary>The transition produced a new revision and event.</summary>
    Applied,
    /// <summary>The requested state was equivalent to current state.</summary>
    NoChange,
    /// <summary>The supplied base revision did not match current state.</summary>
    ResyncRequired
}

/// <summary>
/// Result of reconciling validated complete widget state against a current revision.
/// </summary>
public sealed record WidgetTransitionResult(
    WidgetTransitionOutcome Outcome,
    WidgetStreamEvent? Event,
    WidgetRevisionedState? NextState);
