using System.Globalization;
using System.Text.Json;
using BbQ.ChatWidgets.Blazor.Reporting;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Reporting;
using Microsoft.AspNetCore.Components;

namespace BbQ.ChatWidgets.Blazor.Components;

public partial class ReportingWorkspace : IDisposable
{
    /// <summary>The host's reporting client, configured to act on behalf of the current user.</summary>
    [Parameter, EditorRequired] public IReportingWorkspaceClient Client { get; set; } = default!;

    /// <summary>The preset to open when the workspace loads.</summary>
    [Parameter] public string? InitialPreset { get; set; }

    /// <summary>Supplies a custom host action name for a report tile.</summary>
    [Parameter] public Func<ReportTile, int, string?>? ResolveAction { get; set; }

    /// <summary>Handles row activation, chart selection, and other snapshot actions.</summary>
    [Parameter] public EventCallback<ReportingWorkspaceAction> OnReportingAction { get; set; }

    private static readonly (string Id, string Label)[] Views =
    [
        ("bar", "Bar chart"), ("line", "Line chart"), ("pie", "Pie chart"), ("timeline", "Timeline"),
        ("time-line", "Time-series line"), ("area", "Area chart"), ("step", "Step chart"),
        ("time-column", "Time-series columns"), ("scatter", "Scatter plot"), ("waterfall", "Waterfall"),
        ("pareto", "Pareto"), ("histogram", "Histogram"), ("table", "Table"), ("grid", "Data grid"),
        ("metric", "Metric"), ("filter", "Filter")
    ];

    private static readonly HashSet<string> DateViews = new(StringComparer.Ordinal)
        { "timeline", "time-line", "area", "step", "time-column" };

    private ReportingCatalog? catalog;
    private List<SavedReport> saved = [];
    private ReportDefinition? draft;
    private string? savedId;
    private string? presetId;
    private bool editing;
    private bool busy;
    private string? error;
    private string? status;
    private ReportingWidget? snapshot;
    private IReadOnlyList<ReportTile> renderedTiles = [];
    private IReadOnlyList<PagedTile> paged = [];
    private IReportingWorkspaceClient? previousClient;
    private CancellationTokenSource lifetime = new();

    protected override Task OnParametersSetAsync()
    {
        if (ReferenceEquals(previousClient, Client))
            return Task.CompletedTask;
        previousClient = Client;
        lifetime.Cancel();
        lifetime.Dispose();
        lifetime = new CancellationTokenSource();
        catalog = null;
        saved = [];
        draft = null;
        savedId = presetId = null;
        editing = busy = false;
        ClearPreview();
        return LoadAsync();
    }

    private Task LoadAsync() => WorkAsync(async (client, ct) =>
    {
        var available = await client.GetCatalogAsync(ct);
        ct.ThrowIfCancellationRequested();
        var definitions = await client.ListAsync(ct);
        ct.ThrowIfCancellationRequested();
        catalog = available;
        saved = [.. definitions];
        var preset = available.Presets.FirstOrDefault(item => item.Id == InitialPreset) ?? available.Presets.FirstOrDefault();
        if ((preset ?? saved.FirstOrDefault()) is { } initial)
        {
            Open(initial, isSaved: preset is null);
            await RenderAsync(client, ct);
        }
    });

    private Task OpenAsync(SavedReport report, bool isSaved) => WorkAsync(async (client, ct) =>
    {
        Open(report, isSaved);
        await RenderAsync(client, ct);
    });

    private void Open(SavedReport report, bool isSaved)
    {
        draft = report.Definition with { Tiles = [.. report.Definition.Tiles] };
        savedId = isSaved ? report.Id : null;
        presetId = isSaved ? null : report.Id;
        editing = false;
        ClearPreview();
    }

    private void Start(string kind)
    {
        draft = new ReportDefinition(string.Empty, kind, [NewTile()]);
        savedId = presetId = error = status = null;
        editing = true;
        ClearPreview();
    }

    private ReportTile NewTile()
    {
        var dataset = catalog?.Datasets.FirstOrDefault();
        var defaults = catalog?.Presets.FirstOrDefault()?.Definition.Tiles.FirstOrDefault()?.Query;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return new ReportTile(string.Empty, "table", new ReportQuery(dataset?.Id ?? string.Empty,
            dataset?.Metrics.FirstOrDefault()?.Id ?? string.Empty, null, defaults?.From ?? today, defaults?.To ?? today));
    }

    private void AddTile() => SetTiles([.. draft!.Tiles, NewTile()]);

    private void RemoveTile(int index) => SetTiles(draft!.Tiles.Where((_, position) => position != index).ToArray());

    private void MoveTile(int index, int direction)
    {
        var tiles = draft!.Tiles;
        (tiles[index], tiles[index + direction]) = (tiles[index + direction], tiles[index]);
        ClearPreview();
    }

    private void SetTiles(ReportTile[] tiles)
    {
        draft = draft! with { Tiles = tiles };
        ClearPreview();
    }

    private void ChangeTitle(string title)
    {
        draft = draft! with { Title = title };
        ClearPreview();
    }

    private void ChangeTile(int index, ReportTile tile)
    {
        draft!.Tiles[index] = tile;
        ClearPreview();
    }

    private void ChangeQuery(int index, ReportQuery query) => ChangeTile(index, draft!.Tiles[index] with { Query = query });

    private void ChangeDataset(int index, string? id)
    {
        if (catalog?.Datasets.FirstOrDefault(item => item.Id == id) is { } dataset)
            ChangeQuery(index, draft!.Tiles[index].Query with
            {
                Dataset = dataset.Id,
                Metric = dataset.Metrics.FirstOrDefault()?.Id ?? string.Empty,
                GroupBy = null
            });
    }

