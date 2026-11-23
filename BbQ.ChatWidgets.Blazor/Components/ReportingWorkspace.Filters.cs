using System.Globalization;
using System.Text.Json;
using BbQ.ChatWidgets.Blazor.Reporting;
using BbQ.ChatWidgets.Reporting;

namespace BbQ.ChatWidgets.Blazor.Components;

public partial class ReportingWorkspace
{
    private ReportInput[] controls = [];
    private ReportInputSelection[] filterValues = [];

    private IReadOnlyList<ReportInput> AvailableFilters =>
        draft is { } definition && catalog is { } available
            ? ReportingFilterCatalog.AvailableInputs(definition, available.Datasets)
                .Where(input => input.Role == ReportInputRole.Filter).ToArray()
            : [];

    private ReportFilter[] EditableFilters =>
        draft?.Filters ?? AvailableFilters.Select(input => new ReportFilter(input.Id)).ToArray();

    private IReadOnlyList<ReportInput> AddableFilters
    {
        get
        {
            var configured = EditableFilters;
            return AvailableFilters.Where(input => !configured.Any(filter => filter.Input == input.Id)).ToArray();
        }
    }

    private string FilterLabel(string id) => AvailableFilters.FirstOrDefault(input => input.Id == id)?.Label ?? id;

    private void AddFilter(string? id)
    {
        if (id is not null && AddableFilters.Any(input => input.Id == id))
            SetFilters([.. EditableFilters, new ReportFilter(id)]);
    }

    private void RenameFilter(string id, string? label) => SetFilters(EditableFilters.Select(filter =>
        filter.Input == id ? filter with { Label = string.IsNullOrWhiteSpace(label) ? null : label.Trim() } : filter).ToArray());

    private void MoveFilter(int index, int offset)
    {
        var filters = EditableFilters.ToArray();
        if ((uint)(index + offset) >= filters.Length) return;
        (filters[index], filters[index + offset]) = (filters[index + offset], filters[index]);
        SetFilters(filters);
    }

    private void RemoveFilter(string id) => SetFilters(EditableFilters.Where(filter => filter.Input != id).ToArray());

    private void SetFilters(ReportFilter[] filters)
    {
        if (draft is not { } definition) return;
        var removed = EditableFilters.Select(filter => filter.Input)
            .Except(filters.Select(filter => filter.Input), StringComparer.Ordinal).ToHashSet(StringComparer.Ordinal);
        var tiles = definition.Tiles.Select(tile =>
        {
            var selections = tile.Query.Inputs?.Where(selection => !removed.Contains(selection.Id)).ToArray();
            return selections is null || selections.Length == tile.Query.Inputs?.Length ? tile :
                tile with { Query = tile.Query with { Inputs = selections.Length == 0 ? null : selections } };
        }).ToArray();
        filterValues = filterValues.Where(selection => !removed.Contains(selection.Id)).ToArray();
        draft = definition with { Filters = filters, Tiles = tiles };
        ClearPreview();
    }

    private void PruneFilters()
    {
        if (draft?.Filters is not { } filters) return;
        var available = AvailableFilters;
        var retained = filters.Where(filter => available.Any(input => input.Id == filter.Input)).ToArray();
        if (retained.Length != filters.Length) SetFilters(retained);
    }

    private ReportDefinition ApplyFilters(ReportDefinition definition, IReadOnlyList<ReportDataset> datasets)
    {
        if (filterValues.Length == 0) return definition;
        var allowed = ReportingFilterCatalog.WorkspaceInputs(definition, datasets)
            .Select(input => input.Id).ToHashSet(StringComparer.Ordinal);
        return definition with
        {
            Tiles = definition.Tiles.Select(tile =>
            {
                var supported = datasets.FirstOrDefault(dataset => dataset.Id == tile.Query.Dataset)?.Inputs ?? [];
                var overrides = filterValues.Where(selection => allowed.Contains(selection.Id) &&
                    supported.Any(input => input.Id == selection.Id && input.Type == selection.Value.Type)).ToArray();
                if (overrides.Length == 0) return tile;
                var values = (tile.Query.Inputs ?? []).Where(selection => !overrides.Any(value => value.Id == selection.Id));
                return tile with { Query = tile.Query with { Inputs = [.. values, .. overrides] } };
            }).ToArray()
        };
    }

