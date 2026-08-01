using BbQ.ChatWidgets.Models;
using Json.Schema;
using System.Collections.Concurrent;
using System.Text.Json;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// Default layered validator for model-authored widget candidates.
/// </summary>
public sealed class DefaultWidgetValidator(
    IEnumerable<IWidgetSemanticValidator>? semanticValidators = null,
    IEnumerable<IWidgetActionCompatibilityValidator>? actionCompatibilityValidators = null) : IWidgetValidator
{
    private readonly IReadOnlyList<IWidgetSemanticValidator> _semanticValidators =
        (semanticValidators ?? [new BuiltInWidgetSemanticValidator()]).ToArray();
    private readonly IReadOnlyList<IWidgetActionCompatibilityValidator> _actionCompatibilityValidators =
        (actionCompatibilityValidators ?? []).ToArray();
    private readonly ConcurrentDictionary<(string Type, string Version), JsonSchema> _schemas = new();

    /// <inheritdoc />
    public WidgetValidationResult Validate(JsonElement candidate, WidgetValidationContext context)
    {
        ArgumentNullException.ThrowIfNull(context);
        var diagnostics = new List<WidgetValidationDiagnostic>();

        if (candidate.ValueKind is not JsonValueKind.Object)
        {
            diagnostics.Add(new(
                WidgetValidationCodes.CandidateMustBeObject,
                "A widget candidate must be a JSON object.",
                string.Empty,
                WidgetValidationStage.RegisteredType));
            return new WidgetValidationResult(diagnostics);
        }

        if (!candidate.TryGetProperty("type", out var typeElement) ||
            typeElement.ValueKind is not JsonValueKind.String ||
            string.IsNullOrWhiteSpace(typeElement.GetString()))
        {
            diagnostics.Add(new(
                WidgetValidationCodes.TypeRequired,
                "A non-empty widget type discriminator is required.",
                "/type",
                WidgetValidationStage.RegisteredType));
            return new WidgetValidationResult(diagnostics);
        }

        var widgetType = typeElement.GetString()!;
        if (!context.Catalogue.TryGetDefinition(widgetType, out var definition))
        {
            diagnostics.Add(new(
                WidgetValidationCodes.TypeNotRegistered,
                $"Widget type '{widgetType}' is not registered.",
                "/type",
                WidgetValidationStage.RegisteredType));
            return new WidgetValidationResult(diagnostics);
        }

        ValidateSchema(candidate, definition, diagnostics);
        foreach (var validator in _semanticValidators)
            diagnostics.AddRange(validator.Validate(widgetType, candidate, context));
        ValidateAction(candidate, widgetType, context, diagnostics);

        return new WidgetValidationResult(diagnostics);
    }

    private void ValidateSchema(
        JsonElement candidate,
        WidgetDefinition definition,
        ICollection<WidgetValidationDiagnostic> diagnostics)
    {
        var schema = _schemas.GetOrAdd(
            (definition.Type, definition.SchemaVersion),
            _ => JsonSchema.Build(
                definition.Schema,
                new BuildOptions
                {
                    Dialect = Dialect.Draft202012,
                    SchemaRegistry = new()
                }));
        var result = schema.Evaluate(candidate, new EvaluationOptions
        {
            OutputFormat = OutputFormat.List,
            RequireFormatValidation = true
        });
        if (result.IsValid)
            return;

        AddSchemaDiagnostics(result, diagnostics);
        if (!diagnostics.Any(diagnostic => diagnostic.Stage is WidgetValidationStage.Schema))
        {
            diagnostics.Add(new(
                WidgetValidationCodes.SchemaViolation,
                "The widget does not satisfy its registered JSON Schema.",
                string.Empty,
                WidgetValidationStage.Schema));
        }
    }

    private static void AddSchemaDiagnostics(
        EvaluationResults result,
        ICollection<WidgetValidationDiagnostic> diagnostics)
    {
        if (result.Errors is { Count: > 0 })
        {
            foreach (var error in result.Errors)
            {
                diagnostics.Add(new(
                    $"{WidgetValidationCodes.SchemaViolation}.{error.Key}",
                    error.Value,
                    result.InstanceLocation.ToString(),
                    WidgetValidationStage.Schema));
            }
        }

        if (result.Details is null)
            return;
        foreach (var detail in result.Details)
            AddSchemaDiagnostics(detail, diagnostics);
    }

    private void ValidateAction(
        JsonElement candidate,
        string widgetType,
        WidgetValidationContext context,
        ICollection<WidgetValidationDiagnostic> diagnostics)
    {
        if (!candidate.TryGetProperty("action", out var actionElement) ||
            actionElement.ValueKind is not JsonValueKind.String ||
            string.IsNullOrWhiteSpace(actionElement.GetString()))
        {
            if (context.RequireRegisteredActions)
            {
                diagnostics.Add(new(
                    WidgetValidationCodes.ActionRequired,
                    "A non-empty registered action is required.",
                    "/action",
                    WidgetValidationStage.RegisteredAction));
            }
            return;
        }

        if (!context.RequireRegisteredActions)
            return;

        var action = actionElement.GetString()!;
        var metadata = context.ActionRegistry?.GetAction(action);
        if (metadata is null)
        {
            diagnostics.Add(new(
                WidgetValidationCodes.ActionNotRegistered,
                $"Widget action '{action}' is not registered.",
                "/action",
                WidgetValidationStage.RegisteredAction));
            return;
        }

        foreach (var validator in _actionCompatibilityValidators)
            diagnostics.AddRange(validator.Validate(widgetType, action, candidate, metadata));
    }
}
