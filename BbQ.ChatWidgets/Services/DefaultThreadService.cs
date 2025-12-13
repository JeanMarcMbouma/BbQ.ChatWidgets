using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Exceptions;
using BbQ.ChatWidgets.Models;
using System.Collections.Concurrent;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// In-memory implementation of <see cref="IThreadService"/>.
/// </summary>
/// <remarks>
/// This implementation stores all conversation threads in memory using a <see cref="ConcurrentDictionary"/>.
/// It is suitable for:
/// - Development and testing
/// - Single-server deployments with acceptable memory usage
/// - Short-lived conversations that don't require persistence
///
/// For production deployments requiring persistence across restarts or distributed systems,
/// implement a custom <see cref="IThreadService"/> that stores threads in a database.
///
/// Features:
/// - Thread-safe concurrent access
/// - Automatic widget recycling for recyclable widgets
/// - Fast O(1) thread lookup
/// - Memory-based storage (data is lost on restart)
/// </remarks>
public sealed class DefaultThreadService : IThreadService
{
    private readonly ConcurrentDictionary<string, ChatMessages> _threads = new();

    /// <summary>
    /// Appends a message to an existing conversation thread and handles widget recycling.
    /// </summary>
    /// <remarks>
    /// This method:
    /// 1. Looks up the thread by ID
    /// 2. Creates a new ChatMessages with the appended turn
    /// 3. Recycles any <see cref="IRecyclableWidget"/> instances
    /// 4. Updates the thread with the new messages
    ///
    /// Recyclable widgets are cleaned up after being added to the history, allowing
    /// widgets to perform cleanup operations like freeing resources or logging.
    /// </remarks>
    /// <param name="threadId">The conversation thread identifier.</param>
    /// <param name="chatTurn">The message turn to append to the thread.</param>
    /// <returns>The updated <see cref="ChatMessages"/> with the new turn included.</returns>
    /// <exception cref="ThreadNotFoundException">Thrown if the thread does not exist.</exception>
    public ChatMessages AppendMessageToThread(string threadId, ChatTurn chatTurn)
    {
        if (_threads.TryGetValue(threadId, out var chatMessage))
        {
            _threads[threadId] = new ChatMessages([..chatMessage.Turns.Append(chatTurn)]);
            if(chatTurn.Widgets?.Any(x => x is IRecyclableWidget) == true)
            {
                foreach (var widget in chatTurn.Widgets)
                {
                    if (widget is IRecyclableWidget recyclableWidget)
                    {
                        recyclableWidget.Recycle();
                    }
                }
            }
            return _threads[threadId];
        }
        else
        {
            throw new ThreadNotFoundException(threadId);
        }
    }

    /// <summary>
    /// Creates a new conversation thread with a unique identifier.
    /// </summary>
    /// <remarks>
    /// The thread is initialized with an empty message history. Multiple CreateThread calls
    /// will create separate threads with different identifiers.
    /// </remarks>
    /// <returns>A unique thread identifier as a hexadecimal string (GUID without hyphens).</returns>
    public string CreateThread()
    {
        string threadId = Guid.NewGuid().ToString("N");
        _threads[threadId] = new ChatMessages([]);
        return threadId;
    }

    /// <summary>
    /// Deletes a conversation thread and all its associated message history.
    /// </summary>
    /// <remarks>
    /// Once deleted, the thread is no longer accessible. The thread ID may be reused by
    /// <see cref="CreateThread"/> if needed. This operation is safe to call on non-existent threads.
    /// </remarks>
    /// <param name="threadId">The conversation thread identifier.</param>
    public void DeleteThread(string threadId)
    {
        _threads.TryRemove(threadId, out _);
    }

    /// <summary>
    /// Retrieves the complete message history of a conversation thread.
    /// </summary>
    /// <remarks>
    /// Returns all messages in the conversation, ordered from oldest to newest.
    /// Both user and assistant messages are included.
    /// </remarks>
    /// <param name="threadId">The conversation thread identifier.</param>
    /// <returns>A <see cref="ChatMessages"/> object containing all turns in the thread.</returns>
    /// <exception cref="ThreadNotFoundException">Thrown if the thread does not exist.</exception>
    public ChatMessages GetMessage(string threadId)
    {
        if (_threads.TryGetValue(threadId, out var chatMessage))
        {
            return chatMessage;
        }

        throw new ThreadNotFoundException(threadId);
    }

    /// <summary>
    /// Checks if a conversation thread exists.
    /// </summary>
    /// <param name="threadId">The conversation thread identifier.</param>
    /// <returns>True if the thread exists; false otherwise.</returns>
    public bool ThreadExists(string threadId)
    {
        return _threads.ContainsKey(threadId);
    }
}