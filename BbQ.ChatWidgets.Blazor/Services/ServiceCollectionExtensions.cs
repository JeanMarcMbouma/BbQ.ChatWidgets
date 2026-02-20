using Microsoft.Extensions.DependencyInjection;
using BbQ.ChatWidgets.Blazor.Services;

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
    public static IServiceCollection AddBbQChatWidgetsBlazor(
        this IServiceCollection services,
        Action<WidgetComponentOverrideOptions>? configureOverrides = null)
    {
        // Register the theme service
        services.AddScoped<IThemeService, DefaultThemeService>();
        ConfigureWidgetOverrides(services, configureOverrides);

        return services;
    }

    /// <summary>
    /// Adds BbQ Chat Widgets Blazor components with a custom theme service factory.
    /// </summary>
    /// <param name="services">The service collection to add services to.</param>
    /// <param name="themeServiceFactory">Factory function to create a custom theme service.</param>
    /// <returns>The service collection for chaining.</returns>
    public static IServiceCollection AddBbQChatWidgetsBlazor(
        this IServiceCollection services,
        Func<IServiceProvider, IThemeService> themeServiceFactory,
        Action<WidgetComponentOverrideOptions>? configureOverrides = null)
    {
        // Register the custom theme service
        services.AddScoped(themeServiceFactory);
        ConfigureWidgetOverrides(services, configureOverrides);

        return services;
    }

    private static void ConfigureWidgetOverrides(
        IServiceCollection services,
        Action<WidgetComponentOverrideOptions>? configureOverrides)
    {
        services.AddOptions<WidgetComponentOverrideOptions>();
        if (configureOverrides is not null)
        {
            services.Configure(configureOverrides);
        }

        services.AddSingleton<IWidgetComponentOverrideProvider, DefaultWidgetComponentOverrideProvider>();
    }
}
