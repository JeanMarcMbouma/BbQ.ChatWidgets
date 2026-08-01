using System.Collections.ObjectModel;
using System.Diagnostics.CodeAnalysis;
using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// Immutable catalogue of canonical widget schemas.
/// </summary>
public sealed class WidgetSchemaCatalogue : IWidgetSchemaCatalogue
{
    private readonly IReadOnlyDictionary<(string Type, string Version), WidgetDefinition> _definitionsByKey;

    /// <summary>
    /// Builds a catalogue snapshot from a fully configured widget registry.
    /// </summary>
    public WidgetSchemaCatalogue(IWidgetRegistry registry)
        : this(CreateDefinitions(registry))
    {
    }

    /// <summary>
    /// Builds a catalogue from explicit definitions.
    /// </summary>
    /// <remarks>
    /// The constructor rejects duplicate type/version pairs instead of silently
    /// replacing them, making schema ownership deterministic.
    /// </remarks>
    public WidgetSchemaCatalogue(IEnumerable<WidgetDefinition> definitions)
    {
        ArgumentNullException.ThrowIfNull(definitions);

        var byKey = new Dictionary<(string Type, string Version), WidgetDefinition>();
        foreach (var definition in definitions)
        {
            ArgumentNullException.ThrowIfNull(definition);
            var key = (definition.Type, definition.SchemaVersion);
            if (!byKey.TryAdd(key, definition))
            {
                throw new InvalidOperationException(
                    $"Widget schema '{definition.Type}' version '{definition.SchemaVersion}' is already registered.");
            }
        }

        _definitionsByKey = new ReadOnlyDictionary<(string Type, string Version), WidgetDefinition>(byKey);
        Definitions = Array.AsReadOnly(byKey.Values
            .OrderBy(definition => definition.Type, StringComparer.Ordinal)
            .ThenBy(definition => definition.SchemaVersion, StringComparer.Ordinal)
            .ToArray());
    }

    /// <inheritdoc />
    public IReadOnlyList<WidgetDefinition> Definitions { get; }

    /// <inheritdoc />
    public bool TryGetDefinition(string type, [NotNullWhen(true)] out WidgetDefinition? definition) =>
        TryGetDefinition(type, WidgetDefinition.CurrentSchemaVersion, out definition);

    /// <inheritdoc />
    public bool TryGetDefinition(
        string type,
        string schemaVersion,
        [NotNullWhen(true)] out WidgetDefinition? definition)
    {
        if (string.IsNullOrWhiteSpace(type) || string.IsNullOrWhiteSpace(schemaVersion))
        {
            definition = null;
            return false;
        }

        return _definitionsByKey.TryGetValue((type, schemaVersion), out definition);
    }

    /// <inheritdoc />
    public WidgetDefinition GetRequiredDefinition(
        string type,
        string schemaVersion = WidgetDefinition.CurrentSchemaVersion)
    {
        if (TryGetDefinition(type, schemaVersion, out var definition))
            return definition;

        throw new KeyNotFoundException($"Widget schema '{type}' version '{schemaVersion}' is not registered.");
    }

    private static IEnumerable<WidgetDefinition> CreateDefinitions(IWidgetRegistry registry)
    {
        ArgumentNullException.ThrowIfNull(registry);

        return registry.GetEntries().Select(entry => new WidgetDefinition(
            entry.TypeId,
            WidgetDefinition.CurrentSchemaVersion,
            entry.Widget.GetType(),
            WidgetSchemaBuilder.Build(entry.TypeId, entry.Widget.GetType(), WidgetDefinition.CurrentSchemaVersion),
            entry.Widget.Purpose));
    }
}
