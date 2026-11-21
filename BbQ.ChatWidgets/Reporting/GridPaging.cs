using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace BbQ.ChatWidgets.Reporting;

/// <summary>Supported operations for a detail grid. Fields refer to report column IDs.</summary>
/// <param name="SearchFields">Fields included in a text search.</param>
/// <param name="SortFields">Fields available for sorting.</param>
/// <param name="FilterFields">Fields available for exact text matching.</param>
public sealed record ReportGridCapabilities(string[] SearchFields, string[] SortFields, string[] FilterFields);

/// <summary>An exact text match on an advertised filter field.</summary>
public sealed record ReportGridFilter(string Field, string Value);

/// <summary>Requests a page of detail rows with optional search, sort, and filters.</summary>
/// <param name="Query">The authorized dataset, metric, grouping, and date range.</param>
/// <param name="Offset">Number of matching rows to skip.</param>
/// <param name="Limit">Maximum number of rows to return, between 1 and 100.</param>
/// <param name="Search">Optional search across the advertised search fields.</param>
/// <param name="SortField">Optional advertised sort field.</param>
/// <param name="Descending">Whether to sort the chosen field in descending order.</param>
/// <param name="Filters">Optional exact matches, combined with AND.</param>
public sealed record ReportGridPageRequest(ReportQuery Query, int Offset, int Limit, string? Search = null,
    string? SortField = null, bool Descending = false, ReportGridFilter[]? Filters = null);

/// <summary>A report row and its stable key within the queried dataset.</summary>
public sealed record ReportGridRow(string Key, ReportRow Row);

/// <summary>A page and the total matching row count before paging.</summary>
public sealed record ReportGridPage(int Total, IReadOnlyList<ReportGridRow> Rows);

/// <summary>Optional paging support implemented by the registered reporting source.</summary>
public interface IReportingGridSource : IReportingSource
{
    /// <summary>
    /// Execute a page in the caller's scope. Use deterministic ordering with a stable key tie-breaker.
    /// Apply search and filters before counting and paging.
    /// </summary>
    ValueTask<ReportGridPage> GetPageAsync(ReportScope scope, ReportGridPageRequest request, CancellationToken cancellationToken);
}

public static partial class ReportingEndpoints
{
    private static void MapReportingGrid(RouteGroupBuilder group)
    {
        group.MapPost("/page", (ReportGridPageRequest request, IReportingSource source, HttpContext http) =>
            WithScope(source, http, async (scope, ct) =>
            {
                if (source is not IReportingGridSource gridSource)
                    return Results.NotFound();

                var datasets = await source.GetDatasetsAsync(scope, ct);
                if (QueryError(request.Query, datasets) is { } queryError)
                    return Invalid(queryError);

                var dataset = datasets.First(item => item.Id == request.Query.Dataset);
                var dimension = dataset.Dimensions.FirstOrDefault(item => item.Id == request.Query.GroupBy);
                if (dimension?.Grid is not { } capabilities)
                    return Invalid("Choose a dataset and grouping that support server-side paging.");

                if (PageError(request, capabilities) is { } pageError)
                    return Invalid(pageError);

                var page = await gridSource.GetPageAsync(scope, request, ct);
                var expectedCount = Math.Min(request.Limit, Math.Max(0, page.Total - request.Offset));
                if (page.Total < 0 || page.Rows.Count != expectedCount ||
                    page.Rows.Any(item => string.IsNullOrWhiteSpace(item.Key)) ||
                    page.Rows.Select(item => item.Key).Distinct(StringComparer.Ordinal).Count() != page.Rows.Count)
                    throw new InvalidOperationException("The reporting source returned an invalid grid page.");

                return Results.Ok(page);
            }));
    }

    private static string? PageError(ReportGridPageRequest request, ReportGridCapabilities capabilities)
    {
        if (request.Offset is < 0 or > 1_000_000 || request.Limit is < 1 or > 100)
            return "Choose a page size of 1 to 100 and an offset from 0 to 1,000,000.";

        if (request.Search is { Length: > 160 } ||
            (!string.IsNullOrWhiteSpace(request.Search) && capabilities.SearchFields.Length == 0))
            return "Search is unavailable or exceeds 160 characters.";

        if (request.SortField is not null && !capabilities.SortFields.Contains(request.SortField, StringComparer.Ordinal))
            return "Choose an available sort field.";

        if (request.Filters is { } filters && (filters.Length > 8 ||
            filters.Any(filter => filter is null || !capabilities.FilterFields.Contains(filter.Field, StringComparer.Ordinal) ||
                filter.Value is null or { Length: > 160 }) ||
            filters.Select(filter => filter.Field).Distinct(StringComparer.Ordinal).Count() != filters.Length))
            return "Choose up to eight distinct available filter fields with values of up to 160 characters.";

        return null;
    }
}
