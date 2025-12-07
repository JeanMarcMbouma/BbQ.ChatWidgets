# Thread Management Design Decision

## Problem

AI conversations need to:
- Maintain history across multiple turns
- Keep context for coherent responses
- Support concurrent conversations
- Limit token usage

## Solution

We use **Thread-based conversation management** with in-memory storage (pluggable).

### Thread Structure

```csharp
public interface IThreadService
{
    Task<ThreadData> CreateThreadAsync();
    Task<bool> ThreadExistsAsync(string threadId);
    Task AppendMessageToThreadAsync(
        string threadId,
        ChatTurn turn);
    Task<IEnumerable<ChatTurn>> GetThreadHistoryAsync(
        string threadId);
}
```

### How It Works

1. **Thread Creation** - Each conversation gets unique ID
2. **Message Storage** - All turns stored in order
3. **Context Retrieval** - Get last N messages for AI
4. **Isolation** - Threads don't interfere

## Example

```
ThreadId: "thread-abc-123"

— Turn 1: User — "Hello"
— Turn 2: Assistant — "Hi! How can I help?"
— Turn 3: User — "What are widgets?"
— Turn 4: Assistant — "Widgets are..." + ButtonWidget
— Turn 5: User — (clicks widget) "submit_action"
```

## Rationale

### Why Thread-Based?
- **Isolation** - Each conversation separate
- **Scalability** - Supports many concurrent conversations
- **Simplicity** - Easy to understand and implement
- **Flexibility** - Pluggable storage backend

## Storage Options

### Default: In-Memory
```csharp
services.AddScoped<IThreadService, InMemoryThreadService>();
```

Pros: Simple, fast  
Cons: Lost on restart

### Database
```csharp
services.AddScoped<IThreadService, DatabaseThreadService>();
```

Pros: Persistent, recoverable  
Cons: Slower, requires DB

### Redis
```csharp
services.AddScoped<IThreadService, RedisThreadService>();
```

Pros: Fast, persistent  
Cons: Requires Redis

## Trade-offs

### Advantages ?
- Thread isolation
- Easy to implement custom storage
- Clear message ordering
- Supports concurrent users

### Disadvantages ?
- Storage must be provided for persistence
- Memory usage grows with conversations
- Need cleanup strategy

## Custom Implementation

```csharp
public class DatabaseThreadService : IThreadService
{
    private readonly AppDbContext _db;

    public async Task<ThreadData> CreateThreadAsync()
    {
        var thread = new Thread
        {
            Id = Guid.NewGuid().ToString(),
            CreatedAt = DateTime.UtcNow
        };
        _db.Threads.Add(thread);
        await _db.SaveChangesAsync();
        return MapToThreadData(thread);
    }

    public async Task AppendMessageToThreadAsync(
        string threadId,
        ChatTurn turn)
    {
        var message = new Message
        {
            ThreadId = threadId,
            Role = turn.Role,
            Content = turn.Content,
            CreatedAt = DateTime.UtcNow
        };
        _db.Messages.Add(message);
        await _db.SaveChangesAsync();
    }
}
```

## Context Window Integration

Threads work with context windows to limit tokens:

```csharp
// Get last 10 turns for AI context
var history = await threadService
    .GetThreadHistoryAsync(threadId);
var contextTurns = history.TakeLast(10);

// Send to AI with context
var response = await chatClient.CompleteAsync(
    messages: BuildMessages(contextTurns),
    tools: tools);
```

## Cleanup Strategy

Old threads should be cleaned periodically:

```csharp
public class ThreadCleanupService
{
    public async Task CleanupOldThreadsAsync(
        TimeSpan maxAge)
    {
        var cutoff = DateTime.UtcNow - maxAge;
        var oldThreads = await _db.Threads
            .Where(t => t.CreatedAt < cutoff)
            .ToListAsync();
        
        _db.Threads.RemoveRange(oldThreads);
        await _db.SaveChangesAsync();
    }
}
```

## Related Documents

- **[CONTEXT_WINDOWS.md](CONTEXT_WINDOWS.md)** - Token limiting
- **[guides/CONFIGURATION.md](../guides/CONFIGURATION.md)** - Configuration
- **[examples/](../examples/)** - Implementation examples

---

**Back to:** [Design Decisions](README.md)
