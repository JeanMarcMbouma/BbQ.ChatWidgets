using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Models;
using Microsoft.Extensions.AI;
using System.Text;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// Default implementation of <see cref="IChatHistorySummarizer"/> using an AI chat client.
/// </summary>
/// <remarks>
/// This implementation uses the configured AI chat client to generate summaries
/// of conversation history. It creates a focused prompt that instructs the AI
/// to extract key points, decisions, and important context from the provided turns.
/// 
/// The summarizer:
/// - Converts chat turns into a readable format
/// - Sends them to the AI with instructions to summarize
/// - Returns a concise summary suitable for context management
/// - Handles both user and assistant messages
/// 
/// For production use, consider:
/// - Using a faster/cheaper model for summarization
/// - Caching summaries to avoid repeated API calls
/// - Implementing rate limiting for summarization requests
/// </remarks>
public sealed class DefaultChatHistorySummarizer : IChatHistorySummarizer
{
    private readonly IChatClient _chatClient;

    /// <summary>
    /// Initializes a new instance of the <see cref="DefaultChatHistorySummarizer"/> class.
    /// </summary>
    /// <param name="chatClient">The AI chat client used to generate summaries.</param>
    public DefaultChatHistorySummarizer(IChatClient chatClient)
    {
        _chatClient = chatClient ?? throw new ArgumentNullException(nameof(chatClient));
    }

    /// <inheritdoc/>
    public async Task<string> SummarizeAsync(IReadOnlyList<ChatTurn> turns, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(turns);

        if (turns.Count == 0)
        {
            return string.Empty;
        }

        // Build a readable representation of the conversation
        var conversationText = new StringBuilder();
        conversationText.AppendLine("Conversation history to summarize:");
        conversationText.AppendLine();

        foreach (var turn in turns)
        {
            var roleLabel = turn.Role.Value switch
            {
                "user" => "User",
                "assistant" => "Assistant",
                _ => turn.Role.Value
            };

            conversationText.AppendLine($"{roleLabel}: {turn.Content}");
        }

        // Create a summarization prompt
        var systemPrompt = @"You are a helpful assistant that creates concise summaries of conversation history.
Your task is to summarize the key points, decisions, and important context from the conversation.
Focus on:
- Main topics discussed
- Important decisions or conclusions
- Key information that would be needed for understanding the conversation context
- Action items or pending questions

Keep the summary concise (2-4 sentences) while preserving essential information.
Do not include greetings, pleasantries, or meta-commentary.";

        var messages = new List<Microsoft.Extensions.AI.ChatMessage>
        {
            new(ChatRole.System, systemPrompt),
            new(ChatRole.User, conversationText.ToString())
        };

        var options = new ChatOptions
        {
            MaxOutputTokens = 200 // Limit summary length
        };

        var response = await _chatClient.GetResponseAsync(messages, options, ct);

        return response.Text?.Trim() ?? string.Empty;
    }
}
