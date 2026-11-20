using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace AppReporting;

public static class ReportingEndpoints
{
    private const int RowLimit = 100;

    public static RouteGroupBuilder MapReporting(this IEndpointRouteBuilder app,
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
                if (QueryError(query, datasets) is { } error)
                    return Invalid(error);

                var rows = await source.RunAsync(scope, query, RowLimit + 1, ct);
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
                if (DefinitionError(definition, datasets) is { } error)
                    return Invalid(error);

                return Results.Ok(await store.CreateAsync(scope, definition, ct));
            }));

        group.MapPut("/saved/{id}", (string id, ReportDefinition definition, IReportingStore store,
            IReportingSource source, HttpContext http) => WithScope(source, http, async (scope, ct) =>
            {
                var datasets = await source.GetDatasetsAsync(scope, ct);
                if (DefinitionError(definition, datasets) is { } error)
                    return Invalid(error);

                return await store.UpdateAsync(scope, id, definition, ct)
                    ? Results.NoContent() : Results.NotFound();
            }));

        group.MapDelete("/saved/{id}", (string id, IReportingStore store, IReportingSource source, HttpContext http) =>
            WithScope(source, http, async (scope, ct) => await store.DeleteAsync(scope, id, ct)
                ? Results.NoContent() : Results.NotFound()));

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

    private static string? QueryError(ReportQuery? query, IReadOnlyList<ReportDataset> datasets)
    {
        if (query is null || query.From == default || query.To == default ||
            query.To < query.From || query.To.DayNumber - query.From.DayNumber >= 366)
            return "Choose an inclusive date range of up to 366 days.";

        var dataset = datasets.FirstOrDefault(item => item.Id == query.Dataset);
        if (dataset is null || !dataset.Metrics.Any(metric => metric.Id == query.Metric))
            return "Choose an available dataset and metric.";

        if (query.GroupBy is not null && !dataset.Dimensions.Any(dimension => dimension.Id == query.GroupBy))
            return "Choose an available grouping.";

        return null;
    }

    private static string? DefinitionError(ReportDefinition definition, IReadOnlyList<ReportDataset> datasets)
    {
        if (!ValidTitle(definition.Title) || definition.Tiles is null ||
            definition.Kind is not ("report" or "dashboard") ||
            definition.Tiles.Length is < 1 or > 8 ||
            (definition.Kind == "report" && definition.Tiles.Length != 1))
            return "Provide a title and one tile for a report or up to eight tiles for a dashboard.";

        foreach (var tile in definition.Tiles)
        {
            if (tile is null || !ValidTitle(tile.Title) || tile.View is not ("table" or "bar"))
                return "Each tile needs a title and a table or bar presentation.";

            if (QueryError(tile.Query, datasets) is { } error)
                return error;
        }

        return null;
    }

    private static bool ValidTitle(string? title) => !string.IsNullOrWhiteSpace(title) && title.Length <= 100;
}
