using BbQ.ChatWidgets.Blazor.Components;
using BbQ.ChatWidgets.Models;
using Microsoft.AspNetCore.Components;

namespace BbQ.ChatWidgets.Blazor.Services;

/// <summary>
/// Global options for registering Blazor widget component overrides.
/// </summary>
public sealed class WidgetComponentOverrideOptions
{
    /// <summary>
    /// Gets all registered override mappings.
    /// </summary>
    public List<WidgetComponentOverride> Overrides { get; } = [];

    /// <summary>
    /// Registers a mapping from widget CLR type to component type.
    /// </summary>
    public WidgetComponentOverrideOptions Add<TWidget, TComponent>(string? widgetTypeId = null)
        where TWidget : ChatWidget
        where TComponent : IComponent
    {
        Overrides.Add(new WidgetComponentOverride(typeof(TWidget), widgetTypeId, typeof(TComponent)));
        return this;
    }

    /// <summary>
    /// Registers a mapping using explicit types.
    /// </summary>
    public WidgetComponentOverrideOptions Add(Type componentType, Type? widgetType = null, string? widgetTypeId = null)
    {
        Overrides.Add(new WidgetComponentOverride(widgetType, widgetTypeId, componentType));
        return this;
    }
}
