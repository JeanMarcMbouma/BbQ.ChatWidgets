using System.Text.Json;

namespace BbQ.ChatWidgets.Models;

/// <summary>Settings inherited by child reporting widgets unless overridden.</summary>
public sealed record ReportingSettings(
    string? DataSource = null,
    string? CategoryField = null,
    string? ValueField = null,
    string? XField = null,
    string? DateField = null,
    string? GroupBy = null,
    IReadOnlyList<ReportingColumn>? Columns = null);

/// <summary>A named reporting field with optional grid editing.</summary>
public sealed record ReportingColumn(string Field, string Label, bool Editable = false);

/// <summary>Authors a reporting tile or a dashboard of nested reporting widgets.</summary>
public sealed record ReportingWidget(
    string Label,
    string Action,
    string Kind,
    ReportingSettings? Settings = null,
    IReadOnlyDictionary<string, IReadOnlyList<IReadOnlyDictionary<string, JsonElement>>>? Sources = null,
    IReadOnlyList<IReadOnlyDictionary<string, JsonElement>>? Rows = null,
    IReadOnlyList<ReportingWidget>? Children = null,
    string? FilterField = null,
    int? PageSize = null,
    string? Error = null) : ChatWidget(Label, Action)
{
    /// <inheritdoc/>
    public override string Purpose => """
        Display authorized report data as a bar, line, pie, timeline, scatter, waterfall,
        Pareto chart, histogram, table, grid, or metric.
        Use kind time-line, area, step, or time-column for numeric values against ISO dates in dateField.
        Use kind dashboard to host children and share named sources, fields, grouping, and columns.
        A filter child filters its source for the other tiles in the same dashboard.
        Provide only data already authorized for the current viewer.
        """;
}
