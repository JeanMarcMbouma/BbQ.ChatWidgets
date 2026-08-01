using System.Text.Json;
using System.Text.Json.Nodes;
using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Models;
using Microsoft.Extensions.AI;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// Invocable model tool that accepts complete widget states constrained by the
/// canonical widget schema catalogue.
/// </summary>
public sealed class EmitWidgetsAIFunction : AIFunction
{
    /// <summary>
    /// The stable function name exposed to model providers.
    /// </summary>
    public const string FunctionName = "emit_widgets";

    private readonly Func<IReadOnlyList<ChatWidget>, CancellationToken, ValueTask> _onEmitted;
    private readonly IWidgetValidator _validator;
    private readonly WidgetValidationContext _validationContext;
    private int _invalidEmissionCount;

    /// <summary>
    /// Initializes the emission tool.
    /// </summary>
    /// <param name="catalogue">Canonical definitions allowed in tool calls.</param>
    /// <param name="onEmitted">Per-request callback that receives deserialized widget candidates.</param>
    /// <param name="validator">Optional validator; the default validation pipeline is used when omitted.</param>
    /// <param name="validationContext">Optional validation context; one based on <paramref name="catalogue"/> is used when omitted.</param>
    public EmitWidgetsAIFunction(
        IWidgetSchemaCatalogue catalogue,
        Func<IReadOnlyList<ChatWidget>, CancellationToken, ValueTask> onEmitted,
        IWidgetValidator? validator = null,
        WidgetValidationContext? validationContext = null)
    {
        ArgumentNullException.ThrowIfNull(catalogue);
        ArgumentNullException.ThrowIfNull(onEmitted);

        _onEmitted = onEmitted;
        _validator = validator ?? new DefaultWidgetValidator();
        _validationContext = validationContext ?? new WidgetValidationContext(catalogue);
        JsonSchema = WidgetEmissionSchemaBuilder.Build(catalogue);
    }

    /// <inheritdoc />
    public override string Name => FunctionName;

    /// <inheritdoc />
    public override string Description =>
        "Emit one or more complete interactive widget states using only registered widget types and actions.";

    /// <inheritdoc />
    public override JsonElement JsonSchema { get; }

    /// <inheritdoc />
    public override IReadOnlyDictionary<string, object?> AdditionalProperties { get; } =
        new Dictionary<string, object?> { ["strict"] = true };

    /// <inheritdoc />
    protected override async ValueTask<object?> InvokeCoreAsync(
        AIFunctionArguments arguments,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(arguments);

        if (!arguments.TryGetValue("widgets", out var value) || value is null)
        {
            return Reject([
                new WidgetValidationDiagnostic(
                    WidgetValidationCodes.EmissionArrayRequired,
                    "The emit_widgets call must contain a 'widgets' array.",
                    "/widgets",
                    WidgetValidationStage.Schema)
            ]);
        }

        var element = ToJsonElement(value);
        if (element.ValueKind is not JsonValueKind.Array)
        {
            return Reject([
                new WidgetValidationDiagnostic(
                    WidgetValidationCodes.EmissionArrayRequired,
                    "The emit_widgets 'widgets' value must be a JSON array.",
                    "/widgets",
                    WidgetValidationStage.Schema)
            ]);
        }

        var diagnostics = new List<WidgetValidationDiagnostic>();
        var candidates = element.EnumerateArray().Select(candidate => candidate.Clone()).ToArray();
        if (candidates.Length == 0 && _validationContext.Catalogue.Definitions.Count > 0)
        {
            return Reject([
                new WidgetValidationDiagnostic(
                    WidgetValidationCodes.SchemaViolation,
                    "At least one widget must be emitted when the catalogue is not empty.",
                    "/widgets",
                    WidgetValidationStage.Schema)
            ]);
        }

        for (var index = 0; index < candidates.Length; index++)
        {
            var result = _validator.Validate(candidates[index], _validationContext);
            diagnostics.AddRange(result.Diagnostics.Select(diagnostic => diagnostic with
            {
                Path = $"/widgets/{index}{diagnostic.Path}"
            }));
        }

        if (diagnostics.Any(diagnostic => diagnostic.Severity is WidgetDiagnosticSeverity.Error))
            return Reject(diagnostics);

        // Only validated candidates may cross the deserialization boundary.
        var widgets = new List<ChatWidget>();
        foreach (var candidate in candidates)
        {
            var widget = JsonSerializer.Deserialize<ChatWidget>(candidate, Serialization.Default)
                ?? throw new JsonException("An emitted widget could not be deserialized.");
            widgets.Add(widget);
        }

        var accepted = Array.AsReadOnly(widgets.ToArray());
        await _onEmitted(accepted, cancellationToken);
        return new WidgetEmissionResult(accepted.Count);
    }

    private WidgetEmissionResult Reject(IEnumerable<WidgetValidationDiagnostic> diagnostics)
    {
        var diagnosticList = diagnostics.ToList();
        var invalidAttempt = Interlocked.Increment(ref _invalidEmissionCount);
        var repairAllowed = invalidAttempt == 1;
        if (!repairAllowed)
        {
            diagnosticList.Add(new(
                WidgetValidationCodes.RepairLimitReached,
                "The single widget repair attempt has been exhausted.",
                "/widgets",
                WidgetValidationStage.Schema));
        }

        return new WidgetEmissionResult(
            0,
            Array.AsReadOnly(diagnosticList.ToArray()),
            repairAllowed);
    }

    private static JsonElement ToJsonElement(object value) => value switch
    {
        JsonElement element => element,
        JsonDocument document => document.RootElement.Clone(),
        JsonNode node => JsonSerializer.SerializeToElement(node, Serialization.Default),
        _ => JsonSerializer.SerializeToElement(value, Serialization.Default)
    };
}
