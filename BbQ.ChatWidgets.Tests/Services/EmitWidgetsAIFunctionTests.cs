using System.Text.Json;
using BbQ.ChatWidgets.Agents;
using BbQ.ChatWidgets.Agents.Abstractions;
using BbQ.ChatWidgets.Models;
using Microsoft.Extensions.AI;
using Xunit;

namespace BbQ.ChatWidgets.Tests.Services;

public sealed class EmitWidgetsAIFunctionTests
{
    [Fact]
    public void JsonSchema_UsesDiscriminatedUnionOfCanonicalDefinitions()
    {
        var catalogue = new WidgetSchemaCatalogue(new WidgetRegistry());
        var function = CreateFunction(catalogue);

        var schema = function.JsonSchema;
        Assert.False(schema.GetProperty("additionalProperties").GetBoolean());
        Assert.Contains(
            schema.GetProperty("required").EnumerateArray(),
            item => item.GetString() == "widgets");

        var branches = schema
            .GetProperty("properties")
            .GetProperty("widgets")
            .GetProperty("items")
            .GetProperty("oneOf");

        Assert.Equal(catalogue.Definitions.Count, branches.GetArrayLength());
        Assert.All(branches.EnumerateArray(), branch =>
        {
            Assert.False(branch.GetProperty("additionalProperties").GetBoolean());
            var properties = branch.GetProperty("properties");
            Assert.Equal(properties.EnumerateObject().Count(), branch.GetProperty("required").GetArrayLength());
            Assert.True(properties.GetProperty("type").TryGetProperty("const", out _));
            Assert.False(branch.TryGetProperty("$id", out _));
            Assert.False(branch.TryGetProperty("$schema", out _));
        });
    }

    [Fact]
    public void JsonSchema_ReflectsCustomDefinition()
    {
        var registry = new WidgetRegistry();
        registry.Register(new RatingWidget("Rate", "rate", 5), "rating_scale");
        var function = CreateFunction(new WidgetSchemaCatalogue(registry));

        var branches = function.JsonSchema
            .GetProperty("properties")
            .GetProperty("widgets")
            .GetProperty("items")
            .GetProperty("oneOf");

        Assert.Contains(
            branches.EnumerateArray(),
            branch => branch.GetProperty("properties").GetProperty("type").GetProperty("const").GetString() == "rating_scale");
    }

    [Fact]
    public void JsonSchema_EmptyCatalogueRejectsAllWidgetItems()
    {
        var function = CreateFunction(new WidgetSchemaCatalogue([]));

        var widgets = function.JsonSchema.GetProperty("properties").GetProperty("widgets");

        Assert.Equal(JsonValueKind.False, widgets.GetProperty("items").ValueKind);
        Assert.Equal(0, widgets.GetProperty("minItems").GetInt32());
        Assert.Equal(0, widgets.GetProperty("maxItems").GetInt32());
    }

    [Fact]
    public void Function_RequestsProviderStrictMode()
    {
        var function = CreateFunction(new WidgetSchemaCatalogue(new WidgetRegistry()));

        Assert.True(Assert.IsType<bool>(function.AdditionalProperties["strict"]));
    }

    [Fact]
    public async Task InvokeAsync_EmitsDeserializedRegisteredWidgets()
    {
        IReadOnlyList<ChatWidget>? emitted = null;
        var function = new EmitWidgetsAIFunction(
            new WidgetSchemaCatalogue(new WidgetRegistry()),
            (widgets, _) =>
            {
                emitted = widgets;
                return ValueTask.CompletedTask;
            });
        var widgetsJson = JsonSerializer.Deserialize<JsonElement>(
            """[{"type":"button","label":"Approve","action":"approve"}]""");
        var arguments = new AIFunctionArguments { ["widgets"] = widgetsJson };

        var result = await function.InvokeAsync(arguments);

        var emissionResult = Assert.IsType<WidgetEmissionResult>(result);
        Assert.Equal(1, emissionResult.AcceptedCount);
        var button = Assert.IsType<ButtonWidget>(Assert.Single(emitted!));
        Assert.Equal("Approve", button.Label);
        Assert.Equal("approve", button.Action);
    }

