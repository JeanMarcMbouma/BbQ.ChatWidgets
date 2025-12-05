using BbQ.ChatWidgets.Abstractions;
using Microsoft.Extensions.AI;
using System;
using System.Threading;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// A decorator for <see cref="IChatClient"/> that automatically parses widget hints from AI responses.
/// </summary>
/// <remarks>
/// This implementation wraps an existing chat client and intercepts responses to extract
/// embedded widget definitions using an <see cref="IWidgetHintParser"/>.
/// 
/// The decorator pattern allows transparent widget parsing without modifying the underlying
/// chat client. When a response is received:
/// 1. The raw response text is parsed for widget markers
/// 2. Widget definitions are extracted and deserialized
/// 3. Only the clean content (without widget markers) is returned
/// 4. The caller receives a response with widget-free text
/// 
/// This is useful for chat client implementations that don't natively support widget parsing.
/// </remarks>
sealed class WidgetAwareChatClient(IChatClient chat, IWidgetHintParser hintParser) : IChatClient
{
    /// <summary>
    /// Releases all resources used by the underlying chat client.
    /// </summary>
    public void Dispose()
    {
        chat.Dispose();
    }

    /// <summary>
    /// Gets a response from the AI chat client and automatically parses widget hints from the output.
    /// </summary>
    /// <remarks>
    /// This method:
    /// 1. Sends the messages to the underlying chat client
    /// 2. Receives the raw response (which may contain widget markers)
    /// 3. Parses the response to extract widget definitions
    /// 4. Returns a response with only the clean content (widgets removed)
    /// 
    /// Widget information is extracted but not returned here; callers should use
    /// <see cref="ChatWidgetService"/> which handles widget extraction and storage.
    /// </remarks>
    /// <param name="messages">The chat message history to send to the AI.</param>
    /// <param name="options">Optional chat options for controlling AI behavior.</param>
    /// <param name="cancellationToken">Cancellation token to cancel the async operation.</param>
    /// <returns>
    /// A task that completes with a <see cref="ChatResponse"/> containing only the clean content
    /// (with widget markers removed).
    /// </returns>
    public async Task<ChatResponse> GetResponseAsync(IEnumerable<Microsoft.Extensions.AI.ChatMessage> messages, ChatOptions? options = null, CancellationToken cancellationToken = default)
    {
        ChatResponse completion = await chat.GetResponseAsync<string>(messages, options, cancellationToken: cancellationToken);
        var (content, _) = hintParser.Parse(completion.Text);
        return new ChatResponse(new Microsoft.Extensions.AI.ChatMessage(ChatRole.Assistant, content));
    }

    /// <summary>
    /// Returns a service instance from the underlying chat client.
    /// </summary>
    /// <remarks>
    /// This method delegates directly to the underlying chat client to retrieve service instances,
    /// allowing access to any specialized services the client provides.
    /// </remarks>
    /// <param name="serviceType">The type of service to retrieve.</param>
    /// <param name="serviceKey">An optional key to identify a specific service instance.</param>
    /// <returns>
    /// The service instance of the requested type, or null if not available.
    /// </returns>
    public object? GetService(Type serviceType, object? serviceKey = null)
    {
        return chat.GetService(serviceType, serviceKey);
    }

    /// <summary>
    /// Gets a streaming response from the underlying chat client.
    /// </summary>
    /// <remarks>
    /// Streaming responses are delegated directly to the underlying client without widget parsing.
    /// The caller is responsible for handling widget parsing if needed in streaming scenarios.
    /// </remarks>
    /// <param name="messages">The chat message history for streaming.</param>
    /// <param name="options">Optional chat options for controlling AI behavior.</param>
    /// <param name="cancellationToken">Cancellation token to cancel the async operation.</param>
    /// <returns>
    /// An asynchronous enumerable of <see cref="ChatResponseUpdate"/> objects from the stream.
    /// </returns>
    public IAsyncEnumerable<ChatResponseUpdate> GetStreamingResponseAsync(IEnumerable<Microsoft.Extensions.AI.ChatMessage> messages, ChatOptions? options = null, CancellationToken cancellationToken = default)
    {
        return chat.GetStreamingResponseAsync(messages, options, cancellationToken);
    }
}
