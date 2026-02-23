using BbQ.ChatWidgets.Abstractions;

namespace BbQ.ChatWidgets.Options;

/// <summary>
/// Holds the collection of action‑handler registration delegates used to
/// populate an <see cref="IWidgetActionRegistry"/> during application startup.
/// </summary>
/// <remarks>
/// Each delegate receives the application's <see cref="IServiceProvider"/> and the
/// <see cref="IWidgetActionRegistry"/> instance, allowing it to register action
/// metadata and return an <see cref="ActionRegistrationMetadata"/> describing the
/// associated handler.
/// </remarks>
internal sealed class ActionHandlerOptions
{
    /// <summary>
    /// Gets the list of registration delegates that add action metadata and
    /// handler bindings to the widget action registry.
    /// </summary>
    public List<Func<IServiceProvider, IWidgetActionRegistry, ActionRegistrationMetadata>> Handlers { get; } = [];
}