using System.Text.Json;
using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Extensions;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Services;
using Microsoft.Extensions.DependencyInjection;

namespace BbQ.ChatWidgets.Tests.Services;

public sealed class WidgetSchemaCatalogueTests
{
    [Fact]
    public void Constructor_FromRegistry_CreatesDefinitionForEveryRegisteredWidget()
    {
        var registry = new WidgetRegistry();

        var catalogue = new WidgetSchemaCatalogue(registry);

        Assert.Equal(registry.GetCount(), catalogue.Definitions.Count);
        Assert.True(catalogue.TryGetDefinition("button", out var definition));
        Assert.NotNull(definition);
        Assert.Equal(typeof(ButtonWidget), definition.RuntimeType);
        Assert.Equal(WidgetDefinition.CurrentSchemaVersion, definition.SchemaVersion);
    }

    [Fact]
    public void Definition_ContainsStrictStableSchemaMetadata()
    {
        var catalogue = new WidgetSchemaCatalogue(new WidgetRegistry());

        var definition = catalogue.GetRequiredDefinition("button");
        var schema = definition.Schema;

        Assert.Equal(JsonValueKind.Object, schema.ValueKind);
        Assert.Equal(
            "https://schemas.bbq.chat/widgets/button/1.0.0",
            schema.GetProperty("$id").GetString());
        Assert.Equal(
            "https://json-schema.org/draft/2020-12/schema",
            schema.GetProperty("$schema").GetString());
        Assert.False(schema.GetProperty("additionalProperties").GetBoolean());

        var discriminator = schema.GetProperty("properties").GetProperty("type");
        Assert.Equal("button", discriminator.GetProperty("const").GetString());
        Assert.Contains(
            schema.GetProperty("required").EnumerateArray(),
            item => item.GetString() == "type");
    }

    [Fact]
    public void Constructor_UsesRegistryTypeOverrideAsSchemaDiscriminator()
    {
        var registry = new WidgetRegistry();
        registry.Register(new RatingWidget("Rate", "rate", 5), "customer_rating");

        var catalogue = new WidgetSchemaCatalogue(registry);

        var definition = catalogue.GetRequiredDefinition("customer_rating");
        Assert.Equal(typeof(RatingWidget), definition.RuntimeType);
        Assert.Equal(
            "customer_rating",
            definition.Schema.GetProperty("properties").GetProperty("type").GetProperty("const").GetString());
    }

    [Fact]
    public void Constructor_RejectsDuplicateTypeAndVersion()
    {
        var definition = CreateDefinition("duplicate");

        var exception = Assert.Throws<InvalidOperationException>(() =>
            new WidgetSchemaCatalogue([definition, definition]));

        Assert.Contains("already registered", exception.Message);
    }

    [Fact]
    public void Definition_ClonesSchemaFromCallerOwnedDocument()
    {
        WidgetDefinition definition;
        using (var document = JsonDocument.Parse("""{"type":"object"}"""))
        {
            definition = new WidgetDefinition(
                "example",
                WidgetDefinition.CurrentSchemaVersion,
                typeof(ButtonWidget),
                document.RootElement,
                "Example");
        }

        Assert.Equal("object", definition.Schema.GetProperty("type").GetString());
    }

    [Fact]
    public void Definitions_CannotBeMutatedThroughCollectionInterface()
    {
        var catalogue = new WidgetSchemaCatalogue(new WidgetRegistry());
        var mutableView = Assert.IsAssignableFrom<IList<WidgetDefinition>>(catalogue.Definitions);

        Assert.Throws<NotSupportedException>(() => mutableView.Add(CreateDefinition("another")));
    }

    [Fact]
    public void AddBbQChatWidgets_RegistersCatalogueAsSingleton()
    {
        var services = new ServiceCollection();
        services.AddBbQChatWidgets();
        using var provider = services.BuildServiceProvider();

        var first = provider.GetRequiredService<IWidgetSchemaCatalogue>();
        var second = provider.GetRequiredService<IWidgetSchemaCatalogue>();

        Assert.Same(first, second);
        Assert.NotEmpty(first.Definitions);
    }

    private static WidgetDefinition CreateDefinition(string type)
    {
        using var document = JsonDocument.Parse("""{"type":"object"}""");
        return new WidgetDefinition(
            type,
            WidgetDefinition.CurrentSchemaVersion,
            typeof(ButtonWidget),
            document.RootElement,
            "Test definition");
    }

    private sealed record RatingWidget(
        string Label,
        string Action,
        int Maximum) : ChatWidget(Label, Action)
    {
        public override string Purpose => "Collect a rating.";
    }
}
