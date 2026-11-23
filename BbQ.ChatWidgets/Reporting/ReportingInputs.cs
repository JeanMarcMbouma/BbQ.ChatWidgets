using System.Text.Json;
using System.Text.Json.Serialization;

namespace BbQ.ChatWidgets.Reporting;

/// <summary>Describes whether a query input restricts rows or controls report execution or display.</summary>
[JsonConverter(typeof(JsonStringEnumConverter<ReportInputRole>))]
public enum ReportInputRole
{
    /// <summary>A restriction on matching data.</summary>
    Filter,
    /// <summary>An execution or display choice.</summary>
    Parameter
}

/// <summary>Supported scalar types for a single-choice input.</summary>
[JsonConverter(typeof(JsonStringEnumConverter<ReportInputType>))]
public enum ReportInputType
{
    /// <summary>A non-empty string of up to 160 characters.</summary>
    Text = 1,
    /// <summary>A whole number within JavaScript's safe integer range.</summary>
    Integer,
    /// <summary>A Boolean flag.</summary>
    Boolean
}

/// <summary>The strongly typed scalar value used by a reporting input.</summary>
[JsonConverter(typeof(ReportInputValueConverter))]
public readonly record struct ReportInputValue
{
    internal const int TextLimit = 160;
    internal const long IntegerLimit = 9_007_199_254_740_991;

    private ReportInputValue(ReportInputType type, string? text = null, long? integer = null, bool? boolean = null)
    {
        Type = type;
        Text = text;
        Integer = integer;
        Boolean = boolean;
    }

    /// <summary>The scalar type.</summary>
    public ReportInputType Type { get; }

    /// <summary>The text value, when applicable.</summary>
    public string? Text { get; }

    /// <summary>The integer value, when applicable.</summary>
    public long? Integer { get; }

    /// <summary>The Boolean value, when applicable.</summary>
    public bool? Boolean { get; }

    /// <summary>Creates an exact text value.</summary>
    public static ReportInputValue FromText(string value)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length > TextLimit)
            throw new ArgumentException("Choose a non-empty value of up to 160 characters.", nameof(value));

        return new(ReportInputType.Text, text: value);
    }

    /// <summary>Creates a safe integer value.</summary>
    public static ReportInputValue FromInteger(long value)
    {
        if (value is < -IntegerLimit or > IntegerLimit)
            throw new ArgumentOutOfRangeException(nameof(value));

        return new(ReportInputType.Integer, integer: value);
    }

    /// <summary>Creates a Boolean value.</summary>
    public static ReportInputValue FromBoolean(bool value) => new(ReportInputType.Boolean, boolean: value);
}

/// <summary>Reads and writes reporting input values as JSON scalars.</summary>
public sealed class ReportInputValueConverter : JsonConverter<ReportInputValue>
{
    /// <inheritdoc />
    public override ReportInputValue Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        return reader.TokenType switch
        {
            JsonTokenType.String when reader.GetString() is { } text &&
                !string.IsNullOrWhiteSpace(text) && text.Length <= ReportInputValue.TextLimit
                => ReportInputValue.FromText(text),
            JsonTokenType.Number when reader.TryGetInt64(out var number) &&
                number is >= -ReportInputValue.IntegerLimit and <= ReportInputValue.IntegerLimit
                => ReportInputValue.FromInteger(number),
            JsonTokenType.True => ReportInputValue.FromBoolean(true),
            JsonTokenType.False => ReportInputValue.FromBoolean(false),
            _ => throw new JsonException("Choose a non-empty string, a safe integer, or a Boolean input value.")
        };
    }

    /// <inheritdoc />
    public override void Write(Utf8JsonWriter writer, ReportInputValue value, JsonSerializerOptions options)
    {
        switch (value.Type)
        {
            case ReportInputType.Text: writer.WriteStringValue(value.Text); break;
            case ReportInputType.Integer: writer.WriteNumberValue(value.Integer!.Value); break;
            case ReportInputType.Boolean: writer.WriteBooleanValue(value.Boolean!.Value); break;
            default: throw new JsonException("The reporting input value is uninitialized.");
        }
    }
}

/// <summary>An advertised input choice and its display label.</summary>
public sealed record ReportInputOption(ReportInputValue Value, string Label);

/// <summary>A dataset's typed single-choice filter or parameter.</summary>
public sealed record ReportInput(string Id, string Label, ReportInputRole Role, ReportInputType Type)
{
    /// <summary>Fixed choices, or null to resolve choices through <see cref="IReportingInputSource"/>.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public ReportInputOption[]? Options { get; init; }

    /// <summary>The effective value when the selection is absent.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public ReportInputValue? DefaultValue { get; init; }
}

/// <summary>A single selection for an advertised input.</summary>
public sealed record ReportInputSelection(string Id, ReportInputValue Value);

/// <summary>Dataset-specific date constraints and optional date picker labels.</summary>
public sealed record ReportCalendar(int MaxDays = 366)
{
    /// <summary>An optional label for the calendar, such as the data source's time zone.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Label { get; init; }

    /// <summary>The source's current calendar date, for relative date presets.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public DateOnly? Today { get; init; }
}

/// <summary>Requests choices for an input in the inclusive report period.</summary>
public sealed record ReportInputOptionsRequest(string Dataset, string Input, DateOnly From, DateOnly To);

/// <summary>Optional scoped choice resolution for datasets with dynamic inputs.</summary>
public interface IReportingInputSource : IReportingSource
{
    /// <summary>Returns the available choices in the caller's scope, up to the supplied limit.</summary>
    ValueTask<IReadOnlyList<ReportInputOption>> GetInputOptionsAsync(ReportScope scope,
        ReportInputOptionsRequest request, int limit, CancellationToken cancellationToken);
}

/// <summary>Optional direct availability check for a choice without enumerating the option list.</summary>
public interface IReportingInputValidationSource : IReportingInputSource
{
    /// <summary>Checks whether the exact choice is available for the request and caller.</summary>
    ValueTask<bool> IsInputValueAvailableAsync(ReportScope scope, ReportInputOptionsRequest request,
        ReportInputValue value, CancellationToken cancellationToken);
}
