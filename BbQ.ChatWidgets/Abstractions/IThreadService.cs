using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Abstractions;

/// <summary>
/// Defines the contract for managing conversation threads and message history.
/// </summary>
/// <remarks>
/// Thread services maintain the state of multi-turn conversations. Each thread represents
/// a separate conversation with its own message history. The service provides methods for:
/// - Creating new conversations
/// - Storing and retrieving messages
/// - Checking thread existence
/// - Cleaning up old threads
///
/// The default implementation stores threads in memory. For production applications,
/// consider implementing a custom service that persists to a database.
/// </remarks>
public interface IThreadService
{
    /// <summary>
    /// Deletes a conversation thread and all its message history.
    /// </summary>
    /// <remarks>
    /// This operation removes the thread permanently. Once deleted, the thread ID
    /// can be reused for a new conversation.
    /// </remarks>
    /// <param name="threadId">The unique identifier of the thread to delete.</param>
    void DeleteThread(string threadId);

    /// <summary>
    /// Creates a new conversation thread.
    /// </summary>
    /// <remarks>
    /// Each thread has a unique identifier that can be used to retrieve and update
    /// its message history. Threads start empty with no messages.
    /// </remarks>
    /// <returns>A unique thread identifier for the newly created conversation.</returns>
    string CreateThread();

    /// <summary>
    /// Checks if a conversation thread exists.
    /// </summary>
    /// <param name="threadId">The thread identifier to check.</param>
    /// <returns>True if the thread exists; false otherwise.</returns>
    bool ThreadExists(string threadId);

    /// <summary>
    /// Appends a message to a conversation thread's history.
    /// </summary>
    /// <remarks>
    /// This method adds a new turn (message) to the specified thread's conversation history.
    /// The message is stored with its role (User or Assistant), content, and any embedded widgets.
    /// </remarks>
    /// <param name="threadId">The thread identifier.</param>
    /// <param name="chatTurn">The message to append to the thread.</param>
    /// <returns>The updated <see cref="ChatMessages"/> containing all turns including the newly appended one.</returns>
    /// <exception cref="Exceptions.ThreadNotFoundException">Thrown if the thread does not exist.</exception>
    ChatMessages AppendMessageToThread(string threadId, ChatTurn chatTurn);

    /// <summary>
    /// Retrieves the complete message history of a conversation thread.
    /// </summary>
    /// <remarks>
    /// Returns all messages in the thread, including both user messages and assistant responses.
    /// The messages are returned in order of insertion (oldest to newest).
    /// </remarks>
    /// <param name="threadId">The thread identifier.</param>
    /// <returns>A <see cref="ChatMessages"/> object containing all turns in the thread.</returns>
    /// <exception cref="Exceptions.ThreadNotFoundException">Thrown if the thread does not exist.</exception>
    ChatMessages GetMessage(string threadId);

    /// <summary>
    /// Stores a summary of conversation turns for the specified thread.
    /// </summary>
    /// <remarks>
    /// Summaries help manage context window limits by condensing older conversation
    /// history into concise text. Multiple summaries can be stored for a thread,
    /// each covering a different range of turns.
    /// </remarks>
    /// <param name="threadId">The thread identifier.</param>
    /// <param name="summary">The summary to store.</param>
    /// <exception cref="Exceptions.ThreadNotFoundException">Thrown if the thread does not exist.</exception>
    void StoreSummary(string threadId, ChatSummary summary);

    /// <summary>
    /// Retrieves all summaries for a conversation thread.
    /// </summary>
    /// <remarks>
    /// Returns summaries in the order they were created, each covering a specific
    /// range of conversation turns.
    /// </remarks>
    /// <param name="threadId">The thread identifier.</param>
    /// <returns>A read-only list of summaries for the thread.</returns>
    /// <exception cref="Exceptions.ThreadNotFoundException">Thrown if the thread does not exist.</exception>
    IReadOnlyList<ChatSummary> GetSummaries(string threadId);
}