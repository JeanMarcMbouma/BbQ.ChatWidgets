# Triage Agent Quick Start

Get up and running with the triage agent system in 5 minutes.

## What You Get

- ? Automatic intent classification
- ? Intelligent request routing
- ? Agent-to-agent communication
- ? Extensible architecture
- ? Error handling and fallbacks

## Basic Setup

### 1. Register Triage System

```csharp
// Program.cs
services.AddTriageAgentSystem();
```

This automatically registers:
- Intent classifier
- Agent registry
- Specialized agents (Help, DataQuery, Action, Feedback)
- Triage agent

### 2. Get Dependencies

```csharp
var serviceProvider = services.BuildServiceProvider();
var triageAgent = serviceProvider.GetRequiredService<TriageAgent<UserIntent>>();
var conversationManager = serviceProvider.GetRequiredService<ConversationManager>();
```

### 3. Process Messages

```csharp
// Create request with user message
var request = new ChatRequest(
    ThreadId: threadId,
    RequestServices: serviceProvider,
    Metadata: new Dictionary<string, object> 
    { 
        { "UserMessage", "I need help resetting my password" }
    }
);

// Let triage agent classify and route
var outcome = await triageAgent.InvokeAsync(request, CancellationToken.None);

if (outcome.IsSuccessful)
{
    // Get classification info
    var classification = InterAgentCommunicationContext.GetClassification<UserIntent>(request);
    var routedAgent = InterAgentCommunicationContext.GetRoutedAgent(request);
    
    Console.WriteLine($"Intent: {classification}");
    Console.WriteLine($"Agent: {routedAgent}");
    Console.WriteLine($"Response: {outcome.Result.Content}");
}
```

## Running the Sample

```bash
# Navigate to sample
cd BbQ.ChatWidgets.Sample

# Set up user secrets (one-time)
dotnet user-secrets init
dotnet user-secrets set "OpenAI:ApiKey" "sk-your-key-here"
dotnet user-secrets set "OpenAI:ModelId" "gpt-4o-mini"

# Run
dotnet run
```

### Interactive Commands

```
You: help, I'm locked out
Assistant: [HelpRequest classified, routed to help-agent]
Response: I'm here to help! You asked: 'help, I'm locked out'...

You: show me last month's sales
Assistant: [DataQuery classified, routed to data-query-agent]
Response: I found your data query...

You: delete this order
Assistant: [ActionRequest classified, routed to action-agent]
Response: I'm processing your action request...
[Confirm] [Cancel]

You: history
[Shows conversation history]

You: exit
```

## Intent Categories

| Intent | Description | Routed Agent |
|--------|-------------|--------------|
| `HelpRequest` | User asking for help or support | help-agent |
| `DataQuery` | User asking for information or data | data-query-agent |
| `ActionRequest` | User requesting an action be performed | action-agent |
| `Feedback` | User providing feedback or suggestions | feedback-agent |
| `Unknown` | Intent could not be determined | help-agent (fallback) |

## Customization

### Custom Intent Category

```csharp
public enum MyCustomIntent
{
    Billing,
    Technical,
    Sales,
    Unknown
}

public class MyCustomClassifier : IClassifier<MyCustomIntent>
{
    public async Task<MyCustomIntent> ClassifyAsync(string input, CancellationToken ct)
    {
        // Your classification logic
    }
}

services.AddScoped<IClassifier<MyCustomIntent>, MyCustomClassifier>();
```

### Custom Agent

```csharp
public sealed class BillingAgent : IAgent
{
    public async Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken ct)
    {
        var message = InterAgentCommunicationContext.GetUserMessage(request);
        
        return Outcome<ChatTurn>.From(new ChatTurn(
            ChatRole.Assistant,
            $"Billing agent: Processing '{message}'",
            [],
            request.ThreadId ?? "unknown"
        ));
    }
}

registry.Register("billing-agent", new BillingAgent());
```

## API Reference

### InterAgentCommunicationContext

Store and retrieve data between agents:

