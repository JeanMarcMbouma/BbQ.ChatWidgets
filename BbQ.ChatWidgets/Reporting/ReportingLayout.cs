using System.Text.Json.Serialization;

namespace BbQ.ChatWidgets.Reporting;

/// <summary>Ordered display modes and their initial selection.</summary>
public sealed record ReportLayout(ReportMode[] Modes)
{
    /// <summary>Initial mode ID. The first mode is used when this is omitted.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? DefaultModeId { get; init; }
}

/// <summary>A named arrangement of reporting tiles.</summary>
public sealed record ReportMode(string Id, string Label, ReportPlacement[] Placements);

/// <summary>A card containing one or more tiles, optionally with selectable alternatives.</summary>
public sealed record ReportPlacement(string Id)
{
    /// <summary>Optional host-defined visual region.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Region { get; init; }

    /// <summary>Width in columns of a twelve-column grid.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? ColumnSpan { get; init; }

    /// <summary>Height in rows of the authored grid.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? RowSpan { get; init; }

    /// <summary>Stable tile IDs in display order for a card without variants.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string[]? TileIds { get; init; }

    /// <summary>Selectable alternatives that share this card.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public ReportVariant[]? Variants { get; init; }

    /// <summary>Initial variant ID. The first variant is used when this is omitted.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? DefaultVariantId { get; init; }
}

/// <summary>A named alternative set of tiles for the same card.</summary>
public sealed record ReportVariant(string Id, string Label, string[] TileIds);
