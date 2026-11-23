using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Reporting;

public static partial class ReportingEndpoints
{
    private static string? TileBindingsError(ReportTile tile, ReportDataset dataset)
    {
        if (tile.Presentation is null && tile.InputBinding is null)
            return null;

        var metric = dataset.Metrics.First(field => field.Id == tile.Query.Metric);
        var dimension = dataset.Dimensions.FirstOrDefault(field => field.Id == tile.Query.GroupBy);
        var fields = new HashSet<string>(["label", "value", "x", "date"], StringComparer.Ordinal);
        if (metric.Columns is { } metricColumns)
            fields.UnionWith(metricColumns.Select(column => column.Field));
        if (dimension?.Columns is { } dimensionColumns)
            fields.UnionWith(dimensionColumns.Select(column => column.Field));

        bool ValidField(string? field) => field is { Length: > 0 and <= 100 } && fields.Contains(field);
        bool OptionalField(string? field) => field is null || ValidField(field);

        if (tile.InputBinding is { } binding &&
            (!ValidInputId(binding.Input) || !ValidField(binding.Field) ||
             !DatasetInputs(dataset).Any(input => input.Id == binding.Input && input.Role == ReportInputRole.Filter)))
            return "Choose an advertised filter input and an available result field for activation.";

        if (tile.Presentation is not { } presentation)
            return null;

        if (!OptionalField(presentation.CategoryField) || !OptionalField(presentation.ValueField) ||
            !OptionalField(presentation.XField) || !OptionalField(presentation.DateField) ||
            !OptionalField(presentation.SeriesField) || !OptionalField(presentation.SizeField))
            return "Choose available result fields for the chart.";

        var dateAxis = tile.View is "time-line" or "area" or "step" or "time-column";
        if (presentation.DateAxisLabel is { } label && (!dateAxis || !ValidTitle(label)))
            return "Choose a valid date-axis label for a time-series chart.";

        if ((presentation.SeriesField is not null || presentation.Series is not null) &&
            (tile.View is not ("bar" or "time-column") ||
             (presentation.SeriesField is not null && presentation.Series is not null)))
            return "Choose one series binding for a bar or time-column chart.";

        if (presentation.Series is { } series && (series.Length is < 1 or > 8 ||
            series.Any(item => item is null || !ValidField(item.Field) || !ValidTitle(item.Label)) ||
            series.Select(item => item.Field).Distinct(StringComparer.Ordinal).Count() != series.Length))
            return "Choose up to eight distinct chart series with available result fields.";

        if ((presentation.SizeField is not null && tile.View != "scatter") ||
            (presentation.PieHole is double hole && (tile.View != "pie" || !double.IsFinite(hole) || hole is < .2 or > .8)) ||
            (presentation.BinWidth is double width && (tile.View != "histogram" || !double.IsFinite(width) || width <= 0 ||
                presentation.XField is null)))
            return "Choose display settings supported by the chart.";

        if (presentation.ReferenceLines is { } lines && (lines.Length > 4 ||
            lines.Any(line => line is null || !ValidTitle(line.Label) ||
                (line.Value is double value ? !double.IsFinite(value) || line.Field is not null : !ValidField(line.Field)) ||
                (line.Axis switch
                {
                    ReportingAxis.X => tile.View is not ("scatter" or "bar") &&
                        (tile.View != "histogram" || presentation.BinWidth is null),
                    ReportingAxis.Y => !dateAxis && tile.View != "scatter" &&
                        (tile.View != "histogram" || presentation.BinWidth is null),
                    _ => true
                }))))
            return "Choose up to four valid reference lines on quantitative axes.";

        return null;
    }
}
