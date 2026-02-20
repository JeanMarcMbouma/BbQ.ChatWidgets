namespace BbQ.ChatWidgets.Blazor.Components;

internal sealed class WidgetOverrideCollector
{
    private readonly Dictionary<Guid, WidgetComponentOverride> _overrides = [];

    public void Upsert(Guid id, WidgetComponentOverride @override)
    {
        _overrides[id] = @override;
    }

    public void Remove(Guid id)
    {
        _overrides.Remove(id);
    }

    public IReadOnlyList<WidgetComponentOverride> Snapshot()
    {
        return _overrides.Values.ToArray();
    }
}