```csharp
// Classification
InterAgentCommunicationContext.SetClassification(request, UserIntent.DataQuery);
var intent = InterAgentCommunicationContext.GetClassification<UserIntent>(request);

// User message
InterAgentCommunicationContext.SetUserMessage(request, "user input");
var message = InterAgentCommunicationContext.GetUserMessage(request);

// Routed agent
InterAgentCommunicationContext.SetRoutedAgent(request, "data-query-agent");
var agent = InterAgentCommunicationContext.GetRoutedAgent(request);

// Previous result
InterAgentCommunicationContext.SetPreviousResult(request, someData);
var previous = InterAgentCommunicationContext.GetPreviousResult(request);
```

### IAgentRegistry

Manage agents:

```csharp
var registry = serviceProvider.GetRequiredService<IAgentRegistry>();

// Register
registry.Register("my-agent", new MyAgent());

// Retrieve
var agent = registry.GetAgent("my-agent");

// Check existence
if (registry.HasAgent("my-agent"))
{
    // ...
}

// List all
var agents = registry.GetRegisteredAgents();
```

### TriageAgent<TCategory>

Route requests:

```csharp
var triageAgent = serviceProvider.GetRequiredService<TriageAgent<UserIntent>>();

var request = new ChatRequest(threadId, serviceProvider, metadata);
var outcome = await triageAgent.InvokeAsync(request, cancellationToken);

if (outcome.IsSuccessful)
{
    var result = outcome.Result; // ChatTurn
}
else
{
    var error = outcome.Error; // AgentRoutingException
}
```

## Common Patterns

### Multi-Step Workflow

```csharp
// Step 1: User sends request
"I want to buy a widget"

// Step 2: Classifier detects ActionRequest
// Step 3: Routes to ActionAgent

// Step 4: ActionAgent shows confirmation
[Confirm Purchase] [Cancel]

// Step 5: User clicks "Confirm"
// Metadata updated with confirmation

// Step 6: ChainedAgent processes confirmation
// Completes the purchase
```

### Dynamic Agent Selection

```csharp
Func<UserIntent, string?> mapping = intent => intent switch
{
    UserIntent.HelpRequest => GetPriorityLevel() > 5 
        ? "priority-help-agent" 
        : "help-agent",
    UserIntent.ActionRequest => IsMobile()
        ? "mobile-action-agent"
        : "action-agent",
    _ => null
};
```

### Fallback Chain

```csharp
var triageAgent = new TriageAgent<UserIntent>(
    classifier,
    registry,
    routingMapping,
    fallbackAgentName: "help-agent",  // Primary fallback
    fallbackAgent: new GenericHelpAgent() // Secondary fallback
);
```

## Troubleshooting

### Agent Not Found

```csharp
if (!registry.HasAgent("my-agent"))
{
    logger.LogWarning("Agent 'my-agent' not registered");
    // Register it
    registry.Register("my-agent", new MyAgent());
}
```

### Classification Failing

```csharp
try
{
    var intent = await classifier.ClassifyAsync(input, ct);
}
catch (Exception ex)
{
    logger.LogError(ex, "Classification failed, using fallback");
    return UserIntent.Unknown; // Falls back to help-agent
}
```

### Message Not in Metadata

```csharp
var message = InterAgentCommunicationContext.GetUserMessage(request);
if (string.IsNullOrEmpty(message))
{
    // Message not set by triage agent
    // Check that metadata is properly initialized
    request.Metadata ??= [];
    request.Metadata["UserMessage"] = userInput;
}
```

## Performance Tips

1. **Cache Classifier** - Don't recreate for each request
2. **Register Agents as Singletons** - When safe
3. **Minimize Metadata** - Only store what you need
4. **Use Async/Await** - Don't block threads
5. **Add Logging** - Debug classification issues

## Next Steps

- Read the [full Triage Agent guide](TRIAGE_AGENT.md)
- Explore the [sample application](../../BbQ.ChatWidgets.Sample/Program.cs)
- Create [custom classifiers](../examples/CUSTOM_CLASSIFIERS.md)
- [Extend agents](../examples/AGENT_EXTENSIBILITY.md)

---

**Questions?** Check [TRIAGE_AGENT.md](TRIAGE_AGENT.md) for detailed documentation.
