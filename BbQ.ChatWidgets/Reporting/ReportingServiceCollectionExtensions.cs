using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace BbQ.ChatWidgets.Reporting;

/// <summary>Registers reporting providers independently of the chat services.</summary>
public static class ReportingServiceCollectionExtensions
{
    /// <summary>
    /// Registers the host's reporting source and definition store as scoped services.
    /// Existing registrations retain their configured lifetimes.
    /// </summary>
    public static IServiceCollection AddBbQReporting<TSource, TStore>(this IServiceCollection services)
        where TSource : class, IReportingSource
        where TStore : class, IReportingStore
    {
        services.TryAddScoped<IReportingSource, TSource>();
        services.TryAddScoped<IReportingStore, TStore>();
        return services;
    }
}
