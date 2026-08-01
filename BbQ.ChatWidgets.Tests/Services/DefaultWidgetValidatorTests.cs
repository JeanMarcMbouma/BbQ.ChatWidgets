using System.Text.Json;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Services;
using Xunit;

namespace BbQ.ChatWidgets.Tests.Services;

public sealed class DefaultWidgetValidatorTests
{
    private readonly WidgetRegistry _registry = new();
    private readonly WidgetActionRegistry _actions = new();

    [Fact]
    public void Validate_AcceptsSchemaConformingWidget()
    {
        var validator = new DefaultWidgetValidator();
        var candidate = Parse("""{"type":"button","label":"Approve","action":"approve"}""");

        var result = validator.Validate(candidate, Context());

        Assert.True(result.IsValid);
        Assert.Empty(result.Diagnostics);
    }

    [Fact]
    public void Validate_RejectsUnregisteredWidgetTypeBeforeDeserialization()
    {
        var validator = new DefaultWidgetValidator();
        var candidate = Parse("""{"type":"invented","label":"Do it","action":"do_it"}""");

        var result = validator.Validate(candidate, Context());

        var diagnostic = Assert.Single(result.Diagnostics);
        Assert.Equal(WidgetValidationCodes.TypeNotRegistered, diagnostic.Code);
        Assert.Equal("/type", diagnostic.Path);
        Assert.Equal(WidgetValidationStage.RegisteredType, diagnostic.Stage);
    }

    [Fact]
    public void Validate_ReportsJsonSchemaKeywordAndInstancePath()
    {
        var validator = new DefaultWidgetValidator();
        var candidate = Parse(
            """{"type":"button","label":"Approve","action":"approve","hallucinated":true}""");

        var result = validator.Validate(candidate, Context());

        Assert.False(result.IsValid);
        Assert.Contains(result.Diagnostics, diagnostic =>
            diagnostic.Code.StartsWith(WidgetValidationCodes.SchemaViolation, StringComparison.Ordinal) &&
            diagnostic.Stage == WidgetValidationStage.Schema);
    }

    [Fact]
    public void Validate_RejectsInvalidCrossPropertyRelationship()
    {
        var validator = new DefaultWidgetValidator();
        var candidate = Parse(
            """{"type":"slider","label":"Priority","action":"set_priority","min":10,"max":5,"step":0,"default":20}""");

        var result = validator.Validate(candidate, Context());

        Assert.Contains(result.Diagnostics, diagnostic =>
            diagnostic.Code == WidgetValidationCodes.SemanticViolation && diagnostic.Path == "/min");
        Assert.Contains(result.Diagnostics, diagnostic =>
            diagnostic.Code == WidgetValidationCodes.SemanticViolation && diagnostic.Path == "/step");
        Assert.Contains(result.Diagnostics, diagnostic =>
            diagnostic.Code == WidgetValidationCodes.SemanticViolation && diagnostic.Path == "/default");
    }

    [Fact]
    public void Validate_RejectsUnregisteredActionWhenEnabled()
    {
        var validator = new DefaultWidgetValidator();
        var candidate = Parse("""{"type":"button","label":"Approve","action":"invented"}""");

        var result = validator.Validate(candidate, Context(requireActions: true));

        Assert.Contains(result.Diagnostics, diagnostic =>
            diagnostic.Code == WidgetValidationCodes.ActionNotRegistered && diagnostic.Path == "/action");
    }

    [Fact]
    public void Validate_AcceptsRegisteredActionWhenEnabled()
    {
        _actions.RegisterAction(new WidgetActionMetadata("approve", "Approve", "{}", typeof(object)));
        var validator = new DefaultWidgetValidator();
        var candidate = Parse("""{"type":"button","label":"Approve","action":"approve"}""");

        var result = validator.Validate(candidate, Context(requireActions: true));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_RunsCustomActionPayloadCompatibilityRules()
    {
        _actions.RegisterAction(new WidgetActionMetadata("approve", "Approve", "{}", typeof(object)));
        var validator = new DefaultWidgetValidator(
            actionCompatibilityValidators: [new RejectingCompatibilityValidator()]);
        var candidate = Parse("""{"type":"button","label":"Approve","action":"approve"}""");

        var result = validator.Validate(candidate, Context(requireActions: true));

        Assert.Contains(result.Diagnostics, diagnostic =>
            diagnostic.Code == WidgetValidationCodes.ActionPayloadIncompatible &&
            diagnostic.Stage == WidgetValidationStage.ActionPayload);
    }

    private WidgetValidationContext Context(bool requireActions = false) =>
        new(new WidgetSchemaCatalogue(_registry), _actions, requireActions);

    private static JsonElement Parse(string json) => JsonSerializer.Deserialize<JsonElement>(json);

    private sealed class RejectingCompatibilityValidator : IWidgetActionCompatibilityValidator
    {
        public IEnumerable<WidgetValidationDiagnostic> Validate(
            string widgetType,
            string action,
            JsonElement candidate,
            BbQ.ChatWidgets.Abstractions.IWidgetActionMetadata actionMetadata)
        {
            yield return new(
                WidgetValidationCodes.ActionPayloadIncompatible,
                "The action payload is incompatible for this test.",
                "/action",
                WidgetValidationStage.ActionPayload);
        }
    }
}
