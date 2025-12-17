using Microsoft.Extensions.DependencyInjection;

namespace BbQ.ChatWidgets.Blazor;

/// <summary>
/// Extension methods for registering BbQ Chat Widgets Blazor components.
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds BbQ Chat Widgets Blazor components to the service collection.
    /// </summary>
    /// <param name="services">The service collection to add services to.</param>
    /// <returns>The service collection for chaining.</returns>
    public static IServiceCollection AddBbQChatWidgetsBlazor(this IServiceCollection services)
    {
        // Blazor components are automatically registered, so this extension
        // is primarily for future extensibility and consistency with other platforms
        return services;
    }
}
