using System.Text.Json;
using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// Validates cross-property invariants for built-in widgets.
/// </summary>
public sealed class BuiltInWidgetSemanticValidator : IWidgetSemanticValidator
{
    /// <inheritdoc />
    public IEnumerable<WidgetValidationDiagnostic> Validate(
        string widgetType,
        JsonElement candidate,
        WidgetValidationContext context)
    {
        switch (widgetType)
        {
            case "slider":
                foreach (var diagnostic in ValidateSlider(candidate))
                    yield return diagnostic;
                break;

            case "progressbar":
                foreach (var diagnostic in ValidateProgress(candidate))
                    yield return diagnostic;
                break;

            case "input":
            case "textarea":
                if (TryGetInt32(candidate, "maxLength", out var maxLength) && maxLength <= 0)
                    yield return Error("maxLength must be greater than zero.", "/maxLength");
                if (widgetType == "textarea" && TryGetInt32(candidate, "rows", out var rows) && rows <= 0)
                    yield return Error("rows must be greater than zero.", "/rows");
                break;

            case "dropdown":
            case "multiselect":
                if (candidate.TryGetProperty("options", out var options) && options.ValueKind == JsonValueKind.Array)
                {
                    var values = options.EnumerateArray()
                        .Where(item => item.ValueKind == JsonValueKind.String)
                        .Select(item => item.GetString()!)
                        .ToArray();
                    if (values.Length == 0)
                        yield return Error("options must contain at least one value.", "/options");
                    if (values.Distinct(StringComparer.Ordinal).Count() != values.Length)
                        yield return Error("options must not contain duplicate values.", "/options");
                }
                break;

            case "datepicker":
                if (TryGetDate(candidate, "minDate", out var minDate) &&
                    TryGetDate(candidate, "maxDate", out var maxDate) &&
                    minDate > maxDate)
                {
                    yield return Error("minDate must be earlier than or equal to maxDate.", "/minDate");
                }
                break;
        }
    }

    private static IEnumerable<WidgetValidationDiagnostic> ValidateSlider(JsonElement candidate)
    {
        if (!TryGetInt32(candidate, "min", out var min) || !TryGetInt32(candidate, "max", out var max))
            yield break;

        if (min >= max)
            yield return Error("min must be less than max.", "/min");
        if (TryGetInt32(candidate, "step", out var step) && step <= 0)
            yield return Error("step must be greater than zero.", "/step");
        if (TryGetInt32(candidate, "default", out var defaultValue) && (defaultValue < min || defaultValue > max))
            yield return Error("default must be within the inclusive min/max range.", "/default");
    }

    private static IEnumerable<WidgetValidationDiagnostic> ValidateProgress(JsonElement candidate)
    {
        if (!TryGetInt32(candidate, "value", out var value) || !TryGetInt32(candidate, "max", out var max))
            yield break;

        if (max <= 0)
            yield return Error("max must be greater than zero.", "/max");
        if (value < 0 || value > max)
            yield return Error("value must be within the inclusive zero/max range.", "/value");
    }

    private static bool TryGetInt32(JsonElement candidate, string property, out int value)
    {
        value = default;
        return candidate.TryGetProperty(property, out var element) &&
               element.ValueKind == JsonValueKind.Number &&
               element.TryGetInt32(out value);
    }

    private static bool TryGetDate(JsonElement candidate, string property, out DateOnly value)
    {
        value = default;
        return candidate.TryGetProperty(property, out var element) &&
               element.ValueKind == JsonValueKind.String &&
               DateOnly.TryParse(element.GetString(), out value);
    }

    private static WidgetValidationDiagnostic Error(string message, string path) =>
        new(
            WidgetValidationCodes.SemanticViolation,
            message,
            path,
            WidgetValidationStage.Semantic);
}
