namespace BbQ.ChatWidgets.Models;

/// <summary>
/// Represents a complete chat message history for a conversation.
/// </summary>
/// <remarks>
/// A chat message encapsulates the full history of turns in a conversation.
/// It provides a sequence of chat turns that can be converted to AI framework formats.
/// </remarks>
public record ChatMessages(
    /// <summary>
    /// The sequence of turns (messages) in this chat conversation.
    /// </summary>
    IReadOnlyList<ChatTurn> Turns);

/// <summary>
/// Extension methods for converting <see cref="ChatMessages"/> to AI framework formats.
/// </summary>
public static class ChatMessageExtensions
{
    /// <summary>
    /// Converts a <see cref="ChatMessages"/> to a list of <see cref="Microsoft.Extensions.AI.ChatMessage"/> suitable for AI clients.
    /// </summary>
    /// <remarks>
    /// This method:
    /// - Takes the last 10 turns from the conversation (to limit context size)
    /// - Extracts the role and content from each turn
    /// - Strips widget information (not needed for the AI client)
    /// - Returns a format compatible with Microsoft.Extensions.AI
    /// 
    /// The 10-turn limit helps control token usage for the AI API while maintaining
    /// sufficient context for coherent responses.
    /// </remarks>
    /// <param name="chatMessage">The chat message history to convert.</param>
    /// <returns>
    /// A read-only list of <see cref="Microsoft.Extensions.AI.ChatMessage"/> objects
    /// suitable for sending to an AI chat client.
    /// </returns>
    public static IReadOnlyList<Microsoft.Extensions.AI.ChatMessage> ToAIMessages(this ChatMessages chatMessage)
    {
        var messages = new List<Microsoft.Extensions.AI.ChatMessage>();
        foreach (var turn in chatMessage.Turns.TakeLast(10))
        {
            messages.Add(new Microsoft.Extensions.AI.ChatMessage(turn.Role, turn.Content));
        }
        return messages;
    }
}
