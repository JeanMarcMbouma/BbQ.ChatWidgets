namespace BbQ.ChatWidgets.Exceptions
{
    /// <summary>
    /// Thrown when a conversation thread with the specified ID is not found.
    /// </summary>
    /// <remarks>
    /// This exception is raised when attempting to access, modify, or delete a conversation thread
    /// that does not exist in the thread service. Common causes include:
    /// - Using an invalid or expired thread ID
    /// - Thread was previously deleted
    /// - Thread ID is from a different environment or service instance
    /// </remarks>
    public class ThreadNotFoundException(string threadId) : Exception($"Thread with ID '{threadId}' not found.")
    {
        /// <summary>
        /// Gets the thread ID that was not found.
        /// </summary>
        public string ThreadId { get; } = threadId;
    }
}
