namespace BbQ.ChatWidgets.Exceptions
{
    public class ThreadNotFoundException(string threadId) : Exception($"Thread with ID '{threadId}' not found.")
    {
        public string ThreadId { get; } = threadId;
    }
}
