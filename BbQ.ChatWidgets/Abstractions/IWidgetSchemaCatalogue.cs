using System.Diagnostics.CodeAnalysis;
using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Abstractions;

/// <summary>
/// Read-only source of canonical widget schema definitions.
/// </summary>
public interface IWidgetSchemaCatalogue
{
    /// <summary>
    /// Gets every definition in stable type and version order.
    /// </summary>
    IReadOnlyList<WidgetDefinition> Definitions { get; }

    /// <summary>
    /// Attempts to find the current schema definition for a widget type.
    /// </summary>
    bool TryGetDefinition(string type, [NotNullWhen(true)] out WidgetDefinition? definition);

    /// <summary>
    /// Attempts to find a particular schema version for a widget type.
    /// </summary>
    bool TryGetDefinition(
        string type,
        string schemaVersion,
        [NotNullWhen(true)] out WidgetDefinition? definition);

    /// <summary>
    /// Gets a definition or throws when the type and version are not registered.
    /// </summary>
    WidgetDefinition GetRequiredDefinition(
        string type,
        string schemaVersion = WidgetDefinition.CurrentSchemaVersion);
}
