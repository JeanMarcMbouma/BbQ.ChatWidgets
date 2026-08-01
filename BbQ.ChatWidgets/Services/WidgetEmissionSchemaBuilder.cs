using BbQ.ChatWidgets.Abstractions;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// Builds the strict input contract for the emit-widgets function.
/// </summary>
internal static class WidgetEmissionSchemaBuilder
{
    public static JsonElement Build(IWidgetSchemaCatalogue catalogue)
    {
        ArgumentNullException.ThrowIfNull(catalogue);

        JsonNode items;
        var definitions = catalogue.Definitions;
        if (definitions.Count == 0)
        {
            // A valid, deterministic schema for an empty catalogue. It permits
            // only an empty array and therefore cannot admit an unknown widget.
            items = JsonValue.Create(false)!;
        }
        else
        {
            var oneOf = new JsonArray();
            foreach (var definition in definitions)
            {
                var branch = JsonNode.Parse(definition.Schema.GetRawText()) as JsonObject
                    ?? throw new InvalidOperationException(
                        $"Widget schema '{definition.Type}' version '{definition.SchemaVersion}' is not an object.");

                // These keywords describe a standalone catalogue document. The
                // embedded function schema remains self-contained without them,
                // and provider schema subsets commonly reject nested dialect IDs.
                branch.Remove("$schema");
                branch.Remove("$id");
                MakeStrict(branch);
                oneOf.Add(branch);
            }

            items = new JsonObject { ["oneOf"] = oneOf };
        }

        var widgets = new JsonObject
        {
            ["type"] = "array",
            ["description"] = "Complete desired widget states. Never include instance IDs, revisions, lifecycle state, permissions, or transport patches.",
            ["items"] = items,
            ["minItems"] = definitions.Count == 0 ? 0 : 1
        };
        if (definitions.Count == 0)
            widgets["maxItems"] = 0;

        var schema = new JsonObject
        {
            ["$schema"] = "https://json-schema.org/draft/2020-12/schema",
            ["type"] = "object",
            ["additionalProperties"] = false,
            ["properties"] = new JsonObject { ["widgets"] = widgets },
            ["required"] = new JsonArray("widgets")
        };

        return JsonSerializer.SerializeToElement(schema, Models.Serialization.Default);
    }

    private static void MakeStrict(JsonNode? node)
    {
        if (node is JsonArray array)
        {
            foreach (var item in array)
                MakeStrict(item);
            return;
        }

        if (node is not JsonObject obj)
            return;

        // Recurse over a snapshot because the schema object may be updated below.
        foreach (var child in obj.Select(property => property.Value).ToArray())
            MakeStrict(child);

        if (obj["properties"] is not JsonObject properties)
            return;

        obj["additionalProperties"] = false;
        obj["required"] = new JsonArray(
            properties.Select(property => JsonValue.Create(property.Key)).ToArray());
    }
}
