using System.Text.Json;
using BbQ.ChatWidgets.Abstractions;

namespace BbQ.ChatWidgets.Models;

/// <summary>
/// Identifies the validation layer that produced a diagnostic.
/// </summary>
public enum WidgetValidationStage
{
    /// <summary>Checks that the discriminator identifies a registered widget.</summary>
    RegisteredType,
    /// <summary>Checks the candidate against its canonical JSON Schema.</summary>
    Schema,
    /// <summary>Checks relationships not conveniently expressible in JSON Schema.</summary>
    Semantic,
    /// <summary>Checks that an action is registered when required.</summary>
    RegisteredAction,
    /// <summary>Checks compatibility between widget state and action payload.</summary>
    ActionPayload
}

/// <summary>
/// Severity assigned to a widget validation diagnostic.
/// </summary>
public enum WidgetDiagnosticSeverity
{
    /// <summary>Informational diagnostic that does not invalidate the candidate.</summary>
    Information,
    /// <summary>Warning diagnostic that does not invalidate the candidate.</summary>
    Warning,
    /// <summary>Error diagnostic that invalidates the candidate.</summary>
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
    /// <summary>The candidate was not a JSON object.</summary>
    public const string CandidateMustBeObject = "widget.candidate.object_required";
    /// <summary>The widget type discriminator was absent or empty.</summary>
    public const string TypeRequired = "widget.type.required";
    /// <summary>The widget type discriminator was not registered.</summary>
    public const string TypeNotRegistered = "widget.type.unregistered";
    /// <summary>The candidate did not satisfy its canonical schema.</summary>
    public const string SchemaViolation = "widget.schema.violation";
    /// <summary>A semantic widget invariant was violated.</summary>
    public const string SemanticViolation = "widget.semantic.violation";
    /// <summary>An interactive widget omitted its action identifier.</summary>
    public const string ActionRequired = "widget.action.required";
    /// <summary>The widget referenced an unregistered action.</summary>
    public const string ActionNotRegistered = "widget.action.unregistered";
    /// <summary>The widget state was incompatible with the registered action payload.</summary>
    public const string ActionPayloadIncompatible = "widget.action.payload_incompatible";
    /// <summary>The emission tool input was not an array.</summary>
    public const string EmissionArrayRequired = "widget.emission.array_required";
    /// <summary>The bounded repair attempt was exhausted.</summary>
    public const string RepairLimitReached = "widget.repair.limit_reached";
}

/// <summary>
/// Result of validating one complete widget candidate.
/// </summary>
public sealed record WidgetValidationResult
{
    /// <summary>Initializes a validation result from zero or more diagnostics.</summary>
    /// <param name="diagnostics">Diagnostics produced by validation stages.</param>
    public WidgetValidationResult(IEnumerable<WidgetValidationDiagnostic>? diagnostics = null)
    {
        Diagnostics = Array.AsReadOnly((diagnostics ?? []).ToArray());
    }

    /// <summary>Gets the immutable validation diagnostics.</summary>
    public IReadOnlyList<WidgetValidationDiagnostic> Diagnostics { get; }

    /// <summary>Gets whether no error-severity diagnostics were produced.</summary>
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
    /// <summary>Validates a complete model-authored widget candidate.</summary>
    /// <param name="candidate">Complete candidate JSON.</param>
    /// <param name="context">Registered schemas, actions, and validation policy.</param>
    /// <returns>The accumulated diagnostics.</returns>
    WidgetValidationResult Validate(JsonElement candidate, WidgetValidationContext context);
}

/// <summary>
/// Extensible semantic rule for relationships that JSON Schema cannot express conveniently.
/// </summary>
public interface IWidgetSemanticValidator
{
    /// <summary>Evaluates semantic invariants for a registered widget type.</summary>
    /// <param name="widgetType">Registered widget discriminator.</param>
    /// <param name="candidate">Complete candidate JSON.</param>
    /// <param name="context">Shared validation context.</param>
    /// <returns>Semantic diagnostics.</returns>
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
    /// <summary>Evaluates whether widget state is compatible with a registered action.</summary>
    /// <param name="widgetType">Registered widget discriminator.</param>
    /// <param name="action">Registered action identifier.</param>
    /// <param name="candidate">Complete candidate JSON.</param>
    /// <param name="actionMetadata">Registered action metadata.</param>
    /// <returns>Compatibility diagnostics.</returns>
    IEnumerable<WidgetValidationDiagnostic> Validate(
        string widgetType,
        string action,
        JsonElement candidate,
        IWidgetActionMetadata actionMetadata);
}
