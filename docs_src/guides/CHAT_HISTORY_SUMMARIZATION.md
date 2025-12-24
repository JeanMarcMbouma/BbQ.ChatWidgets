# Chat History Summarization

BbQ.ChatWidgets includes automatic chat history summarization to manage context window limits efficiently. This feature helps maintain relevant conversation context while staying within token budget constraints.

## Overview

When conversations grow long, sending the entire history to the AI model can:
- Exceed token limits
- Increase API costs
- Slow down response times
- Include irrelevant older context

The summarization feature automatically condenses older conversation turns into concise summaries while keeping recent turns in full detail.

## How It Works

The system uses a three-part strategy:

1. **Threshold Detection**: Monitors the number of conversation turns
2. **Smart Summarization**: Creates summaries of older turns when the threshold is exceeded
3. **Context Management**: Sends summaries + recent turns to the AI model

### Architecture

```
Full Conversation History
├── Turns 0-4    → Summarized → "User discussed X, decided Y"
├── Turns 5-9    → Summarized → "Conversation moved to topic Z"
└── Turns 10-11  → Kept in full detail

Sent to AI:
├── System Message: Combined summaries
└── Recent Turns: Full detail of turns 10-11
```

## Configuration

Configure summarization in your `AddBbQChatWidgets` setup:

```csharp
services.AddBbQChatWidgets(options =>
{
    // Enable/disable automatic summarization (default: true)
    options.EnableAutoSummarization = true;
    
    // Trigger summarization after this many turns (default: 15)
    options.SummarizationThreshold = 15;
    
    // Keep this many recent turns in full detail (default: 10)
    options.RecentTurnsToKeep = 10;
    
    // Your chat client
    options.ChatClientFactory = sp => new OpenAIChatClient(...);
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `EnableAutoSummarization` | `bool` | `true` | Enables/disables automatic summarization |
| `SummarizationThreshold` | `int` | `15` | Number of turns before summarization kicks in |
| `RecentTurnsToKeep` | `int` | `10` | Number of recent turns to keep unsummarized |

## How Summaries Are Generated

The `DefaultChatHistorySummarizer` uses your configured AI client to generate summaries:

1. Formats older conversation turns into a readable format
2. Sends them to the AI with a specialized summarization prompt
3. Receives a concise summary (2-4 sentences)
4. Stores the summary with the thread

The summarization prompt instructs the AI to focus on:
- Main topics discussed
- Important decisions or conclusions
- Key information needed for context
- Action items or pending questions

## Custom Summarization

You can implement custom summarization logic by creating your own `IChatHistorySummarizer`:

```csharp
public class CustomSummarizer : IChatHistorySummarizer
{
    public async Task<string> SummarizeAsync(
        IReadOnlyList<ChatTurn> turns, 
        CancellationToken ct = default)
    {
        // Your custom summarization logic
        // Could use:
        // - A different AI model
        // - Template-based summarization
        // - Custom business rules
        // - Database lookups
        
        return "Custom summary...";
    }
}

// Register your custom summarizer
services.AddSingleton<IChatHistorySummarizer, CustomSummarizer>();
```

## Thread Service Integration

The `IThreadService` interface includes methods for managing summaries:

```csharp
public interface IThreadService
{
    // Existing methods...
    
    // Store a summary for a thread
    void StoreSummary(string threadId, ChatSummary summary);
    
    // Retrieve all summaries for a thread
    IReadOnlyList<ChatSummary> GetSummaries(string threadId);
}
```

The `DefaultThreadService` stores summaries in memory. For production use, implement a persistent `IThreadService` that stores summaries alongside conversation history.

## Example: Long Conversation

```csharp
var chatService = serviceProvider.GetRequiredService<ChatWidgetService>();
string? threadId = null;

// User has a long conversation (20+ turns)
for (int i = 0; i < 20; i++)
{
    var response = await chatService.RespondAsync($"Message {i}", threadId);
    threadId = response.ThreadId;
}

// Check if summaries were created
var threadService = serviceProvider.GetRequiredService<IThreadService>();
var summaries = threadService.GetSummaries(threadId);

Console.WriteLine($"Created {summaries.Count} summaries");
foreach (var summary in summaries)
{
    Console.WriteLine($"Turns {summary.StartTurnIndex}-{summary.EndTurnIndex}: {summary.SummaryText}");
}
```

## Performance Considerations

### When to Use Summarization

✅ **Good for:**
- Long-running support conversations
- Multi-session interactions
- Complex problem-solving discussions
- Customer service chat histories

❌ **Not needed for:**
- Short Q&A exchanges
- Single-turn requests
- API-only interactions
- When using small context windows intentionally

### Optimization Tips

1. **Adjust Thresholds**: Set higher thresholds for simpler conversations
2. **Cache Summaries**: Implement caching in custom `IThreadService`
3. **Use Cheaper Models**: Configure a cost-effective model for summarization
4. **Batch Processing**: Summarize multiple turn ranges at once if needed

## Testing Summarization

The library includes comprehensive tests for summarization:

```csharp
// Unit tests
dotnet test --filter "ChatHistorySummarizationTests"

// Integration tests
dotnet test --filter "SummarizationIntegrationTests"
```

Example test:

```csharp
[Fact]
public async Task AutoSummarization_CreatesAndUsesSummaries()
{
    var services = new ServiceCollection();
    
    services.AddBbQChatWidgets(options =>
    {
        options.EnableAutoSummarization = true;
        options.SummarizationThreshold = 5;
        options.RecentTurnsToKeep = 2;
        options.ChatClientFactory = _ => new TestChatClient();
    });
    
    var chatService = serviceProvider.GetRequiredService<ChatWidgetService>();
    
    // Create conversation beyond threshold
    string? threadId = null;
    for (int i = 0; i < 6; i++)
    {
        threadId = (await chatService.RespondAsync($"Message {i}", threadId)).ThreadId;
    }
    
    // Verify summaries were created
    var summaries = threadService.GetSummaries(threadId);
    Assert.NotEmpty(summaries);
}
```

## Best Practices

1. **Set Appropriate Thresholds**: Balance context preservation with token usage
2. **Monitor Summary Quality**: Periodically review generated summaries
3. **Persist Summaries**: Store summaries in production for consistency
4. **Consider User Experience**: Ensure summaries maintain conversation coherence
5. **Test Edge Cases**: Verify behavior with very short and very long conversations

## Troubleshooting

### Summaries Not Being Created

Check:
- `EnableAutoSummarization` is `true`
- Conversation has exceeded `SummarizationThreshold`
- Chat client is properly configured
- No exceptions in summarization logic

### Poor Summary Quality

Try:
- Adjusting the summarization prompt in `DefaultChatHistorySummarizer`
- Using a more capable AI model for summarization
- Implementing custom summarization logic
- Tuning the temperature/parameters for the summarization call

### Performance Issues

Consider:
- Increasing `SummarizationThreshold` to summarize less frequently
- Using a faster/cheaper model for summarization
- Implementing async summarization in background
- Caching summaries to avoid regeneration

## API Reference

See the API documentation for detailed reference:

- [`IChatHistorySummarizer`](../api/abstractions/README.md)
- [`ChatSummary`](../api/models/README.md)
- [`BbQChatOptions`](../api/abstractions/README.md)
- [`IThreadService`](../api/abstractions/README.md)

## Related Topics

- [Architecture Overview](ARCHITECTURE.md)
- [Thread Management](design/THREAD_MANAGEMENT.md)
- [Getting Started](GETTING_STARTED.md)