    private static Task<ReportInput[]> ResolveControlsAsync(ReportDefinition definition, ReportingCatalog catalog,
        IReportingWorkspaceClient client, CancellationToken ct) => Task.WhenAll(
        ReportingFilterCatalog.WorkspaceInputs(definition, catalog.Datasets).Select(async input =>
        {
            var contexts = definition.Tiles.Select(tile => tile.Query).DistinctBy(query => (query.Dataset, query.From, query.To))
                .Select(query => (Query: query, Input: catalog.Datasets.FirstOrDefault(dataset => dataset.Id == query.Dataset)
                    ?.Inputs?.FirstOrDefault(item => item.Id == input.Id)))
                .Where(context => context.Input is not null);
            var choices = await Task.WhenAll(contexts.Select(async context =>
            {
                if (context.Input?.Options is { } options) return options;
                if (client is not IReportingInputWorkspaceClient scopedClient) return [];
                try
                {
                    var query = context.Query;
                    return await scopedClient.GetInputOptionsAsync(new(query.Dataset, input.Id, query.From, query.To), ct);
                }
                catch (HttpRequestException) when (!ct.IsCancellationRequested)
                {
                    return [];
                }
            }));
            return input with
            {
                Options = choices.FirstOrDefault()?.Where(option => choices.Skip(1)
                    .All(other => other.Any(value => value.Value == option.Value))).ToArray() ?? []
            };
        }));

    private string SelectedOption(ReportInput input)
    {
        var selection = filterValues.FirstOrDefault(value => value.Id == input.Id);
        var index = selection is null || input.Options is null ? -1 :
            Array.FindIndex(input.Options, option => option.Value == selection.Value);
        return index < 0 ? string.Empty : index.ToString(CultureInfo.InvariantCulture);
    }

    private Task ChooseOptionAsync(ReportInput input, string? option)
    {
        var options = input.Options ?? [];
        return int.TryParse(option, NumberStyles.None, CultureInfo.InvariantCulture, out var index) && index < options.Length
            ? ChangeValueAsync(input.Id, options[index].Value)
            : ChangeValueAsync(input.Id, null);
    }

    private Task ChangeValueAsync(string id, ReportInputValue? value) => WorkAsync(async (client, ct) =>
    {
        var retained = filterValues.Where(selection => selection.Id != id);
        filterValues = value is { } selected ? [.. retained, new ReportInputSelection(id, selected)] : retained.ToArray();
        await RenderAsync(client, ct);
    });

    private Task ClearFiltersAsync() => WorkAsync(async (client, ct) =>
    {
        filterValues = [];
        await RenderAsync(client, ct);
    });

    private async Task ApplyFilterActionAsync(ReportTile tile, ReportingInteraction action)
    {
        if (tile.InputBinding is not { } binding || controls.FirstOrDefault(input =>
            input.Role == ReportInputRole.Filter && input.Id == binding.Input)?.Options is not { } options)
            return;

        var cell = action switch
        {
            ReportingSelection { Group: { } group } when group.Field == binding.Field => group.Value,
            ReportingSelection { Row: { } row } => row.GetValueOrDefault(binding.Field),
            ReportingSnapshotRowActivation activation => activation.Row.GetValueOrDefault(binding.Field),
            ReportingGridRowActivation activation when binding.Field == "label" => JsonSerializer.SerializeToElement(activation.Row.Label),
            ReportingGridRowActivation activation when binding.Field == "value" => JsonSerializer.SerializeToElement(activation.Row.Value),
            ReportingGridRowActivation activation => activation.Row.Fields?.GetValueOrDefault(binding.Field) ?? default,
            _ => default
        };
        if (cell.ValueKind == JsonValueKind.Undefined) return;
        try
        {
            var value = cell.Deserialize<ReportInputValue>();
            if (options.Any(option => option.Value == value))
                await ChangeValueAsync(binding.Input, value);
        }
        catch (JsonException)
        {
            // The selected display value may not be a valid filter choice.
        }
    }
}
