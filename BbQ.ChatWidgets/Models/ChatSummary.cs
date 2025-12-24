namespace BbQ.ChatWidgets.Models;

/// <summary>
/// Represents a summary of a range of chat conversation turns.
/// </summary>
/// <param name="SummaryText">The condensed summary of the conversation turns.</param>
/// <param name="StartTurnIndex">The index of the first turn included in this summary (inclusive).</param>
/// <param name="EndTurnIndex">The index of the last turn included in this summary (inclusive).</param>
/// <remarks>
/// Chat summaries are used to manage context window limits by condensing
/// older conversation history into concise summaries. This allows the system
/// to maintain relevant context while staying within token budget constraints.
/// 
/// The turn indices reference positions in the original conversation history,
/// allowing the system to track which turns have been summarized and which
/// are still being used in their original form.
/// </remarks>
public record ChatSummary(
    string SummaryText,
    int StartTurnIndex,
    int EndTurnIndex
);
