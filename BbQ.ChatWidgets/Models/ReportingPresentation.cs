using System.Text.Json.Serialization;

namespace BbQ.ChatWidgets.Models;

/// <summary>An authored numeric series and its legend label.</summary>
public sealed record ReportingSeries(string Field, string Label);

/// <summary>A color keyed by series field or category value.</summary>
public sealed record ReportingColor(string Key, string Color)
{
    /// <summary>Optional color for hosts using a dark color scheme.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? DarkColor { get; init; }
}

/// <summary>The quantitative axis of a chart reference line.</summary>
[JsonConverter(typeof(JsonStringEnumConverter<ReportingAxis>))]
public enum ReportingAxis
{
    /// <summary>The horizontal axis.</summary>
    X,
    /// <summary>The vertical axis.</summary>
    Y
}

/// <summary>A labeled reference line at a fixed coordinate or a constant numeric field in the result.</summary>
public sealed record ReportingReferenceLine(ReportingAxis Axis, string Label)
{
    /// <summary>The coordinate, when the line does not use a field.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? Value { get; init; }

    /// <summary>A numeric result field with the same value across the plotted rows.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Field { get; init; }
}

/// <summary>Optional data bindings and settings for the library's reporting renderer.</summary>
public sealed record ReportingPresentation
{
    /// <summary>Field used for category labels.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? CategoryField { get; init; }

    /// <summary>Numeric field used for the primary plotted value.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ValueField { get; init; }

    /// <summary>Field used for scatter X coordinates or the lower edge of pre-aggregated bins.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? XField { get; init; }

    /// <summary>Field used for date coordinates.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? DateField { get; init; }

    /// <summary>Optional caption replacing the default UTC caption on date axes.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? DateAxisLabel { get; init; }

    /// <summary>Categorical series field for a bar or time-column chart.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? SeriesField { get; init; }

    /// <summary>Explicit value series for a bar or time-column chart.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public ReportingSeries[]? Series { get; init; }

    /// <summary>Nonnegative numeric field used to scale the area of scatter points.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? SizeField { get; init; }

    /// <summary>Optional hole radius as a fraction of the pie radius.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? PieHole { get; init; }

    /// <summary>Positive width of an input bin for a histogram with pre-aggregated counts.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public double? BinWidth { get; init; }

    /// <summary>Optional guide lines on quantitative axes.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public ReportingReferenceLine[]? ReferenceLines { get; init; }

    /// <summary>Optional colors keyed by series field or category value.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public ReportingColor[]? Colors { get; init; }
}
