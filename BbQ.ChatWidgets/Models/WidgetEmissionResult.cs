namespace BbQ.ChatWidgets.Models;

/// <summary>
/// Result returned to a model after a widget emission tool call is accepted.
/// </summary>
/// <param name="AcceptedCount">The number of widget candidates accepted by the emission boundary.</param>
/// <param name="Diagnostics">Structured diagnostics for rejected candidates.</param>
/// <param name="RepairAllowed">Whether one corrected emission attempt is still allowed.</param>
public sealed record WidgetEmissionResult(
    int AcceptedCount,
    IReadOnlyList<WidgetValidationDiagnostic>? Diagnostics = null,
    bool RepairAllowed = false)
{
    /// <summary>
    /// Gets whether the complete emission batch was accepted.
    /// </summary>
    public bool Accepted => Diagnostics is null ||
        Diagnostics.All(diagnostic => diagnostic.Severity is not WidgetDiagnosticSeverity.Error);
}
