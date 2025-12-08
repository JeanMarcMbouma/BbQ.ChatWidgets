using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// Extension methods for convenient widget registration.
/// </summary>
public static class WidgetRegistryExtensions
{
    /// <summary>
    /// Registers a custom widget instance with an optional custom type identifier.
    /// </summary>
    /// <param name="registry">The widget registry.</param>
    /// <param name="instance">The widget instance to register as a template.</param>
    /// <param name="typeIdOverride">Optional custom type identifier. If not provided, the instance's Type is used.</param>
    /// <example>
    /// <code>
    /// var registry = services.GetRequiredService&lt;IWidgetRegistry&gt;();
    /// var customWidget = new MyCustomWidget("Label", "action");
    /// registry.RegisterCustom(customWidget);  // Uses default type from instance
    /// registry.RegisterCustom(customWidget, "custom_type");  // Uses custom type ID
    /// </code>
    /// </example>
    public static void RegisterCustom(
        this IWidgetRegistry registry,
        ChatWidget instance,
        string? typeIdOverride = null)
    {
        registry.Register(instance, typeIdOverride);
    }

    /// <summary>
    /// Registers multiple widget instances at once.
    /// </summary>
    /// <param name="registry">The widget registry.</param>
    /// <param name="registrations">A collection of widget registration actions.</param>
    /// <example>
    /// <code>
    /// var registry = services.GetRequiredService&lt;IWidgetRegistry&gt;();
    /// registry.RegisterMultiple(
    ///     r => r.Register("widget1", new Widget1("Label", "action")),
    ///     r => r.Register("widget2", new Widget2("Label", "action")),
    ///     r => r.Register("widget3", new Widget3("Label", "action"))
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
    /// Gets a human-readable summary of all registered widgets.
    /// </summary>
    /// <param name="registry">The widget registry.</param>
    /// <returns>A formatted string listing all registered widget IDs.</returns>
    public static string GetSummary(this IWidgetRegistry registry)
    {
        var instances = registry.GetInstances().ToList();
        if (instances.Count == 0)
            return "No widgets registered.";

        var typeIds = instances
            .Select(i => i.GetType().Name)
            .OrderBy(n => n)
            .ToList();

        return $"Registered Widgets ({instances.Count}):\n  " + 
               string.Join("\n  ", typeIds);
    }
}
