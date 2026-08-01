namespace BbQ.ChatWidgets.Models;

/// <summary>
/// Result returned to a model after a widget emission tool call is accepted.
/// </summary>
/// <param name="AcceptedCount">The number of widget candidates accepted by the emission boundary.</param>
public sealed record WidgetEmissionResult(int AcceptedCount);
