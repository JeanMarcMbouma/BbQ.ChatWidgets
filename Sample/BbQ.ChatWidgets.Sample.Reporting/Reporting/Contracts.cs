using System.Security.Claims;

namespace AppReporting;

public sealed record ReportScope(string Tenant, string User);
public sealed record ReportField(string Id, string Label);
public sealed record ReportDataset(string Id, string Label, ReportField[] Metrics, ReportField[] Dimensions);
public sealed record ReportQuery(string Dataset, string Metric, string? GroupBy, DateOnly From, DateOnly To);
public sealed record ReportRow(string Label, decimal Value);
public sealed record ReportTile(string Title, string View, ReportQuery Query);
public sealed record ReportDefinition(string Title, string Kind, ReportTile[] Tiles);
public sealed record SavedReport(string Id, ReportDefinition Definition);

public interface IReportingSource
{
    ValueTask<ReportScope?> ResolveScopeAsync(ClaimsPrincipal user, CancellationToken cancellation);
    ValueTask<IReadOnlyList<ReportDataset>> GetDatasetsAsync(ReportScope scope, CancellationToken cancellation);
    ValueTask<IReadOnlyList<SavedReport>> GetPresetsAsync(ReportScope scope, CancellationToken cancellation);

    // Apply the scope to the data query, aggregate at the data source and return at most limit rows.
    ValueTask<IReadOnlyList<ReportRow>> RunAsync(
        ReportScope scope, ReportQuery query, int limit, CancellationToken cancellation);
}

public interface IReportingStore
{
    ValueTask<IReadOnlyList<SavedReport>> ListAsync(ReportScope scope, CancellationToken cancellation);
    ValueTask<SavedReport> CreateAsync(ReportScope scope, ReportDefinition definition, CancellationToken cancellation);
    ValueTask<bool> UpdateAsync(ReportScope scope, string id, ReportDefinition definition, CancellationToken cancellation);
    ValueTask<bool> DeleteAsync(ReportScope scope, string id, CancellationToken cancellation);
}
