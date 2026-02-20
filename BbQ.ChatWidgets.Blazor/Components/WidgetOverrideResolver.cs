using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Blazor.Components;

internal static class WidgetOverrideResolver
{
    public static Type? ResolveComponentType(
        ChatWidget widget,
        IEnumerable<WidgetComponentOverride>? localOverrides,
        IEnumerable<WidgetComponentOverride>? globalOverrides)
    {
        var local = localOverrides?.ToArray() ?? [];
        var global = globalOverrides?.ToArray() ?? [];

        return ResolveCore(widget, local, exactTypeOnly: true)
            ?? ResolveByTypeId(widget, local)
            ?? ResolveCore(widget, local, exactTypeOnly: false)
            ?? ResolveCore(widget, global, exactTypeOnly: true)
            ?? ResolveByTypeId(widget, global)
            ?? ResolveCore(widget, global, exactTypeOnly: false);
    }

    private static Type? ResolveCore(ChatWidget widget, IReadOnlyList<WidgetComponentOverride> overrides, bool exactTypeOnly)
    {
        foreach (var @override in overrides)
        {
            var matches = exactTypeOnly ? @override.MatchesExactType(widget) : @override.MatchesType(widget);
            if (matches)
            {
                return @override.ComponentType;
            }
        }

        return null;
    }

    private static Type? ResolveByTypeId(ChatWidget widget, IReadOnlyList<WidgetComponentOverride> overrides)
    {
        foreach (var @override in overrides)
        {
            if (@override.MatchesTypeId(widget))
            {
                return @override.ComponentType;
            }
        }

        return null;
    }
}
