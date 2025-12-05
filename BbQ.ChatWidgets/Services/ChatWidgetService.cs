using Microsoft.Extensions.AI;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Abstractions;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// Orchestrates chat widget interactions by managing message processing, widget tool availability,
/// and conversation threading.
/// </summary>
/// <remarks>
/// This service is the central hub for chat widget functionality. It:
/// - Manages conversation threads and message history
/// - Provides available widget tools to the AI chat client
/// - Processes user messages and generates responses with embedded widgets
/// - Handles widget actions triggered by user interactions
/// 
/// The service integrates with:
/// - <see cref="IChatClient"/> for AI responses
/// - <see cref="IWidgetActionHandler"/> for processing widget actions
/// - <see cref="IWidgetToolsProvider"/> for exposing widget capabilities
/// - <see cref="IThreadService"/> for conversation management
/// </remarks>
public sealed class ChatWidgetService
{
    private readonly IChatClient _chat;
    private readonly IWidgetActionHandler _actions;
    private readonly IWidgetToolsProvider _toolsProvider;
    private readonly IThreadService _threadService;

    /// <summary>
    /// Initializes a new instance of the <see cref="ChatWidgetService"/> class.
    /// </summary>
    /// <param name="chat">The AI chat client used for generating responses.</param>
    /// <param name="actions">The handler for processing widget-triggered actions.</param>
    /// <param name="toolsProvider">The provider that supplies available widget tools to the AI.</param>
    /// <param name="threadService">The service for managing conversation threads and message history.</param>
    /// <exception cref="ArgumentNullException">
    /// Thrown if any parameter is null.
    /// </exception>
    public ChatWidgetService(IChatClient chat, IWidgetActionHandler actions, IWidgetToolsProvider toolsProvider, IThreadService threadService)
    {
        _chat = chat;
        _actions = actions;
        _toolsProvider = toolsProvider;
        _threadService = threadService;
    }

    /// <summary>
    /// Processes a user message and generates an AI response with optional embedded widgets.
    /// </summary>
    /// <remarks>
    /// This method:
    /// 1. Validates or creates a conversation thread
    /// 2. Appends the user message to the thread history
    /// 3. Retrieves available widget tools from the tools provider
    /// 4. Sends the message to the AI chat client with widget tools enabled
    /// 5. Parses the AI response to extract widgets and clean content
    /// 6. Returns a ChatTurn with both content and parsed widgets
    /// 
    /// The AI model receives widget tool definitions allowing it to embed interactive widgets
    /// in its responses using the `<widget>...</widget>` format.
    /// </remarks>
    /// <param name="userMessage">The message from the user to send to the AI.</param>
    /// <param name="threadId">
    /// The conversation thread ID. If null or non-existent, a new thread is created.
    /// </param>
    /// <param name="ct">Cancellation token to cancel the async operation.</param>
    /// <returns>
    /// A task that completes with a <see cref="ChatTurn"/> containing:
    /// - The assistant's response content (with widget markers removed)
    /// - Any parsed widget definitions from the response
    /// - The conversation thread ID
    /// </returns>
    /// <exception cref="OperationCanceledException">
    /// Thrown if the operation is cancelled via the cancellation token.
    /// </exception>
    public async Task<ChatTurn> RespondAsync(string userMessage, string? threadId = null, CancellationToken ct = default)
    {
        if(threadId == null || !_threadService.ThreadExists(threadId))
        {
            threadId = _threadService.CreateThread();
        }

        var chatOptions = new ChatOptions
        {
            Tools = [.. _toolsProvider.GetTools()],
            ToolMode = ChatToolMode.Auto,
            AllowMultipleToolCalls = true
        };

        var messages = _threadService.AppendMessageToThread(threadId, new ChatTurn(ChatRole.User, userMessage, ThreadId: threadId));

        var completion = await _chat.GetResponseAsync<BbQStructuredResponse>(messages.ToAIMessages(), Serialization.Default, chatOptions, cancellationToken: ct);

        var (content, widgets) = completion.Result;

        return new ChatTurn(ChatRole.Assistant, content, widgets, threadId);
    }

    /// <summary>
    /// Processes an action triggered by a widget and generates a response.
    /// </summary>
    /// <remarks>
    /// This method is called when a user interacts with a widget (e.g., clicks a button, submits a form).
    /// The action is processed by the configured action handler, which may:
    /// - Update application state
    /// - Query a database
    /// - Call external services
    /// - Generate a response based on the action
    /// 
    /// The response may contain additional widgets for continued interaction.
    /// </remarks>
    /// <param name="action">
    /// The action identifier from the widget (e.g., "submit", "delete", "select_option").
    /// </param>
    /// <param name="payload">
    /// Optional data associated with the action (e.g., form values, selected options).
    /// </param>
    /// <param name="threadId">The conversation thread ID for maintaining context.</param>
    /// <param name="ct">Cancellation token to cancel the async operation.</param>
    /// <returns>
    /// A task that completes with a <see cref="ChatTurn"/> containing the action response
    /// with any resulting widgets.
    /// </returns>
    /// <exception cref="OperationCanceledException">
    /// Thrown if the operation is cancelled via the cancellation token.
    /// </exception>
    public Task<ChatTurn> HandleActionAsync(string action, IReadOnlyDictionary<string, object?> payload, string threadId, CancellationToken ct = default)
        => _actions.HandleAsync(action, payload, threadId, ct);
}