    private void ChangeGrouping(int index, string? value)
        => ChangeQuery(index, draft!.Tiles[index].Query with { GroupBy = string.IsNullOrEmpty(value) ? null : value });

    private void ChangeDate(int index, string? value, bool from)
    {
        DateOnly.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date);
        var query = draft!.Tiles[index].Query;
        ChangeQuery(index, from ? query with { From = date } : query with { To = date });
    }

    private static string DateValue(DateOnly value)
        => value == default ? string.Empty : value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

    private bool CanRun => draft is { Tiles.Length: > 0 } definition && !string.IsNullOrWhiteSpace(definition.Title)
        && definition.Tiles.All(tile => !string.IsNullOrWhiteSpace(tile.Title) && !string.IsNullOrEmpty(tile.Query.Dataset)
            && !string.IsNullOrEmpty(tile.Query.Metric) && tile.Query.From != default && tile.Query.To >= tile.Query.From);

    private void ClearPreview()
    {
        snapshot = null;
        paged = [];
        renderedTiles = [];
    }

    private Task RunAsync() => CanRun ? WorkAsync(async (client, ct) =>
    {
        ClearPreview();
        await RenderAsync(client, ct);
        editing = false;
    }) : Task.CompletedTask;

    private async Task RenderAsync(IReportingWorkspaceClient client, CancellationToken cancellationToken)
    {
        if (draft is not { } definition || catalog is not { } available)
            return;
        var tileSnapshot = definition with { Tiles = [.. definition.Tiles] };
        var grids = new List<PagedTile>();
        var pagedIndices = new HashSet<int>();
        for (var index = 0; index < tileSnapshot.Tiles.Length; index++)
        {
            var tile = tileSnapshot.Tiles[index];
            if (tile.View == "grid" && ReportingSnapshotComposer.FindDimension(available, tile.Query) is { Grid: not null } dimension)
            {
                grids.Add(new PagedTile(tile, index, dimension));
                pagedIndices.Add(index);
            }
        }

        var composed = await ReportingSnapshotComposer.ComposeAsync(tileSnapshot, available, client, pagedIndices, cancellationToken);
        cancellationToken.ThrowIfCancellationRequested();
        snapshot = composed;
        paged = grids;
        renderedTiles = tileSnapshot.Tiles;
    }

    private Task SaveAsync() => CanRun ? WorkAsync(async (client, ct) =>
    {
        var definition = draft! with { Tiles = [.. draft!.Tiles] };
        if (savedId is { } id)
        {
            await client.UpdateAsync(id, definition, ct);
            ct.ThrowIfCancellationRequested();
            var index = saved.FindIndex(item => item.Id == id);
            if (index >= 0)
                saved[index] = new SavedReport(id, definition);
        }
        else
        {
            var created = await client.CreateAsync(definition, ct);
            ct.ThrowIfCancellationRequested();
            savedId = created.Id;
            presetId = null;
            saved.Add(created);
        }
        status = "Saved.";
    }) : Task.CompletedTask;

    private Task DeleteAsync() => savedId is not { } id ? Task.CompletedTask : WorkAsync(async (client, ct) =>
    {
        await client.DeleteAsync(id, ct);
        ct.ThrowIfCancellationRequested();
        saved.RemoveAll(item => item.Id == id);
        savedId = null;
        status = "Deleted saved copy. You can still edit this draft.";
    });

    private Task OnSnapshotAction(IReadOnlyList<ReportTile> sourceTiles, (string Action, object? Payload) value)
    {
        const string prefix = "report-result-";
        if (!ReferenceEquals(sourceTiles, renderedTiles) || !value.Action.StartsWith(prefix, StringComparison.Ordinal) ||
            !int.TryParse(value.Action.AsSpan(prefix.Length), NumberStyles.None, CultureInfo.InvariantCulture, out var index) ||
            index >= sourceTiles.Count || value.Payload is not JsonElement element ||
            ReportingInteraction.FromSnapshot(element) is not { } interaction)
            return Task.CompletedTask;

        if (interaction is ReportingCellEdit)
            status = "Cell updated in this preview. Source data is unchanged.";
        return EmitAsync(sourceTiles[index], index, interaction);
    }

    private Task OnPagedAction(IReadOnlyList<ReportTile> sourceTiles, PagedTile grid, ReportingGridRowActivation activation)
        => ReferenceEquals(sourceTiles, renderedTiles) ? EmitAsync(grid.Tile, grid.Index, activation) : Task.CompletedTask;

    private Task EmitAsync(ReportTile tile, int index, ReportingInteraction interaction)
        => OnReportingAction.InvokeAsync(new ReportingWorkspaceAction(
            ResolveAction?.Invoke(tile, index) ?? $"report-result-{index}", tile, index, interaction));

    private async Task WorkAsync(Func<IReportingWorkspaceClient, CancellationToken, Task> operation)
    {
        if (busy)
            return;

        var ct = lifetime.Token;
        busy = true;
        error = status = null;
        try
        {
            await operation(Client, ct);
        }
        catch (Exception) when (ct.IsCancellationRequested)
        {
        }
        catch (Exception exception) when (!ct.IsCancellationRequested)
        {
            error = ReportingSnapshotComposer.ErrorMessage(exception);
        }
        finally
        {
            if (!ct.IsCancellationRequested)
                busy = false;
        }
    }

    public void Dispose()
    {
        lifetime.Cancel();
        lifetime.Dispose();
    }

    private sealed record PagedTile(ReportTile Tile, int Index, ReportField Dimension);
}
