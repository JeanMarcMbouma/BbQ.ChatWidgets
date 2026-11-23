namespace BbQ.ChatWidgets.Reporting;

/// <summary>Resolves portable filter controls against the datasets used by a report.</summary>
public static class ReportingFilterCatalog
{
    /// <summary>Returns shared inputs with a consistent role and type across participating datasets.</summary>
    public static IReadOnlyList<ReportInput> AvailableInputs(ReportDefinition definition, IReadOnlyList<ReportDataset> catalog) =>
        definition.Tiles.Select(tile => tile.Query.Dataset)
            .Distinct(StringComparer.Ordinal)
            .SelectMany(id => catalog.FirstOrDefault(dataset => dataset.Id == id)?.Inputs ?? [])
            .GroupBy(input => input.Id, StringComparer.Ordinal)
            .Select(group => (Input: group.First(), Matches: group))
            .Where(entry => entry.Matches.All(input => input.Type == entry.Input.Type && input.Role == entry.Input.Role))
            .Select(entry => entry.Input)
            .ToArray();

    /// <summary>Returns the report's ordered controls with labels resolved against the current catalog.</summary>
    public static IReadOnlyList<ReportInput> WorkspaceInputs(ReportDefinition definition, IReadOnlyList<ReportDataset> catalog)
    {
        var inputs = AvailableInputs(definition, catalog);
        if (definition.Filters is null)
            return inputs;

        return definition.Filters.SelectMany(filter =>
        {
            var input = inputs.FirstOrDefault(item => item.Id == filter.Input && item.Role == ReportInputRole.Filter);
            return input is null ? [] : new[] { input with { Label = filter.Label ?? input.Label } };
        }).Concat(inputs.Where(input => input.Role == ReportInputRole.Parameter)).ToArray();
    }
}
