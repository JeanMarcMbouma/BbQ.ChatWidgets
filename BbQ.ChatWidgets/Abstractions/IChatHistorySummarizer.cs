using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Abstractions;

/// <summary>
/// Defines the contract for summarizing chat conversation history.
/// </summary>
/// <remarks>
/// Chat history summarizers help manage context window limits by condensing
/// older conversation turns into concise summaries. This allows maintaining
/// relevant context while staying within token budget constraints.
/// 
/// The summarizer typically:
/// - Takes a range of conversation turns
/// - Generates a concise summary capturing key points
/// - Returns the summary text for inclusion in the context
/// 
/// Implementations may use AI models, template-based summarization,
/// or custom business logic to generate summaries.
/// </remarks>
public interface IChatHistorySummarizer
{
    /// <summary>
    /// Generates a summary of the specified conversation turns.
    /// </summary>
    /// <remarks>
    /// This method should:
    /// - Extract key information from the provided turns
    /// - Preserve important context and decisions
    /// - Generate a concise summary suitable for inclusion in AI prompts
    /// - Handle both user and assistant messages appropriately
    /// 
    /// The summary is intended to be prepended to recent conversation turns
    /// when the full history would exceed the context window.
    /// </remarks>
    /// <param name="turns">The conversation turns to summarize.</param>
    /// <param name="ct">Cancellation token for the async operation.</param>
    /// <returns>
    /// A task that completes with a concise text summary of the conversation turns.
    /// </returns>
    /// <exception cref="ArgumentNullException">
    /// Thrown if <paramref name="turns"/> is null.
    /// </exception>
    /// <exception cref="OperationCanceledException">
    /// Thrown if the operation is cancelled via the cancellation token.
    /// </exception>
    Task<string> SummarizeAsync(IReadOnlyList<ChatTurn> turns, CancellationToken ct = default);
}
