namespace BbQ.ChatWidgets.Models;

/// <summary>
/// Represents a complete chat message history for a conversation.
/// </summary>
/// <param name="Turns">The sequence of chat turns in this conversation.</param>
/// <remarks>
/// A chat message encapsulates the full history of turns in a conversation.
/// It provides a sequence of chat turns that can be converted to AI framework formats.
/// </remarks>
public record ChatMessages(IReadOnlyList<ChatTurn> Turns);

/// <summary>
/// Extension methods for converting <see cref="ChatMessages"/> to AI framework formats.
/// </summary>
public static class ChatMessageExtensions
{
    /// <summary>
    /// The maximum number of turns to include when converting messages to AI format.
    /// </summary>
    /// <remarks>
    /// This constant controls the context window size sent to the AI client.
    /// A smaller value reduces token usage but may lose important conversational context.
    /// A larger value increases token usage but provides better context for coherent responses.
    /// Current setting: 10 turns = approximately 5 conversation exchanges
    /// </remarks>
    private const int MaxContextTurns = 10;

    extension(ChatMessages chatMessage)
    {
        /// <summary>
        /// Converts a <see cref="ChatMessages"/> to a list of <see cref="Microsoft.Extensions.AI.ChatMessage"/> suitable for AI clients.
        /// </summary>
        /// <remarks>
        /// This method:
        /// - Validates the input to ensure non-null and non-empty turns
        /// - Takes the last N turns from the conversation to limit context size
        /// - Extracts the role and content from each turn
        /// - Strips widget information (not needed for the AI client)
        /// - Returns a format compatible with Microsoft.Extensions.AI
        /// - Ensures the most recent messages are always included for context continuity
        /// 
        /// Context Management:
        /// The context window uses a sliding window approach that takes the most recent turns.
        /// This strategy:
        /// - Reduces token usage for long conversations
        /// - Maintains the most relevant recent context
        /// - Prevents exceeding API token limits
        /// - Keeps the conversation thread coherent
        /// 
        /// Performance:
        /// Uses TakeLast() for efficient memory usage, processing only necessary turns.
        /// </remarks>
        /// <returns>
        /// A read-only list of <see cref="Microsoft.Extensions.AI.ChatMessage"/> objects
        /// suitable for sending to an AI chat client. Returns an empty list if the input
        /// is null or contains no turns.
        /// </returns>
        /// <exception cref="ArgumentNullException">
        /// </exception>
        public IReadOnlyList<Microsoft.Extensions.AI.ChatMessage> ToAIMessages()
        {
            ArgumentNullException.ThrowIfNull(chatMessage);

            // Handle empty conversation
            if (chatMessage.Turns.Count == 0)
            {
                return [];
            }

            // Determine the number of turns to include in the context window
            var turnsToInclude = Math.Min(chatMessage.Turns.Count, MaxContextTurns);

            // Use LINQ for efficient collection conversion with context limiting
            return [
                ..chatMessage.Turns
                .TakeLast(turnsToInclude)
                .Select(turn => new Microsoft.Extensions.AI.ChatMessage(turn.Role, turn.Content))
            ];
        }

        /// <summary>
        /// Converts a <see cref="ChatMessages"/> to a list of <see cref="Microsoft.Extensions.AI.ChatMessage"/> with custom context window size.
        /// </summary>
        /// <remarks>
        /// This overload allows callers to specify a custom context window size instead of using the default.
        /// Useful for:
        /// - Short conversations that need minimal context
        /// - Long conversations that require extended context for complex reasoning
        /// - Token-constrained scenarios where context size must be controlled
        /// 
        /// The actual number of turns included will be the minimum of the requested size
        /// and the available turns in the conversation.
        /// </remarks>
        /// <param name="maxTurns">The maximum number of turns to include in the context window.</param>
        /// <returns>
        /// A read-only list of <see cref="Microsoft.Extensions.AI.ChatMessage"/> objects
        /// limited to the specified context window size.
        /// </returns>
        /// <exception cref="ArgumentNullException">
        /// </exception>
        /// <exception cref="ArgumentOutOfRangeException">
        /// Thrown if <paramref name="maxTurns"/> is less than 1.
        /// </exception>
        public IReadOnlyList<Microsoft.Extensions.AI.ChatMessage> ToAIMessages(
            int maxTurns)
        {
            ArgumentNullException.ThrowIfNull(chatMessage);

            if (maxTurns < 1)
            {
                throw new ArgumentOutOfRangeException(nameof(maxTurns), maxTurns, "Maximum turns must be at least 1.");
            }

            // Handle empty conversation
            if (chatMessage.Turns.Count == 0)
            {
                return [];
            }

            // Use the smaller of requested turns or available turns
            var turnsToInclude = Math.Min(chatMessage.Turns.Count, maxTurns);

            return [
                ..chatMessage.Turns
                .TakeLast(turnsToInclude)
                .Select(turn => new Microsoft.Extensions.AI.ChatMessage(turn.Role, turn.Content))
            ];
        }

        /// <summary>
        /// Converts a <see cref="ChatMessages"/> to a list of <see cref="Microsoft.Extensions.AI.ChatMessage"/> with summaries for context management.
        /// </summary>
        /// <remarks>
        /// This overload uses summaries to manage context when conversations exceed the maximum turns threshold.
        /// It:
        /// - Includes existing summaries at the beginning
        /// - Keeps the most recent N turns in full detail
        /// - Reduces token usage while preserving context
        /// 
        /// This is particularly useful for long conversations where full history would
        /// exceed token limits but context is still important.
        /// </remarks>
        /// <param name="maxTurns">The maximum number of recent turns to include in full detail.</param>
        /// <param name="summaries">Existing summaries of older conversation turns.</param>
        /// <returns>
        /// A read-only list of <see cref="Microsoft.Extensions.AI.ChatMessage"/> objects
        /// with summaries prepended and recent turns included.
        /// </returns>
        /// <exception cref="ArgumentNullException">
        /// Thrown if <paramref name="summaries"/> is null.
        /// </exception>
        /// <exception cref="ArgumentOutOfRangeException">
        /// Thrown if <paramref name="maxTurns"/> is less than 1.
        /// </exception>
        public IReadOnlyList<Microsoft.Extensions.AI.ChatMessage> ToAIMessages(
            int maxTurns,
            IReadOnlyList<ChatSummary> summaries)
        {
            ArgumentNullException.ThrowIfNull(chatMessage);
            ArgumentNullException.ThrowIfNull(summaries);

            if (maxTurns < 1)
            {
                throw new ArgumentOutOfRangeException(nameof(maxTurns), maxTurns, "Maximum turns must be at least 1.");
            }

            // Handle empty conversation
            if (chatMessage.Turns.Count == 0)
            {
                return [];
            }

            var messages = new List<Microsoft.Extensions.AI.ChatMessage>();

            // Add summaries as system messages at the beginning
            if (summaries.Count > 0)
            {
                var combinedSummary = string.Join("\n\n", summaries.Select(s => s.SummaryText));
                messages.Add(new Microsoft.Extensions.AI.ChatMessage(
                    Microsoft.Extensions.AI.ChatRole.System,
                    $"Previous conversation summary:\n{combinedSummary}"));
            }

            // Add recent turns in full detail
            var turnsToInclude = Math.Min(chatMessage.Turns.Count, maxTurns);
            messages.AddRange(
                chatMessage.Turns
                    .TakeLast(turnsToInclude)
                    .Select(turn => new Microsoft.Extensions.AI.ChatMessage(turn.Role, turn.Content))
            );

            return messages;
        }
    }
}
