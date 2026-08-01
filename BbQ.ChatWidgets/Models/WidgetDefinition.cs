using System.Collections.Frozen;
using System.Text.Json;

namespace BbQ.ChatWidgets.Models;

/// <summary>
/// Describes one version of a registered widget contract.
/// </summary>
/// <remarks>
/// A definition is immutable and can safely be shared by model integrations,
/// validators, documentation generators, and client-contract generators.
/// The schema is stored as JSON rather than a JSON-encoded string.
/// </remarks>
public sealed record WidgetDefinition
{
    /// <summary>
    /// The schema version assigned to widget definitions that do not explicitly
    /// select another version.
    /// </summary>
    public const string CurrentSchemaVersion = "1.0.0";

    /// <summary>
    /// Initializes a widget definition.
    /// </summary>
    public WidgetDefinition(
        string type,
        string schemaVersion,
        Type runtimeType,
        JsonElement schema,
        string description,
        IEnumerable<string>? capabilities = null)
    {
        if (string.IsNullOrWhiteSpace(type))
            throw new ArgumentException("Widget type cannot be empty.", nameof(type));
        if (string.IsNullOrWhiteSpace(schemaVersion))
            throw new ArgumentException("Widget schema version cannot be empty.", nameof(schemaVersion));
        ArgumentNullException.ThrowIfNull(runtimeType);
        if (!typeof(ChatWidget).IsAssignableFrom(runtimeType))
            throw new ArgumentException($"Runtime type '{runtimeType}' must derive from {nameof(ChatWidget)}.", nameof(runtimeType));
        if (schema.ValueKind is not JsonValueKind.Object)
            throw new ArgumentException("Widget schema must be a JSON object.", nameof(schema));

        Type = type;
        SchemaVersion = schemaVersion;
        RuntimeType = runtimeType;
        Schema = schema.Clone();
        Description = description ?? string.Empty;
        Capabilities = (capabilities ?? [])
            .Where(capability => !string.IsNullOrWhiteSpace(capability))
            .ToFrozenSet(StringComparer.Ordinal);
    }

    /// <summary>
    /// Gets the wire discriminator used for the widget.
    /// </summary>
    public string Type { get; }

    /// <summary>
    /// Gets the semantic version of the widget schema.
    /// </summary>
    public string SchemaVersion { get; }

    /// <summary>
    /// Gets the CLR type used to serialize and deserialize the widget.
    /// </summary>
    public Type RuntimeType { get; }

    /// <summary>
    /// Gets the canonical JSON Schema for this definition.
    /// </summary>
    public JsonElement Schema { get; }

    /// <summary>
    /// Gets the human-readable purpose of the widget.
    /// </summary>
    public string Description { get; }

    /// <summary>
    /// Gets optional, application-defined capability identifiers.
    /// </summary>
    public IReadOnlySet<string> Capabilities { get; }
}
