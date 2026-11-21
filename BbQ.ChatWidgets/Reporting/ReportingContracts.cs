using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace BbQ.ChatWidgets.Reporting;

/// <summary>The application-resolved tenant and user for a reporting operation.</summary>
public sealed record ReportScope(string Tenant, string User);

/// <summary>A visible result column, with opt-in editing in the render preview.</summary>
public sealed record ReportColumn(string Field, string Label, bool Editable = false);

/// <summary>A selectable metric or grouping in the catalog.</summary>
public sealed record ReportField(string Id, string Label,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] ReportColumn[]? Columns = null,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] ReportGridCapabilities? Grid = null)
{
    /// <summary>The result field that supplies dates for this grouping, or <c>label</c> when labels are dates.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? DateField { get; init; }
}

/// <summary>An authorized dataset and its available metrics and groupings.</summary>
public sealed record ReportDataset(string Id, string Label, ReportField[] Metrics, ReportField[] Dimensions);

/// <summary>A dataset query over an inclusive date range with an optional grouping.</summary>
public sealed record ReportQuery(string Dataset, string Metric, string? GroupBy, DateOnly From, DateOnly To);

/// <summary>An authorized result with a label, numeric value, and optional scalar fields.</summary>
public sealed record ReportRow(string Label, decimal Value,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] IReadOnlyDictionary<string, JsonElement>? Fields = null);

/// <summary>A query and its presentation in a report definition.</summary>
public sealed record ReportTile(string Title, string View, ReportQuery Query);

/// <summary>A rerunnable report or dashboard definition.</summary>
public sealed record ReportDefinition(string Title, string Kind, ReportTile[] Tiles);

/// <summary>A report definition and its stable identifier.</summary>
public sealed record SavedReport(string Id, ReportDefinition Definition);

/// <summary>Resolves caller scope and exposes the authorized reporting catalog and results.</summary>
public interface IReportingSource
{
    /// <summary>Resolves reporting scope from the host principal, or returns null to deny access.</summary>
    ValueTask<ReportScope?> ResolveScopeAsync(ClaimsPrincipal user, CancellationToken cancellation);

    /// <summary>Lists the datasets the caller is allowed to query.</summary>
    ValueTask<IReadOnlyList<ReportDataset>> GetDatasetsAsync(ReportScope scope, CancellationToken cancellation);

    /// <summary>Lists built-in definitions available to the caller.</summary>
    ValueTask<IReadOnlyList<SavedReport>> GetPresetsAsync(ReportScope scope, CancellationToken cancellation);

    /// <summary>Applies the scope at the data source and returns at most <paramref name="limit"/> aggregate or detail rows.</summary>
    ValueTask<IReadOnlyList<ReportRow>> RunAsync(
        ReportScope scope, ReportQuery query, int limit, CancellationToken cancellation);
}

/// <summary>Persists definitions, with each operation scoped by both the tenant and user.</summary>
public interface IReportingStore
{
    /// <summary>Lists definitions owned by this scope.</summary>
    ValueTask<IReadOnlyList<SavedReport>> ListAsync(ReportScope scope, CancellationToken cancellation);

    /// <summary>Creates a definition owned by this scope.</summary>
    ValueTask<SavedReport> CreateAsync(ReportScope scope, ReportDefinition definition, CancellationToken cancellation);

    /// <summary>Updates a definition owned by this scope, or returns false when it is unavailable.</summary>
    ValueTask<bool> UpdateAsync(ReportScope scope, string id, ReportDefinition definition, CancellationToken cancellation);

    /// <summary>Deletes a definition owned by this scope, or returns false when it is unavailable.</summary>
    ValueTask<bool> DeleteAsync(ReportScope scope, string id, CancellationToken cancellation);
}
