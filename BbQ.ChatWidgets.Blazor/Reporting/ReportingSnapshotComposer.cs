using System.Text.Json;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Reporting;

namespace BbQ.ChatWidgets.Blazor.Reporting;

internal static class ReportingSnapshotComposer
{
    public static async Task<ReportingWidget?> ComposeAsync(ReportDefinition definition, ReportingCatalog catalog,
        IReportingWorkspaceClient client, IReadOnlySet<int> pagedTiles, CancellationToken cancellationToken, ResolvedReportLayout? layout = null)
    {
        var results = new Dictionary<string, QueryResult>(StringComparer.Ordinal);
        var sources = new Dictionary<string, IReadOnlyList<IReadOnlyDictionary<string, JsonElement>>>();
        var children = new List<ReportingWidget>();
        var widgetIndex = new Dictionary<int, int>();
        var visible = layout?.Placements.SelectMany(card => card.TileIndices).ToHashSet();
        for (var index = 0; index < definition.Tiles.Length; index++)
        {
            if (pagedTiles.Contains(index) || (visible is not null && !visible.Contains(index)))
                continue;

            var tile = definition.Tiles[index];
            var effective = ReportingQueryIdentity.Normalize(tile.Query, FindDataset(catalog, tile.Query)?.Inputs);
            var queryKey = ReportingQueryIdentity.Create(effective);
            if (!results.TryGetValue(queryKey, out var result))
            {
                result = await RunAsync(client, effective, $"source-{results.Count}", cancellationToken);
                cancellationToken.ThrowIfCancellationRequested();
                results.Add(queryKey, result);
                sources.Add(result.Id, result.Rows);
            }

            var dimension = FindDimension(catalog, tile.Query);
            var columns = dimension?.Columns?.Select(column =>
                new ReportingColumn(column.Field, column.Label, column.Editable)).ToArray();
            widgetIndex.Add(index, children.Count);
            children.Add(new ReportingWidget(tile.Title, $"report-result-{index}", tile.View,
                Settings: new ReportingSettings(DataSource: result.Id, DateField: dimension?.DateField, Columns: columns)
                { Presentation = tile.Presentation },
                FilterField: tile.View == "filter" ? "label" : null, Error: result.Error));
        }

        if (children.Count == 0)
            return null;

        ReportingWidgetPlacement[]? placements = null;
        if (layout is not null)
        {
            var ordered = new List<ReportingWidget>();
            placements = layout.Placements.Select(card => new ReportingWidgetPlacement(
                card.TileIndices.Where(widgetIndex.ContainsKey).Select(index =>
                {
                    ordered.Add(children[widgetIndex[index]]);
                    return ordered.Count - 1;
                }).ToArray(), card.Placement.Region, card.Placement.ColumnSpan, card.Placement.RowSpan))
                .Where(card => card.Children.Length > 0).ToArray();
            children = ordered;
        }

        var filters = children.GroupBy(child => child.Settings!.DataSource!)
            .Where(group => layout is null && definition.Filters is null && sources[group.Key].Count > 1 &&
                group.Count() > 1 && group.All(child => child.Kind != "filter"))
            .Select(group => new ReportingWidget("Filter " + group.First().Label, "", "filter",
                new ReportingSettings(DataSource: group.Key), FilterField: "label"));

        return new ReportingWidget(definition.Title, "", "dashboard",
            new ReportingSettings(CategoryField: "label", ValueField: "value", XField: "x", DateField: "date",
                Columns: [new("label", "Group"), new("value", "Value")]) { Layout = placements },
            Sources: sources, Children: [.. filters, .. children]);
    }

    public static ReportDataset? FindDataset(ReportingCatalog catalog, ReportQuery query)
        => catalog.Datasets.FirstOrDefault(dataset => dataset.Id == query.Dataset);

    public static ReportField? FindDimension(ReportingCatalog catalog, ReportQuery query)
        => FindDataset(catalog, query)?.Dimensions.FirstOrDefault(dimension => dimension.Id == query.GroupBy);

    internal static string ErrorMessage(Exception exception)
        => exception is HttpRequestException { StatusCode: not null } httpError
            ? httpError.Message : "The reporting request failed. Try again.";

    private static async Task<QueryResult> RunAsync(IReportingWorkspaceClient client, ReportQuery query, string id,
        CancellationToken cancellationToken)
    {
        try
        {
            var rows = await client.RunAsync(query, cancellationToken);
            return new QueryResult(id, rows.Select((row, index) => ProjectRow(row, index, query.GroupBy)).ToArray(), null);
        }
        catch (Exception exception) when (!cancellationToken.IsCancellationRequested)
        {
            return new QueryResult(id, [], ErrorMessage(exception));
        }
    }

    private static IReadOnlyDictionary<string, JsonElement> ProjectRow(ReportRow row, int index, string? groupBy)
    {
        var fields = new Dictionary<string, JsonElement>(StringComparer.Ordinal)
        {
            ["x"] = JsonSerializer.SerializeToElement(index + 1),
            ["date"] = JsonSerializer.SerializeToElement(groupBy == "day" ? row.Label : null)
        };
        if (row.Fields is not null)
        {
            foreach (var (name, value) in row.Fields)
                fields[name] = value;
        }
        fields["label"] = JsonSerializer.SerializeToElement(row.Label);
        fields["value"] = JsonSerializer.SerializeToElement(row.Value);
        return fields;
    }

    private sealed record QueryResult(string Id, IReadOnlyList<IReadOnlyDictionary<string, JsonElement>> Rows, string? Error);
}
