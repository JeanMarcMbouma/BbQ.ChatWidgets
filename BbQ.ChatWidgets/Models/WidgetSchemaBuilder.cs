using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Schema;

namespace BbQ.ChatWidgets.Models;

/// <summary>
/// Produces canonical schemas for registered widget runtime types.
/// </summary>
internal static class WidgetSchemaBuilder
{
    private const string JsonSchemaDialect = "https://json-schema.org/draft/2020-12/schema";
    private const string SchemaBaseUri = "https://schemas.bbq.chat/widgets";

    public static JsonElement Build(string typeId, Type runtimeType, string schemaVersion)
    {
        if (string.IsNullOrWhiteSpace(typeId))
            throw new ArgumentException("Widget type cannot be empty.", nameof(typeId));
        ArgumentNullException.ThrowIfNull(runtimeType);
        if (string.IsNullOrWhiteSpace(schemaVersion))
            throw new ArgumentException("Widget schema version cannot be empty.", nameof(schemaVersion));

        // Export the concrete runtime contract without the polymorphic ChatWidget
        // converter. That converter is correct for wire serialization, but schema
        // exporters must inspect the derived widget properties directly.
        var exporterOptions = new JsonSerializerOptions(Serialization.Default);
        var widgetConverter = exporterOptions.Converters
            .FirstOrDefault(converter => converter is ChatWidgetConverter);
        if (widgetConverter is not null)
            exporterOptions.Converters.Remove(widgetConverter);

        var generated = exporterOptions.GetJsonSchemaAsNode(runtimeType);
        if (generated is not JsonObject schema)
            throw new InvalidOperationException($"Schema generation for '{runtimeType}' did not produce an object schema.");

        schema["$schema"] = JsonSchemaDialect;
        schema["$id"] = $"{SchemaBaseUri}/{Uri.EscapeDataString(typeId)}/{Uri.EscapeDataString(schemaVersion)}";
        schema["title"] = typeId;
        schema["type"] = "object";
        schema["additionalProperties"] = false;

        var properties = schema["properties"] as JsonObject;
        if (properties is null)
        {
            properties = new JsonObject();
            schema["properties"] = properties;
        }

        properties["type"] = new JsonObject
        {
            ["type"] = "string",
            ["const"] = typeId,
            ["description"] = "Registered widget type discriminator."
        };

        var required = schema["required"] as JsonArray;
        if (required is null)
        {
            required = [];
            schema["required"] = required;
        }

        if (!required.Any(node => string.Equals(node?.GetValue<string>(), "type", StringComparison.Ordinal)))
            required.Insert(0, "type");

        return JsonSerializer.SerializeToElement(schema, Serialization.Default);
    }
}
