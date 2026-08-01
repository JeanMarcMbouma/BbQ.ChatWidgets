using BbQ.ChatWidgets.Abstractions;
using System.Text.Json;

namespace BbQ.ChatWidgets.Models;

/// <summary>
/// Identifies the validation layer that produced a diagnostic.
/// </summary>
public enum WidgetValidationStage
{
    RegisteredType,
    Schema,
    Semantic,
    RegisteredAction,
    ActionPayload
}

/// <summary>
/// Severity assigned to a widget validation diagnostic.
/// </summary>
public enum WidgetDiagnosticSeverity
{
    Information,
    Warning,
    Error
}

/// <summary>
/// Stable validation diagnostic suitable for logs and model repair feedback.
/// </summary>
public sealed record WidgetValidationDiagnostic(
    string Code,
    string Message,
    string Path,
    WidgetValidationStage Stage,
    WidgetDiagnosticSeverity Severity = WidgetDiagnosticSeverity.Error);

/// <summary>
/// Stable diagnostic identifiers emitted by the default validation pipeline.
/// </summary>
public static class WidgetValidationCodes
{
    public const string CandidateMustBeObject = "widget.candidate.object_required";
    public const string TypeRequired = "widget.type.required";
    public const string TypeNotRegistered = "widget.type.unregistered";
    public const string SchemaViolation = "widget.schema.violation";
    public const string SemanticViolation = "widget.semantic.violation";
    public const string ActionRequired = "widget.action.required";
    public const string ActionNotRegistered = "widget.action.unregistered";
    public const string ActionPayloadIncompatible = "widget.action.payload_incompatible";
    public const string EmissionArrayRequired = "widget.emission.array_required";
    public const string RepairLimitReached = "widget.repair.limit_reached";
}

/// <summary>
/// Result of validating one complete widget candidate.
/// </summary>
public sealed record WidgetValidationResult
{
    public WidgetValidationResult(IEnumerable<WidgetValidationDiagnostic>? diagnostics = null)
    {
        Diagnostics = Array.AsReadOnly((diagnostics ?? []).ToArray());
    }

    public IReadOnlyList<WidgetValidationDiagnostic> Diagnostics { get; }

    public bool IsValid => Diagnostics.All(diagnostic => diagnostic.Severity is not WidgetDiagnosticSeverity.Error);
}

/// <summary>
/// Context shared across validation stages.
/// </summary>
public sealed record WidgetValidationContext(
    IWidgetSchemaCatalogue Catalogue,
    IWidgetActionRegistry? ActionRegistry = null,
    bool RequireRegisteredActions = false);

/// <summary>
/// Contract for validating a complete, model-authored widget candidate before deserialization.
/// </summary>
public interface IWidgetValidator
{
    WidgetValidationResult Validate(JsonElement candidate, WidgetValidationContext context);
}

/// <summary>
/// Extensible semantic rule for relationships that JSON Schema cannot express conveniently.
/// </summary>
public interface IWidgetSemanticValidator
{
    IEnumerable<WidgetValidationDiagnostic> Validate(
        string widgetType,
        JsonElement candidate,
        WidgetValidationContext context);
}

/// <summary>
/// Extensible rule for checking whether a widget's interaction payload is compatible with a registered action.
/// </summary>
public interface IWidgetActionCompatibilityValidator
{
    IEnumerable<WidgetValidationDiagnostic> Validate(
        string widgetType,
        string action,
        JsonElement candidate,
        IWidgetActionMetadata actionMetadata);
}
