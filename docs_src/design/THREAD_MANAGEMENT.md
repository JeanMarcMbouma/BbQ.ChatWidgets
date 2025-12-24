# Thread Management

`IThreadService` keeps track of multiple conversations and helps you append messages or look up threads by ID.

## Chat History Summarization

The thread service now includes support for chat history summarization to manage context window limits:

- **Store Summaries**: `StoreSummary(threadId, summary)` stores a summary for a range of conversation turns
- **Retrieve Summaries**: `GetSummaries(threadId)` retrieves all summaries for a thread
- **Automatic Management**: `ChatWidgetService` automatically creates summaries when conversations exceed thresholds

For detailed information on summarization, see the [Chat History Summarization Guide](../guides/CHAT_HISTORY_SUMMARIZATION.md).
