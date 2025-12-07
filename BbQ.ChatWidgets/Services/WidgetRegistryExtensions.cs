using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// Extension methods for convenient widget registration.
/// </summary>
public static class WidgetRegistryExtensions
{
    /// <summary>
    /// Registers a custom widget type with metadata.
    /// </summary>
    /// <typeparam name="T">The widget class type to register. Must inherit from <see cref="ChatWidget"/>.</typeparam>
    /// <param name="registry">The widget registry.</param>
    /// <param name="typeId">The type identifier string (e.g., "custom_button").</param>
    /// <param name="description">A human-readable description of the widget.</param>
    /// <param name="category">The category or group (e.g., "input", "display", "utility").</param>
    /// <param name="isInteractive">Whether this widget supports user interaction.</param>
    /// <param name="tags">Optional tags for filtering and searching.</param>
    /// <example>
    /// <code>
    /// var registry = services.GetRequiredService&lt;IWidgetRegistry&gt;();
    /// registry.RegisterCustom&lt;MyCustomWidget&gt;(
    ///     "custom_widget",
    ///     "A custom widget for special use cases",
    ///     "custom",
    ///     isInteractive: true,
    ///     "advanced", "experimental"
    /// );
    /// </code>
    /// </example>
    public static void RegisterCustom<T>(
        this IWidgetRegistry registry,
        string typeId,
        string description,
        string category = "custom",
        bool isInteractive = false,
        params string[] tags) where T : ChatWidget
    {
        if (registry is WidgetRegistry concreteRegistry)
        {
            concreteRegistry.Register<T>(typeId, description, category, isInteractive, tags);
        }
    }

    /// <summary>
    /// Registers a custom widget type by passing its Type parameter.
    /// </summary>
    /// <remarks>
    /// This overload is useful for dynamic or reflection-based registration scenarios
    /// where the type is not known at compile time.
    /// </remarks>
    /// <param name="registry">The widget registry.</param>
    /// <param name="widgetType">The widget class type to register. Must inherit from <see cref="ChatWidget"/>.</param>
    /// <param name="typeId">The type identifier string (e.g., "custom_widget").</param>
    /// <param name="description">A human-readable description of the widget.</param>
    /// <param name="category">The category or group (e.g., "input", "display", "utility").</param>
    /// <param name="isInteractive">Whether this widget supports user interaction.</param>
    /// <param name="tags">Optional tags for filtering and searching.</param>
    /// <example>
    /// <code>
    /// var registry = services.GetRequiredService&lt;IWidgetRegistry&gt;();
    /// var customWidgetType = Type.GetType("MyApp.Widgets.CustomWidget");
    /// registry.RegisterCustom(
    ///     customWidgetType,
    ///     "custom_widget",
    ///     "A custom widget for special use cases",
    ///     "custom",
    ///     isInteractive: true,
    ///     "advanced"
    /// );
    /// </code>
    /// </example>
    public static void RegisterCustom(
        this IWidgetRegistry registry,
        Type widgetType,
        string typeId,
        string description,
        string category = "custom",
        bool isInteractive = false,
        params string[] tags)
    {
        if (registry is WidgetRegistry concreteRegistry)
        {
            concreteRegistry.Register(widgetType, typeId, description, category, isInteractive, tags);
        }
    }

    /// <summary>
    /// Registers multiple custom widgets at once.
    /// </summary>
    /// <param name="registry">The widget registry.</param>
    /// <param name="registrations">A collection of widget registration actions.</param>
    /// <example>
    /// <code>
    /// var registry = services.GetRequiredService&lt;IWidgetRegistry&gt;();
    /// registry.RegisterMultiple(
    ///     r => r.RegisterCustom&lt;Widget1&gt;(...),
    ///     r => r.RegisterCustom&lt;Widget2&gt;(...),
    ///     r => r.RegisterCustom&lt;Widget3&gt;(...)
    /// );
    /// </code>
    /// </example>
    public static void RegisterMultiple(
        this IWidgetRegistry registry,
        params Action<IWidgetRegistry>[] registrations)
    {
        foreach (var registration in registrations)
        {
            registration(registry);
        }
    }

    /// <summary>
    /// Gets widget metadata with human-readable information.
    /// </summary>
    /// <param name="metadata">The widget metadata.</param>
    /// <returns>A formatted string describing the widget.</returns>
    public static string GetSummary(this IWidgetMetadata metadata) =>
        $"{metadata.TypeId} ({metadata.Category}): {metadata.Description}" +
        (metadata.Tags.Count > 0 ? $" [Tags: {string.Join(", ", metadata.Tags)}]" : "");

    /// <summary>
    /// Checks if a widget has a specific capability tag.
    /// </summary>
    /// <param name="metadata">The widget metadata.</param>
    /// <param name="tag">The tag to check for.</param>
    /// <returns>True if the widget has the tag; false otherwise.</returns>
    public static bool HasTag(this IWidgetMetadata metadata, string tag) =>
        metadata.Tags.Contains(tag, StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Gets a detailed summary of all registered widgets.
    /// </summary>
    /// <param name="registry">The widget registry.</param>
    /// <returns>A detailed formatted summary of all widgets.</returns>
    public static string GetDetailedSummary(this IWidgetRegistry registry)
    {
        var metadata = registry.GetAllMetadata().ToList();
        if (metadata.Count == 0)
            return "No widgets registered.";

        var lines = new List<string>
        {
            $"Widget Registry Summary ({metadata.Count} widgets)",
            "=" + string.Join("", Enumerable.Range(0, 50).Select(_ => "=")),
        };

        // Group by category
        var byCategory = metadata.GroupBy(m => m.Category).OrderBy(g => g.Key);
        foreach (var categoryGroup in byCategory)
        {
            lines.Add($"\n{categoryGroup.Key.ToUpper()} WIDGETS:");
            lines.Add("-" + string.Join("", Enumerable.Range(0, 40).Select(_ => "-")));

            foreach (var widget in categoryGroup.OrderBy(w => w.TypeId))
            {
                lines.Add($"  • {widget.TypeId}");
                if (!string.IsNullOrEmpty(widget.Description))
                    lines.Add($"    {widget.Description}");
                if (widget.IsInteractive)
                    lines.Add("    [Interactive]");
                if (widget.Tags.Count > 0)
                    lines.Add($"    Tags: {string.Join(", ", widget.Tags)}");
            }
        }

        // Summary stats
        lines.Add("\n" + "=" + string.Join("", Enumerable.Range(0, 50).Select(_ => "=")));
        lines.Add($"Total: {metadata.Count} widgets");
        lines.Add($"Interactive: {metadata.Count(m => m.IsInteractive)}");
        lines.Add($"Built-in: {metadata.Count(m => m.IsBuiltIn)}");
        lines.Add($"Custom: {metadata.Count(m => !m.IsBuiltIn)}");

        return string.Join("\n", lines);
    }
}
