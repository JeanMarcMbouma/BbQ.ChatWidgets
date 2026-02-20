using BbQ.ChatWidgets.Models;
using Microsoft.AspNetCore.Components;

namespace BbQ.ChatWidgets.Blazor.Components;

/// <summary>
/// Declares a mapping between a widget (by CLR type and/or type id) and a Blazor component used to render it.
/// </summary>
public sealed record WidgetComponentOverride
{
    /// <summary>
    /// Creates a new widget component override mapping.
    /// </summary>
    /// <param name="widgetType">Optional widget CLR type to match.</param>
    /// <param name="widgetTypeId">Optional widget type id to match (case-insensitive).</param>
    /// <param name="componentType">The Blazor component type used to render the widget.</param>
    /// <exception cref="ArgumentException">Thrown when no match key is provided.</exception>
    /// <exception cref="ArgumentNullException">Thrown when component type is null.</exception>
    public WidgetComponentOverride(Type? widgetType, string? widgetTypeId, Type componentType)
    {
        if (widgetType is null && string.IsNullOrWhiteSpace(widgetTypeId))
        {
            throw new ArgumentException("Either widgetType or widgetTypeId must be provided.");
        }

        if (componentType is null)
        {
            throw new ArgumentNullException(nameof(componentType));
        }

        if (!typeof(IComponent).IsAssignableFrom(componentType))
        {
            throw new ArgumentException($"Component type '{componentType.FullName}' must implement {nameof(IComponent)}.", nameof(componentType));
        }

        WidgetType = widgetType;
        WidgetTypeId = string.IsNullOrWhiteSpace(widgetTypeId) ? null : widgetTypeId.Trim();
        ComponentType = componentType;
    }

    /// <summary>
    /// Optional widget CLR type used for matching.
    /// </summary>
    public Type? WidgetType { get; }

    /// <summary>
    /// Optional widget type id used for matching.
    /// </summary>
    public string? WidgetTypeId { get; }

    /// <summary>
    /// Blazor component type used to render matching widgets.
    /// </summary>
    public Type ComponentType { get; }

    internal bool MatchesType(ChatWidget widget) =>
        WidgetType is not null && WidgetType.IsAssignableFrom(widget.GetType());

    internal bool MatchesExactType(ChatWidget widget) =>
        WidgetType is not null && WidgetType == widget.GetType();

    internal bool MatchesTypeId(ChatWidget widget) =>
        WidgetTypeId is not null && string.Equals(WidgetTypeId, GetWidgetTypeId(widget), StringComparison.OrdinalIgnoreCase);

    private static string GetWidgetTypeId(ChatWidget widget)
    {
        return widget.Type;
    }
}
