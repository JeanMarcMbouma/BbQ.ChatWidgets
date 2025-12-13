This design decision doc has been consolidated into `docs/design/README.md`.
# Context Windows Design Decision

## Problem

Long conversations consume many AI tokens, which:
- Increases costs
- Slows down responses
- Can exceed token limits
- Wastes context on old messages

## Solution

We use **context window limiting** to send only recent messages to the AI.

### How It Works

```
Thread History: 50 turns
    ?
Get Last 10 Turns ? Context Window (configurable)
    ?
Send to AI ? Only recent context
    ?
AI Responds ? Faster & Cheaper
```

### Example

```csharp
// Configuration
builder.Services.AddBbQChatWidgets(options =>
{
    options.ContextWindowSize = 10;  // Last 10 turns
});

// Usage
var history = await threadService
    .GetThreadHistoryAsync(threadId);

// Only last 10 turns sent to AI
var recentTurns = history.TakeLast(10);
var messages = BuildMessages(recentTurns);

var response = await chatClient.CompleteAsync(messages);
```

## Rationale

### Why Limit Context?
- **Cost** - Fewer tokens = lower costs
- **Speed** - Shorter context = faster responses
- **Focus** - AI focuses on recent conversation
- **Limits** - Respects API token limits

## Default Configuration

```csharp
public class BbQChatOptions
{
    public int ContextWindowSize { get; set; } = 10;
}
```

Default: 10 turns (5 user + 5 assistant messages)

## Token Calculation

Approximate tokens per turn:
- Average message: 50-100 tokens
- With 10 turns: 500-1000 tokens
- Plus system instructions: 1000-1500 total

## Trade-offs

### Advantages ?
- Lower costs
- Faster responses
- Respects token limits
- Focused context

### Disadvantages ?
- Loses early conversation context
- Can't reference very old messages
- May affect coherence
- Need to configure appropriately

## Customization

### Adjust Context Size

```csharp
builder.Services.AddBbQChatWidgets(options =>
{
    // Only keep last 5 turns
    options.ContextWindowSize = 5;
});
```

### Summary for Long Conversations

For conversations longer than context window, summarize:

```csharp
public class ContextWindowService
{
    public async Task<string> GenerateSummaryAsync(
        IEnumerable<ChatTurn> history)
    {
        var oldTurns = history.Take(
            history.Count() - ContextWindowSize);
        
        return await _summaryAI.SummarizeAsync(
            oldTurns);
    }
}
```

### Token-Based Limiting

Instead of turn count, limit by tokens:

```csharp
public class TokenBasedContextWindow
{
    public IEnumerable<ChatTurn> SelectContextTurns(
        IEnumerable<ChatTurn> history,
        int maxTokens)
    {
        var tokens = 0;
        var selected = new List<ChatTurn>();
        
        foreach (var turn in history.Reverse())
        {
            var turnTokens = EstimateTokens(turn);
            if (tokens + turnTokens > maxTokens)
                break;
            
            selected.Insert(0, turn);
            tokens += turnTokens;
        }
        
        return selected;
    }

    private int EstimateTokens(ChatTurn turn) =>
        turn.Content.Split().Length / 4;
}
```

## Monitoring

Track context window usage:

```csharp
_telemetry.TrackEvent("ContextWindow", 
    new Dictionary<string, string>
    {
        { "ThreadId", threadId },
        { "TurnsUsed", contextTurns.Count().ToString() },
        { "TokensEstimated", EstimateTokens().ToString() }
    });
```

## Best Practices

1. **Start Small** - Begin with small context window
2. **Monitor Costs** - Track token usage
3. **Test Quality** - Ensure responses are coherent
4. **Adjust** - Increase if needed
5. **Document** - Note your chosen window size

## Related Documents

- **[THREAD_MANAGEMENT.md](THREAD_MANAGEMENT.md)** - Thread storage
- **[ARCHITECTURE.md](../ARCHITECTURE.md)** - System design
- **[guides/CONFIGURATION.md](../guides/CONFIGURATION.md)** - Configuration

---

**Back to:** [Design Decisions](README.md)
