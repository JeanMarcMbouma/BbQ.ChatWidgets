using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Models;
using Microsoft.Extensions.AI;
using System.Text.Json;
using System.Text.Json.Nodes;

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

    /// <summary>
    /// Initializes the emission tool.
    /// </summary>
    /// <param name="catalogue">Canonical definitions allowed in tool calls.</param>
    /// <param name="onEmitted">Per-request callback that receives deserialized widget candidates.</param>
    public EmitWidgetsAIFunction(
        IWidgetSchemaCatalogue catalogue,
        Func<IReadOnlyList<ChatWidget>, CancellationToken, ValueTask> onEmitted)
    {
        ArgumentNullException.ThrowIfNull(catalogue);
        ArgumentNullException.ThrowIfNull(onEmitted);

        _onEmitted = onEmitted;
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
            throw new JsonException("The emit_widgets call must contain a 'widgets' array.");

        var element = ToJsonElement(value);
        if (element.ValueKind is not JsonValueKind.Array)
            throw new JsonException("The emit_widgets 'widgets' value must be a JSON array.");

        var widgets = new List<ChatWidget>();
        foreach (var candidate in element.EnumerateArray())
        {
            if (candidate.ValueKind is not JsonValueKind.Object)
                throw new JsonException("Every emitted widget must be a JSON object.");

            var widget = JsonSerializer.Deserialize<ChatWidget>(candidate, Serialization.Default)
                ?? throw new JsonException("An emitted widget could not be deserialized.");
            widgets.Add(widget);
        }

        var accepted = Array.AsReadOnly(widgets.ToArray());
        await _onEmitted(accepted, cancellationToken);
        return new WidgetEmissionResult(accepted.Count);
    }

    private static JsonElement ToJsonElement(object value) => value switch
    {
        JsonElement element => element,
        JsonDocument document => document.RootElement.Clone(),
        JsonNode node => JsonSerializer.SerializeToElement(node, Serialization.Default),
        _ => JsonSerializer.SerializeToElement(value, Serialization.Default)
    };
}
