using System.Text.Json.Nodes;
using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Blazor.Services;

/// <summary>Revision-aware Schema First state adapter for Blazor components.</summary>
public sealed class WidgetStreamReconciler
{
    private readonly Dictionary<Guid, WidgetRevisionedState> _widgets = [];
    private readonly HashSet<string> _eventIds = [];
    /// <summary>Gets current widget state keyed by server-owned instance ID.</summary>
    public IReadOnlyDictionary<Guid, WidgetRevisionedState> Widgets => _widgets;

    /// <summary>Applies one envelope and invokes lifecycle callbacks only for its widget.</summary>
    public WidgetTransitionOutcome Apply(WidgetStreamEvent value, IBlazorWidgetLifecycle lifecycle)
    {
        if (!_eventIds.Add(value.EventId) || value.Kind is WidgetStreamEventKind.Heartbeat) return WidgetTransitionOutcome.NoChange;
        if (value.Kind is WidgetStreamEventKind.ResyncRequired || value.InstanceId is null || value.Revision is null) return WidgetTransitionOutcome.ResyncRequired;
        var id = value.InstanceId.Value;
        _widgets.TryGetValue(id, out var current);
        if (current is not null && value.Revision <= current.Revision) return WidgetTransitionOutcome.NoChange;
        if (value.Kind is WidgetStreamEventKind.Snapshot or WidgetStreamEventKind.Upsert)
        {
            var next = new WidgetRevisionedState(id, value.Revision.Value, value.Payload);
            _widgets[id] = next;
            if (current is null) lifecycle.Mount(id, next); else lifecycle.Update(id, current, next);
            return WidgetTransitionOutcome.Applied;
        }
        if (current is null || value.BaseRevision != current.Revision) return WidgetTransitionOutcome.ResyncRequired;
        if (value.Kind is WidgetStreamEventKind.Remove)
        {
            _widgets.Remove(id); lifecycle.Unmount(id, current); return WidgetTransitionOutcome.Applied;
        }
        if (value.Kind is not WidgetStreamEventKind.Patch) return WidgetTransitionOutcome.NoChange;
        try
        {
            var node = JsonNode.Parse(current.State.GetRawText())!;
            foreach (var operation in value.Payload.EnumerateArray())
            {
                var path = operation.GetProperty("path").GetString()!;
                if (!path.StartsWith('/') || path[1..].Contains('/')) return WidgetTransitionOutcome.ResyncRequired;
                var property = path[1..].Replace("~1", "/", StringComparison.Ordinal).Replace("~0", "~", StringComparison.Ordinal);
                var obj = node.AsObject();
                if (operation.GetProperty("op").GetString() == "remove") obj.Remove(property);
                else obj[property] = JsonNode.Parse(operation.GetProperty("value").GetRawText());
            }
            var next = new WidgetRevisionedState(id, value.Revision.Value, System.Text.Json.JsonSerializer.SerializeToElement(node));
            _widgets[id] = next; lifecycle.Update(id, current, next); return WidgetTransitionOutcome.Applied;
        }
        catch { return WidgetTransitionOutcome.ResyncRequired; }
    }
}

/// <summary>Receives keyed Blazor component lifecycle transitions.</summary>
public interface IBlazorWidgetLifecycle
{
    /// <summary>Mounts a new component.</summary>
    void Mount(Guid instanceId, WidgetRevisionedState state);
    /// <summary>Updates an existing component.</summary>
    void Update(Guid instanceId, WidgetRevisionedState previous, WidgetRevisionedState next);
    /// <summary>Unmounts a removed component.</summary>
    void Unmount(Guid instanceId, WidgetRevisionedState state);
}