    [Fact]
    public async Task InvokeAsync_BoundsStructuredRepairToOneAttempt()
    {
        var function = CreateFunction(new WidgetSchemaCatalogue(new WidgetRegistry()));
        var doubleEncoded = JsonSerializer.SerializeToElement(
            "[{\"type\":\"button\",\"label\":\"Approve\",\"action\":\"approve\"}]");
        var arguments = new AIFunctionArguments { ["widgets"] = doubleEncoded };

        var first = Assert.IsType<WidgetEmissionResult>(await function.InvokeAsync(arguments));
        var second = Assert.IsType<WidgetEmissionResult>(await function.InvokeAsync(arguments));

        Assert.False(first.Accepted);
        Assert.True(first.RepairAllowed);
        Assert.Contains(first.Diagnostics!, diagnostic => diagnostic.Code == WidgetValidationCodes.EmissionArrayRequired);
        Assert.False(second.RepairAllowed);
        Assert.Contains(second.Diagnostics!, diagnostic => diagnostic.Code == WidgetValidationCodes.RepairLimitReached);
    }

    [Fact]
    public async Task InvokeAsync_ValidatesEveryCandidateBeforeDeserialization()
    {
        var emitted = false;
        var function = new EmitWidgetsAIFunction(
            new WidgetSchemaCatalogue(new WidgetRegistry()),
            (_, _) =>
            {
                emitted = true;
                return ValueTask.CompletedTask;
            },
            new AlwaysRejectingValidator());
        var widgetsJson = JsonSerializer.Deserialize<JsonElement>(
            """[{"type":"invented","hallucinated":true}]""");

        var result = Assert.IsType<WidgetEmissionResult>(await function.InvokeAsync(
            new AIFunctionArguments { ["widgets"] = widgetsJson }));

        Assert.False(result.Accepted);
        Assert.False(emitted);
        Assert.Contains(result.Diagnostics!, diagnostic =>
            diagnostic.Code == WidgetValidationCodes.TypeNotRegistered &&
            diagnostic.Path == "/widgets/0/type");
    }

    [Fact]
    public async Task InvokeAsync_EmptyCatalogueAcceptsItsSchemaDefinedEmptyArray()
    {
        IReadOnlyList<ChatWidget>? emitted = null;
        var function = new EmitWidgetsAIFunction(
            new WidgetSchemaCatalogue([]),
            (widgets, _) =>
            {
                emitted = widgets;
                return ValueTask.CompletedTask;
            });

        var result = Assert.IsType<WidgetEmissionResult>(await function.InvokeAsync(
            new AIFunctionArguments { ["widgets"] = JsonSerializer.Deserialize<JsonElement>("[]") }));

        Assert.True(result.Accepted);
        Assert.Equal(0, result.AcceptedCount);
        Assert.Empty(emitted!);
    }

    [Fact]
    public void EventWrapper_PreservesSchemaAndStrictMetadata()
    {
        var inner = CreateFunction(new WidgetSchemaCatalogue(new WidgetRegistry()));
        var wrapper = new EventFiringAIFunction(inner, new NoOpEventDispatcher(), "thread");

        Assert.Equal(inner.JsonSchema.GetRawText(), wrapper.JsonSchema.GetRawText());
        Assert.True(Assert.IsType<bool>(wrapper.AdditionalProperties["strict"]));
    }

    private static EmitWidgetsAIFunction CreateFunction(WidgetSchemaCatalogue catalogue) =>
        new(catalogue, (_, _) => ValueTask.CompletedTask);

    private sealed record RatingWidget(
        string Label,
        string Action,
        int Maximum) : ChatWidget(Label, Action)
    {
        public override string Purpose => "Collect a rating.";
    }

    private sealed class NoOpEventDispatcher : IAgentEventDispatcher
    {
        public Task DispatchAsync(AgentEvent agentEvent, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;
    }

    private sealed class AlwaysRejectingValidator : IWidgetValidator
    {
        public WidgetValidationResult Validate(JsonElement candidate, WidgetValidationContext context) =>
            new([
                new WidgetValidationDiagnostic(
                    WidgetValidationCodes.TypeNotRegistered,
                    "Rejected before deserialization for this test.",
                    "/type",
                    WidgetValidationStage.RegisteredType)
            ]);
    }
}
