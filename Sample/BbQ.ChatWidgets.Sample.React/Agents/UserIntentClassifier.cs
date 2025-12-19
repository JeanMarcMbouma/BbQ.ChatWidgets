using BbQ.ChatWidgets.Agents.Abstractions;
using Microsoft.Extensions.AI;

namespace BbQ.ChatWidgets.Sample.WebApp.Agents;

/// <summary>
/// AI-based classifier for user intent detection in web API sample.
/// Uses ChatClient to analyze user messages and determine their intent.
/// </summary>
/// <remarks>
/// This classifier leverages the OpenAI ChatClient to understand user intent
/// and classify messages into one of 5 categories:
/// - HelpRequest: User needs help or support
/// - DataQuery: User wants information or data
/// - ActionRequest: User wants an action performed
/// - Feedback: User providing suggestions or feedback
/// - Unknown: Intent could not be determined
/// 
/// The classifier works by sending a system prompt and the user message to
/// the LLM, which responds with the detected intent category.
/// </remarks>
public sealed class UserIntentClassifier : IClassifier<UserIntent>
{
    private readonly IChatClient _chatClient;
    private readonly ILogger<UserIntentClassifier> _logger;

    /// <summary>
    /// Initializes a new instance of the UserIntentClassifier.
    /// </summary>
    /// <param name="chatClient">The chat client for AI-based classification.</param>
    /// <param name="logger">Logger for diagnostic information.</param>
    public UserIntentClassifier(
        IChatClient chatClient,
        ILogger<UserIntentClassifier> logger)
    {
        _chatClient = chatClient ?? throw new ArgumentNullException(nameof(chatClient));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Classifies a user message into an intent category.
    /// </summary>
    /// <remarks>
    /// This method:
    /// 1. Sends the user message to the OpenAI API with a classification prompt
    /// 2. Parses the response to extract the intent category
    /// 3. Returns the classified intent (or Unknown if parsing fails)
    /// 
    /// The classification is case-insensitive and attempts to match against
    /// the enum values.
    /// </remarks>
    /// <param name="input">The user message to classify.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The classified UserIntent category.</returns>
    public async Task<UserIntent> ClassifyAsync(string input, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(input))
            return UserIntent.Unknown;

        try
        {
            _logger.LogDebug("Classifying user intent for message: {Message}", 
                input.Length > 50 ? input.Substring(0, 50) + "..." : input);

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
                [new ChatMessage(ChatRole.User, prompt)],
                options,
                ct);

            var responseText = response.Text.Trim();

            _logger.LogDebug("Classification response: {Response}", responseText);

            var intent = Enum.TryParse<UserIntent>(responseText, ignoreCase: true, out var parsed)
                ? parsed
                : UserIntent.Unknown;

            _logger.LogInformation("Message classified as: {Intent}", intent);
            return intent;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error classifying user intent");
            return UserIntent.Unknown;
        }
    }
}
