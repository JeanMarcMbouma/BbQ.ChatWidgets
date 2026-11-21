using System.Text.Json;
using BbQ.ChatWidgets.Reporting;

namespace BbQ.ChatWidgets.Blazor.Reporting;

/// <summary>A report interaction together with the name and tile selected by the host.</summary>
public sealed record ReportingWorkspaceAction(string ActionName, ReportTile Tile, int TileIndex, ReportingInteraction Payload);

/// <summary>Data for an actionable report interaction.</summary>
public abstract record ReportingInteraction
{
    internal static ReportingInteraction? FromSnapshot(JsonElement payload)
    {
        if (payload.ValueKind != JsonValueKind.Object || !payload.TryGetProperty("kind", out var kind) ||
            kind.ValueKind != JsonValueKind.String)
            return null;

        try
        {
            return kind.GetString() switch
            {
                "select" => payload.Deserialize<ReportingSelection>(JsonSerializerOptions),
                "activate" => payload.Deserialize<ReportingSnapshotRowActivation>(JsonSerializerOptions),
                "filter" => payload.Deserialize<ReportingFilterChange>(JsonSerializerOptions),
                "edit" => payload.Deserialize<ReportingCellEdit>(JsonSerializerOptions),
                _ => null
            };
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static readonly JsonSerializerOptions JsonSerializerOptions = new(JsonSerializerDefaults.Web);
}

/// <summary>A chart point or a snapshot-grid selection.</summary>
public sealed record ReportingSelection(string? Source, int[] RowIndices,
    IReadOnlyDictionary<string, JsonElement>? Row, ReportingGroupSelection? Group) : ReportingInteraction;

/// <summary>The grouping field and value of an aggregated chart mark.</summary>
public sealed record ReportingGroupSelection(string Field, JsonElement Value);

/// <summary>Activation of a table or grid snapshot row. Its index is relative to the source snapshot.</summary>
public sealed record ReportingSnapshotRowActivation(string? Source, int RowIndex,
    IReadOnlyDictionary<string, JsonElement> Row) : ReportingInteraction;

/// <summary>Activation of a server-paged grid row identified by its stable key.</summary>
public sealed record ReportingGridRowActivation(string RowKey, ReportRow Row) : ReportingInteraction;

/// <summary>A changed snapshot filter.</summary>
public sealed record ReportingFilterChange(string? Source, string Field, JsonElement Value, bool Active) : ReportingInteraction;

/// <summary>A proposed edit to a cell in a snapshot.</summary>
public sealed record ReportingCellEdit(string? Source, int RowIndex, string Field, JsonElement Value) : ReportingInteraction;
