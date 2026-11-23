using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace BbQ.ChatWidgets.Reporting;

/// <summary>Registers the reporting HTTP API independently of chat endpoints.</summary>
public static partial class ReportingEndpoints
{
    private const int RowLimit = 100;

    /// <summary>Maps the reporting catalog, query, and saved definition endpoints.</summary>
    /// <param name="app">The endpoint route builder.</param>
    /// <param name="path">The reporting route prefix.</param>
    /// <param name="policy">The host's authorization policy name, or null for the default policy.</param>
    /// <returns>The route group for additional endpoint conventions.</returns>
    public static RouteGroupBuilder MapBbQReporting(this IEndpointRouteBuilder app,
        string path = "/api/reporting", string? policy = null)
    {
        var group = app.MapGroup(path);
        if (policy is null)
            group.RequireAuthorization();
        else
            group.RequireAuthorization(policy);

        group.MapGet("/catalog", (IReportingSource source, HttpContext http) =>
            WithScope(source, http, async (scope, ct) =>
            {
                var datasets = await source.GetDatasetsAsync(scope, ct);
                var presets = await source.GetPresetsAsync(scope, ct);
                return Results.Ok(new { datasets, presets });
            }));

        group.MapPost("/run", (ReportQuery query, IReportingSource source, HttpContext http) =>
            WithScope(source, http, async (scope, ct) =>
            {
                var datasets = await source.GetDatasetsAsync(scope, ct);
                var (resolved, error) = await ResolveQueryAsync(source, scope, query, datasets, ct);
                if (error is not null)
                    return Invalid(error);

                var rows = await source.RunAsync(scope, resolved!, RowLimit + 1, ct);
                return rows.Count > RowLimit
                    ? Results.UnprocessableEntity(new { error = "Too many groups. Narrow the date range or change the grouping." })
                    : Results.Ok(rows);
            }));

        group.MapGet("/saved", (IReportingStore store, IReportingSource source, HttpContext http) =>
            WithScope(source, http, async (scope, ct) => Results.Ok(await store.ListAsync(scope, ct))));

        group.MapPost("/saved", (ReportDefinition definition, IReportingStore store, IReportingSource source, HttpContext http) =>
            WithScope(source, http, async (scope, ct) =>
            {
                var datasets = await source.GetDatasetsAsync(scope, ct);
                if (await DefinitionErrorAsync(source, scope, definition, datasets, ct) is { } error)
                    return Invalid(error);

                return Results.Ok(await store.CreateAsync(scope, definition, ct));
            }));

        group.MapPut("/saved/{id}", (string id, ReportDefinition definition, IReportingStore store,
            IReportingSource source, HttpContext http) => WithScope(source, http, async (scope, ct) =>
            {
                var datasets = await source.GetDatasetsAsync(scope, ct);
                if (await DefinitionErrorAsync(source, scope, definition, datasets, ct) is { } error)
                    return Invalid(error);

                return await store.UpdateAsync(scope, id, definition, ct)
                    ? Results.NoContent() : Results.NotFound();
            }));

        group.MapDelete("/saved/{id}", (string id, IReportingStore store, IReportingSource source, HttpContext http) =>
            WithScope(source, http, async (scope, ct) => await store.DeleteAsync(scope, id, ct)
                ? Results.NoContent() : Results.NotFound()));

        MapReportingInputOptions(group);
        MapReportingGrid(group);
        return group;
    }

    private static async Task<IResult> WithScope(
        IReportingSource source, HttpContext http, Func<ReportScope, CancellationToken, Task<IResult>> action)
    {
        http.Response.Headers.CacheControl = "no-store";
        var ct = http.RequestAborted;
        var scope = await source.ResolveScopeAsync(http.User, ct);
        return scope is null ? Results.StatusCode(StatusCodes.Status403Forbidden) : await action(scope, ct);
    }

    private static IResult Invalid(string error) => Results.BadRequest(new { error });

    private static async ValueTask<string?> DefinitionErrorAsync(IReportingSource source, ReportScope scope,
        ReportDefinition definition, IReadOnlyList<ReportDataset> datasets, CancellationToken ct)
    {
        if (!ValidTitle(definition.Title) || definition.Tiles is null ||
            definition.Kind is not ("report" or "dashboard") ||
            definition.Tiles.Length is < 1 or > 8 ||
            (definition.Kind == "report" && definition.Tiles.Length != 1))
            return "Provide a title and one tile for a report or up to eight tiles for a dashboard.";

        foreach (var tile in definition.Tiles)
        {
            if (tile is null || !ValidTitle(tile.Title) ||
                tile.View is not ("table" or "grid" or "bar" or "line" or "pie" or "timeline" or "scatter" or "metric"
                    or "filter" or "waterfall" or "pareto" or "histogram" or "time-line" or "area" or "step" or "time-column") ||
                (tile.View == "filter" && definition.Kind != "dashboard"))
                return "Each tile needs a title and a supported presentation.";

            var (_, error) = await ResolveQueryAsync(source, scope, tile.Query, datasets, ct);
            if (error is not null)
                return error;

            var dataset = datasets.First(item => item.Id == tile.Query.Dataset);
            if (TileBindingsError(tile, dataset) is { } tileError)
                return tileError;
        }

        if (definition.Filters is { } filters)
        {
            var allowed = ReportingFilterCatalog.AvailableInputs(definition, datasets)
                .Where(input => input.Role == ReportInputRole.Filter).Select(input => input.Id)
                .ToHashSet(StringComparer.Ordinal);
            var seen = new HashSet<string>(StringComparer.Ordinal);
            if (filters.Length > allowed.Count || filters.Any(filter => filter is null ||
                !ValidInputId(filter.Input) || !allowed.Contains(filter.Input) || !seen.Add(filter.Input) ||
                (filter.Label is not null && !ValidTitle(filter.Label))))
                return "Choose distinct available catalog filters with valid labels.";
        }

        return null;
    }

    private static bool ValidTitle(string? title) => !string.IsNullOrWhiteSpace(title) && title.Length <= 100;
}
