using Microsoft.Extensions.AI;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Abstractions;
using System.Text.Json;
using System.Reflection;
using System.Runtime.CompilerServices;

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
/// - Handles widget actions triggered by user interactions using type-safe handlers
/// - Manages context window limits through automatic chat history summarization
/// 
/// The service integrates with:
/// - <see cref="IChatClient"/> for AI responses
/// - <see cref="IWidgetHintParser"/> for parsing widget definitions from AI responses
/// - <see cref="IWidgetHintSanitizer"/> for sanitizing incomplete widget markup
/// - <see cref="IWidgetToolsProvider"/> for exposing widget capabilities
/// - <see cref="IAIToolsProvider"/> for additional AI tools
/// - <see cref="IThreadService"/> for conversation management
/// - <see cref="IAIInstructionProvider"/> for custom AI instructions
/// - <see cref="IWidgetActionRegistry"/> for action metadata
/// - <see cref="IWidgetActionHandlerResolver"/> for handler resolution
/// - <see cref="IChatHistorySummarizer"/> for chat history summarization
/// </remarks>
public sealed class ChatWidgetService(
    IChatClient chat,
    IWidgetHintParser widgetHintParser,
    IWidgetHintSanitizer widgetHintSanitizer,
    IWidgetToolsProvider widgetToolsProvider,
    IAIToolsProvider aiToolsProvider,
    IThreadService threadService,
    IThreadPersonaStore threadPersonaStore,
    IAIInstructionProvider instructionProvider,
    IWidgetActionRegistry actionRegistry,
    IWidgetActionHandlerResolver handlerResolver,
    IChatHistorySummarizer historySummarizer,
    BbQChatOptions options)
{
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
    public Task<ChatTurn> RespondAsync(string userMessage, string? threadId = null, CancellationToken ct = default)
    {
        return RespondAsync(userMessage, threadId, null, ct);
    }

    /// <summary>
    /// Processes a user message with an optional persona override and generates an AI response.
    /// </summary>
    /// <param name="userMessage">The message from the user to send to the AI.</param>
    /// <param name="threadId">The conversation thread ID.</param>
    /// <param name="personaOverride">
    /// Optional runtime persona override.
    /// Null leaves existing thread persona unchanged.
    /// Empty string clears existing thread persona for this thread.
    /// </param>
    /// <param name="ct">Cancellation token to cancel the async operation.</param>
    /// <returns>The assistant response turn.</returns>
    public async Task<ChatTurn> RespondAsync(string userMessage, string? threadId, string? personaOverride, CancellationToken ct = default)
    {
        if(threadId == null || !threadService.ThreadExists(threadId))
        {
            threadId = threadService.CreateThread();
        }

        var effectivePersona = ResolveAndPersistPersona(threadId, personaOverride);

        var getWidgets = AIFunctionFactory.Create(() =>
        {
            return widgetToolsProvider.GetTools();
        }, new AIFunctionFactoryOptions
        {
            Name = "get_widget_tools",
            Description = "Retrieves the available widgets for the chat session."
        });

        var chatOptions = new ChatOptions
        {
            Tools = [..aiToolsProvider.GetAITools(), getWidgets],
            ToolMode = ChatToolMode.Auto,
            AllowMultipleToolCalls = true,
            Instructions = BuildInstructions(effectivePersona)
        };

        var messages = threadService.AppendMessageToThread(threadId, new ChatTurn(ChatRole.User, userMessage, ThreadId: threadId));

        var aiMessages = await PrepareMessagesWithSummarizationAsync(messages, threadId, ct);

        var completion = await chat.GetResponseAsync(aiMessages, chatOptions, ct);

        var (content, widgets) = widgetHintParser.Parse(completion.Text);

        messages = threadService.AppendMessageToThread(threadId, new ChatTurn(ChatRole.Assistant, content, widgets, threadId));

        return messages.Turns[messages.Turns.Count - 1];
    }

    
    /// <summary>
    /// Streams the AI assistant's response to a user message, yielding incremental <see cref="ChatTurn"/> deltas as content is generated.
    /// </summary>
    /// <remarks>
    /// This method:
    /// 1. Validates or creates a conversation thread
    /// 2. Appends the user message to the thread history
    /// 3. Retrieves available widget tools from the tools provider
    /// 4. Sends the message to the AI chat client with widget tools enabled
    /// 5. Streams the AI response as it is generated, parsing widgets and content on the fly
    /// 6. Yields <see cref="ChatTurn"/> deltas for each update, and a final turn when complete
    /// 
    /// The AI model receives widget tool definitions allowing it to embed interactive widgets
    /// in its responses using the <c>&lt;widget&gt;...&lt;/widget&gt;</c> format.
    /// </remarks>
    /// <param name="userMessage">The message from the user to send to the AI.</param>
    /// <param name="threadId">
    /// The conversation thread ID. If null or non-existent, a new thread is created.
    /// </param>
    /// <param name="cancellationToken">Cancellation token to cancel the async operation.</param>
    /// <returns>
    /// An async stream of <see cref="ChatTurn"/> objects representing incremental assistant responses,
    /// with the final turn containing the complete response and any parsed widgets.
    /// </returns>
    /// <exception cref="OperationCanceledException">
    /// Thrown if the operation is cancelled via the cancellation token.
    /// </exception>
    public IAsyncEnumerable<ChatTurn> StreamResponseAsync(string userMessage, string? threadId, CancellationToken cancellationToken = default)
    {
        return StreamResponseAsync(userMessage, threadId, null, cancellationToken);
    }

    /// <summary>
    /// Streams the AI assistant response with an optional persona override.
    /// </summary>
    /// <param name="userMessage">The message from the user to send to the AI.</param>
    /// <param name="threadId">The conversation thread ID.</param>
    /// <param name="personaOverride">
    /// Optional runtime persona override.
    /// Null leaves existing thread persona unchanged.
    /// Empty string clears existing thread persona for this thread.
    /// </param>
    /// <param name="cancellationToken">Cancellation token to cancel the async operation.</param>
    /// <returns>An async stream of response turns.</returns>
    public async IAsyncEnumerable<ChatTurn> StreamResponseAsync(string userMessage, string? threadId, string? personaOverride, [EnumeratorCancellation]CancellationToken cancellationToken = default)
    {
        if (threadId == null || !threadService.ThreadExists(threadId))
        {
            threadId = threadService.CreateThread();
        }

        var effectivePersona = ResolveAndPersistPersona(threadId, personaOverride);

        var getWidgets = AIFunctionFactory.Create(() =>
        {
            return widgetToolsProvider.GetTools();
        }, new AIFunctionFactoryOptions
        {
            Name = "get_widget_tools",
            Description = "Retrieves the available widgets for the chat session."
        });

        var chatOptions = new ChatOptions
        {
            Tools = [.. aiToolsProvider.GetAITools(), getWidgets],
            ToolMode = ChatToolMode.Auto,
            AllowMultipleToolCalls = true,
            Instructions = BuildInstructions(effectivePersona)
        };

        var messages = threadService.AppendMessageToThread(threadId, new ChatTurn(ChatRole.User, userMessage, ThreadId: threadId));

        var aiMessages = await PrepareMessagesWithSummarizationAsync(messages, threadId, cancellationToken);

        string responseText = string.Empty;
        var chatWidgets = new List<ChatWidget>();
        await foreach(var responseUpdate in chat.GetStreamingResponseAsync(aiMessages, chatOptions, cancellationToken))
        {
            responseText += responseUpdate.Text;
            var (content, widgets) = widgetHintParser.Parse(responseText);
            responseText = content.Trim();
            if (widgets != null && widgets.Count > 0)
                chatWidgets.AddRange(widgets);
            yield return new StreamChatTurn(ChatRole.Assistant, widgetHintSanitizer.Sanitize(content), threadId, IsDelta: true);
        }

        messages = threadService.AppendMessageToThread(threadId, new ChatTurn(ChatRole.Assistant, responseText, chatWidgets, threadId));

        yield return messages.Turns[messages.Turns.Count - 1];
    }

    private string? ResolveAndPersistPersona(string threadId, string? personaOverride)
    {
        if (personaOverride is null)
        {
            return threadPersonaStore.GetPersona(threadId) ?? options.DefaultPersona;
        }

        var normalizedPersona = personaOverride.Trim();
        if (string.IsNullOrWhiteSpace(normalizedPersona))
        {
            threadPersonaStore.ClearPersona(threadId);
            return options.DefaultPersona;
        }

        threadPersonaStore.SetPersona(threadId, normalizedPersona);
        return normalizedPersona;
    }

    private string? BuildInstructions(string? effectivePersona)
    {
        var baseInstructions = instructionProvider.GetInstructions();
        if (string.IsNullOrWhiteSpace(effectivePersona))
        {
            return baseInstructions;
        }

        var personaInstructions = $"""
            Persona for this conversation:
            {effectivePersona}

            Always follow this persona while also following all system, safety, tool, and formatting constraints.
            """;

        if (string.IsNullOrWhiteSpace(baseInstructions))
        {
            return personaInstructions;
        }

        return $"{personaInstructions}\n\n{baseInstructions}";
    }

    /// <summary>
    /// Prepares AI messages with automatic summarization if needed.
    /// </summary>
    /// <remarks>
    /// This helper method:
    /// 1. Checks if summarization is enabled and threshold is exceeded
    /// 2. Generates summaries for older turns if needed
    /// 3. Returns AI messages with summaries prepended and recent turns in full
    /// 
    /// Used by both RespondAsync and StreamResponseAsync to avoid duplication.
    /// </remarks>
    /// <param name="messages">The full conversation history.</param>
    /// <param name="threadId">The conversation thread ID.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>AI messages ready to send to the chat client.</returns>
    private async Task<IReadOnlyList<Microsoft.Extensions.AI.ChatMessage>> PrepareMessagesWithSummarizationAsync(
        ChatMessages messages,
        string threadId,
        CancellationToken ct)
    {
        // Check if we need to summarize and manage context
        if (options.EnableAutoSummarization && messages.Turns.Count > options.SummarizationThreshold)
        {
            // Generate summary for older turns if needed
            var summaries = threadService.GetSummaries(threadId);
            var lastSummarizedIndex = summaries.Count > 0 ? summaries[^1].EndTurnIndex : -1;
            var turnsToSummarize = messages.Turns.Count - options.RecentTurnsToKeep;

            // Only create new summary if there are unsummarized turns
            if (turnsToSummarize > lastSummarizedIndex + 1)
            {
                var startIndex = lastSummarizedIndex + 1;
                var endIndex = turnsToSummarize - 1;
                var turnsForSummary = messages.Turns.Skip(startIndex).Take(endIndex - startIndex + 1).ToList();

                if (turnsForSummary.Count > 0)
                {
                    var summaryText = await historySummarizer.SummarizeAsync(turnsForSummary, ct);
                    
                    // Only store the summary if we actually received non-empty content.
                    // This avoids marking turns as summarized when the summarizer fails
                    // or returns an empty response, which would otherwise lose context.
                    if (!string.IsNullOrWhiteSpace(summaryText))
                    {
                        var summary = new ChatSummary(summaryText, startIndex, endIndex);
                        threadService.StoreSummary(threadId, summary);
                        summaries = threadService.GetSummaries(threadId);
                    }
                }
            }

            // Use summaries with recent turns
            return messages.ToAIMessages(options.RecentTurnsToKeep, summaries);
        }
        else
        {
            // Use default behavior without summarization
            return messages.ToAIMessages();
        }
    }

    /// <summary>
    /// Processes an action triggered by a widget and generates a response.
    /// </summary>
    /// <remarks>
    /// This method is called when a user interacts with a widget (e.g., clicks a button, submits a form).
    /// It:
    /// 1. Looks up the action metadata from the registry
    /// 2. Resolves the appropriate typed handler
    /// 3. Deserializes the payload to the correct type
    /// 4. Invokes the handler with type-safe parameters
    /// 5. Appends the response to thread history
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
    /// <param name="serviceProvider">The service provider for resolving dependencies.</param>
    /// <returns>
    /// A task that completes with a <see cref="ChatTurn"/> containing the action response
    /// with any resulting widgets.
    /// </returns>
    /// <exception cref="InvalidOperationException">
    /// Thrown if no handler is registered for the action.
    /// </exception>
    /// <exception cref="OperationCanceledException">
    /// Thrown if the operation is cancelled via the cancellation token.
    /// </exception>
    public async Task<ChatTurn> HandleActionAsync(
        string action,
        IReadOnlyDictionary<string, object?> payload,
        string threadId,
        IServiceProvider serviceProvider,
        CancellationToken ct = default)
    {
        // Get action metadata from registry
        var actionMetadata = actionRegistry.GetAction(action);
        if (actionMetadata == null)
        {
            // Fallback to legacy behavior if no registered action
            var content = $"Action '{action}' received with payload: {JsonSerializer.Serialize(payload)}";
            return await RespondAsync(content, threadId, ct);
        }

        // Resolve handler
        var handler = handlerResolver.ResolveHandler(action, serviceProvider) ?? throw new InvalidOperationException($"No handler registered for action: {action}");

        // Deserialize payload to correct type
        var payloadJson = JsonSerializer.Serialize(payload);
        object? typedPayload;

        try
        {
            typedPayload = JsonSerializer.Deserialize(payloadJson, actionMetadata.PayloadType, Serialization.Default);
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException($"Failed to deserialize payload for action '{action}'", ex);
        }

        // Invoke handler via reflection
        var handleMethod = handler.GetType()
            .GetMethods(BindingFlags.Public | BindingFlags.Instance)
            .FirstOrDefault(m => m.Name == "HandleActionAsync" && m.IsGenericMethodDefinition == false);

        if (handleMethod == null)
        {
            throw new InvalidOperationException($"Handler for action '{action}' does not have HandleActionAsync method");
        }

        var result = await (Task<ChatTurn>)handleMethod.Invoke(handler, [typedPayload, threadId, serviceProvider])!;

        // Append to thread history
        threadService.AppendMessageToThread(threadId, result);

        return result;
    }
}
