using BbQ.ChatWidgets.Agents.Abstractions;
using Microsoft.Extensions.AI;

namespace BbQ.ChatWidgets.Sample.Agents;

/// <summary>
/// Classifies user intents for routing to specialized agents.
/// </summary>
public enum UserIntent
{
    /// <summary>
    /// User is asking for help or support.
    /// </summary>
    HelpRequest,

    /// <summary>
    /// User is asking for data or information.
    /// </summary>
    DataQuery,

    /// <summary>
    /// User is requesting an action to be performed.
    /// </summary>
    ActionRequest,

    /// <summary>
    /// User is providing feedback.
    /// </summary>
    Feedback,

    /// <summary>
    /// User intent could not be determined.
    /// </summary>
    Unknown
}

/// <summary>
/// Classifies user messages into UserIntent categories using AI-based analysis.
/// </summary>
/// <remarks>
/// This classifier uses a chat client to analyze user messages and categorize them
/// based on the user's apparent intent. It's useful for routing different types of
/// requests to specialized agents.
/// </remarks>
public sealed class UserIntentClassifier : IClassifier<UserIntent>
{
    private readonly IChatClient _chatClient;

    /// <summary>
    /// Initializes a new instance of the <see cref="UserIntentClassifier"/> class.
    /// </summary>
    /// <param name="chatClient">The chat client for AI-based classification.</param>
    public UserIntentClassifier(IChatClient chatClient)
    {
        _chatClient = chatClient ?? throw new ArgumentNullException(nameof(chatClient));
    }

    public async Task<UserIntent> ClassifyAsync(string input, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(input))
            return UserIntent.Unknown;

        try
        {
            var prompt = $"""
                Classify the following user message into EXACTLY ONE of these categories.
                Respond with ONLY the category name - nothing else.
                
                Categories:
                - HelpRequest: User is asking for help, assistance, support, or troubleshooting
                - DataQuery: User is asking for data, information, facts, statistics, or knowledge
                - ActionRequest: User wants something done, executed, created, modified, or deleted
                - Feedback: User is providing feedback, suggestions, complaints, or compliments
                
                If none of these categories fit, respond with: Unknown
                
                User message: {input}
                
                Your response (category name only):
                """;

            var options = new ChatOptions { ToolMode = ChatToolMode.None };
            var response = await _chatClient.GetResponseAsync(
                [new Microsoft.Extensions.AI.ChatMessage(Microsoft.Extensions.AI.ChatRole.User, prompt)],
                options,
                ct);

            var responseText = response.Text.Trim();

            return Enum.TryParse<UserIntent>(responseText, ignoreCase: true, out var intent)
                ? intent
                : UserIntent.Unknown;
        }
        catch
        {
            return UserIntent.Unknown;
        }
    }
}
