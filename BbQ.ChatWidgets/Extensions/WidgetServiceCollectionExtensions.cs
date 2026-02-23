using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Options;
using Microsoft.Extensions.DependencyInjection;

namespace BbQ.ChatWidgets.Extensions;

/// <summary>
/// Extension methods for registering widgets in the service collection.
/// </summary>
public static class WidgetServiceCollectionExtensions
{
    /// <summary>
    /// Registers a widget factory in the dependency injection container so it is
    /// added to the <see cref="IWidgetRegistry"/> during service initialization.
    /// </summary>
    /// <typeparam name="TWidget">The widget implementation type.</typeparam>
    /// <param name="services">The service collection.</param>
    /// <param name="factory">
    /// A factory function that receives the <see cref="IServiceProvider"/> and returns a
    /// configured <typeparamref name="TWidget"/> instance to use as the widget template.
    /// </param>
    /// <param name="typeIdOverride">
    /// An optional custom type identifier. When omitted, the type identifier is derived from
    /// the class name by removing the "Widget" suffix and converting to lowercase
    /// (e.g. <c>EChartsWidget</c> → <c>"echarts"</c>).
    /// </param>
    /// <returns>The service collection for method chaining.</returns>
    /// <remarks>
    /// Widgets registered with this method are added to <see cref="IWidgetRegistry"/> when
    /// <c>AddBbQChatWidgets</c> builds the registry. This allows widgets whose construction
    /// may depend on other DI services to be registered without manually instantiating them.
    ///
    /// Usage:
    /// <code>
    /// services.AddWidget&lt;EChartsWidget&gt;(sp => new EChartsWidget("Sales Chart", "on_chart_click", "bar", "{}"));
    /// services.AddWidget&lt;ClockWidget&gt;(sp => new ClockWidget("Server Clock", "clock_tick", "UTC", "default-stream"), "clock");
    /// </code>
    /// </remarks>
    public static IServiceCollection AddWidget<TWidget>(
        this IServiceCollection services,
        Func<IServiceProvider, TWidget> factory,
        string? typeIdOverride = null)
        where TWidget : ChatWidget
    {
        ArgumentNullException.ThrowIfNull(factory);

        var typeId = typeIdOverride
            ?? typeof(TWidget).Name.Replace("Widget", string.Empty).ToLowerInvariant();

        services.Configure<WidgetRegistryOptions>(opts => opts.Widgets.Add((typeId, factory)));

        return services;
    }
}
