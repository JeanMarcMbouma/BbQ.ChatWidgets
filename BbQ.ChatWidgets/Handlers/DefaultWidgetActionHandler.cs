using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Models;
using Microsoft.Extensions.AI;

namespace BbQ.ChatWidgets.Handlers
{
    /// <summary>
    /// Default implementation of <see cref="IWidgetActionHandler"/> that processes widget actions.
    /// </summary>
    /// <remarks>
    /// This handler processes actions triggered by user interactions with widgets.
    /// It:
    /// - Converts the action to a user message
    /// - Appends it to the thread history
    /// - Sends it to the AI chat client for processing
    /// - Returns the AI response with any embedded widgets
    /// 
    /// Special handling:
    /// - "retry" action: Retries the last request
    /// - Other actions: Serializes action and payload as a message
    /// 
    /// This default handler is suitable for simple action processing.
    /// For complex scenarios, provide a custom implementation via
    /// <see cref="BbQChatOptions.ActionHandlerFactory"/>.
    /// </remarks>
    internal class DefaultWidgetActionHandler(
        /// <summary>
        /// The AI chat client for generating responses.
        /// </summary>
        IChatClient chat, 
        
        /// <summary>
        /// The thread service for managing conversation history.
        /// </summary>
        IThreadService threadService) : IWidgetActionHandler
    {
        /// <summary>
        /// Handles a widget action by processing it with the AI chat client.
        /// </summary>
        /// <remarks>
        /// This method:
        /// 1. Converts the action to a user message
        /// 2. Appends the action to the thread history
        /// 3. Sends the updated history to the AI chat client
        /// 4. Returns the AI response with parsed widgets
        /// 
        /// The action is converted to a message in the format:
        /// - "retry" action: "Retrying the last request..."
        /// - Other actions: "Action 'action_id' received with payload: {...}"
        /// </remarks>
        /// <param name="action">The action identifier from the widget.</param>
        /// <param name="payload">The action payload (e.g., form data, selected values).</param>
        /// <param name="threadId">The conversation thread ID.</param>
        /// <param name="ct">Cancellation token to cancel the operation.</param>
        /// <returns>
        /// A task that completes with the AI's response as a <see cref="ChatTurn"/>.
        /// </returns>
        public async Task<ChatTurn> HandleAsync(string action, IReadOnlyDictionary<string, object?> payload, string threadId, CancellationToken ct = default)
        {
            var content = action switch
            {
                "retry" => "Retrying the last request...",
                _ => $"Action '{action}' received with payload: {System.Text.Json.JsonSerializer.Serialize(payload)}"
            };

            var messages = threadService.AppendMessageToThread(threadId, new ChatTurn(ChatRole.User, content, ThreadId: threadId));
            
            var chatOptions = new ChatOptions
            {
                ToolMode = ChatToolMode.Auto,
                AllowMultipleToolCalls = true
            };

            var completion = await chat.GetResponseAsync<BbQStructuredResponse>(messages.ToAIMessages(), chatOptions, cancellationToken: ct);
            var (text, widgets) = completion.Result;
            return new ChatTurn(ChatRole.Assistant, text, Widgets: widgets, ThreadId: threadId);
        }
    }
}
