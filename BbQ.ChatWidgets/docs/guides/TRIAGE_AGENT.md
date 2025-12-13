# Triage Agent & Classifier Router System

## Overview

The triage agent system provides intelligent request routing based on user intent classification. It enables:

- **Automatic Intent Classification** - AI-based user intent detection
- **Intelligent Routing** - Direct requests to specialized agents
- **Agent-to-Agent Communication** - Shared metadata for context propagation
- **Fallback Handling** - Graceful degradation when routing fails
- **Extensible Architecture** - Easy to add new intent categories and agents

## Architecture

```
User Message
    ?
[Triage Agent]
    ?
[Classifier] ? Classify Intent (HelpRequest, DataQuery, ActionRequest, Feedback)
    ?
[Agent Registry] ? Lookup Specialized Agent
    ?
[Specialized Agent] (HelpAgent, DataQueryAgent, ActionAgent, FeedbackAgent)
    ?
AI Response with Widgets
```

## Core Components

### 1. IClassifier<TCategory>
Classifies user input into enum-based categories.

```csharp
public interface IClassifier<TCategory> where TCategory : Enum
{
    Task<TCategory> ClassifyAsync(string input, CancellationToken ct = default);
}
```

### 2. IAgentRegistry
Manages named agents for routing.

```csharp
public interface IAgentRegistry
{
    void Register(string name, IAgent agent);
    IAgent? GetAgent(string name);
    IEnumerable<string> GetRegisteredAgents();
    bool HasAgent(string name);
}
```

### 3. TriageAgent<TCategory>
Routes requests based on classification.

```csharp
public sealed class TriageAgent<TCategory> : IAgent where TCategory : Enum
{
    public async Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken cancellationToken)
    {
        // 1. Classify the request
        var category = await _classifier.ClassifyAsync(userMessage, cancellationToken);
        
        // 2. Store classification in metadata
        InterAgentCommunicationContext.SetClassification(request, category);
        
        // 3. Route to appropriate agent
        var targetAgent = GetTargetAgent(_routingMapping(category));
        
        // 4. Invoke routed agent
        return await targetAgent.InvokeAsync(request, cancellationToken);
    }
}
```

### 4. InterAgentCommunicationContext
Facilitates inter-agent data sharing through request metadata.

```csharp
public sealed class InterAgentCommunicationContext
{
    // Store/retrieve classification results
    public static void SetClassification<T>(ChatRequest request, T category) where T : Enum;
    public static T? GetClassification<T>(ChatRequest request) where T : Enum;
    
    // Store/retrieve user message
    public static void SetUserMessage(ChatRequest request, string message);
    public static string? GetUserMessage(ChatRequest request);
    
    // Store/retrieve routed agent name
    public static void SetRoutedAgent(ChatRequest request, string agentName);
    public static string? GetRoutedAgent(ChatRequest request);
    
    // Store/retrieve previous agent results
    public static void SetPreviousResult(ChatRequest request, object result);
    public static object? GetPreviousResult(ChatRequest request);
}
```

### 5. TriageMiddleware
Integrates triage agent into the middleware pipeline.

```csharp
public sealed class TriageMiddleware : IAgentMiddleware
{
    public Task<Outcome<ChatTurn>> InvokeAsync(
        ChatRequest request,
        AgentDelegate next,
        CancellationToken cancellationToken)
    {
        // Delegate to triage agent for routing
        return _triageAgent.InvokeAsync(request, cancellationToken);
    }
}
```

## Usage Example

### 1. Define Intent Enum

```csharp
public enum UserIntent
{
    HelpRequest,
    DataQuery,
    ActionRequest,
    Feedback,
    Unknown
}
```

### 2. Implement Classifier

```csharp
public sealed class UserIntentClassifier : IClassifier<UserIntent>
{
    private readonly IChatClient _chatClient;

    public async Task<UserIntent> ClassifyAsync(string input, CancellationToken ct = default)
    {
        var prompt = """
            Classify this message into: HelpRequest, DataQuery, ActionRequest, Feedback, or Unknown.
            Respond with ONLY the category name.
            
            Message: {input}
            """;

        var response = await _chatClient.GetResponseAsync(
            [new ChatMessage(ChatRole.User, prompt)],
            new ChatOptions { ToolMode = ChatToolMode.None },
            ct);

        return Enum.TryParse<UserIntent>(response.Text.Trim(), ignoreCase: true, out var intent)
            ? intent
            : UserIntent.Unknown;
    }
}
```

### 3. Create Specialized Agents

```csharp
public sealed class HelpAgent : IAgent
{
    public Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken cancellationToken)
    {
        var userMessage = InterAgentCommunicationContext.GetUserMessage(request);
        var classification = InterAgentCommunicationContext.GetClassification<UserIntent>(request);

        var response = new ChatTurn(
            ChatRole.Assistant,
            $"Help Agent: I can assist with '{userMessage}' (intent: {classification})",
            [],
            request.ThreadId ?? "unknown"
        );

        return Task.FromResult(Outcome<ChatTurn>.From(response));
    }
}

public sealed class DataQueryAgent : IAgent { /* ... */ }
public sealed class ActionAgent : IAgent { /* ... */ }
public sealed class FeedbackAgent : IAgent { /* ... */ }
```

### 4. Register in DI Container

```csharp
services.AddTriageAgentSystem();
// Registers:
// - UserIntentClassifier as IClassifier<UserIntent>
// - AgentRegistry as IAgentRegistry (singleton)
// - Help, DataQuery, Action, and Feedback agents
// - TriageAgent<UserIntent>
```

### 5. Use in Application

```csharp
var triageAgent = serviceProvider.GetRequiredService<TriageAgent<UserIntent>>();

var request = new ChatRequest(
    ThreadId: threadId,
    RequestServices: serviceProvider,
    Metadata: new Dictionary<string, object> { { "UserMessage", "Can you help me?" } }
);

var outcome = await triageAgent.InvokeAsync(request, CancellationToken.None);

if (outcome.IsSuccessful)
{
    var classification = InterAgentCommunicationContext.GetClassification<UserIntent>(request);
    var routedAgent = InterAgentCommunicationContext.GetRoutedAgent(request);
    
    Console.WriteLine($"Classified as: {classification}");
    Console.WriteLine($"Routed to: {routedAgent}");
    Console.WriteLine($"Response: {outcome.Result.Content}");
}
```

## Agent-to-Agent Communication

Agents can communicate through the request metadata:

```csharp
public sealed class ChainedAgent : IAgent
{
    public async Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken cancellationToken)
    {
        // Get context from previous agent
        var classification = InterAgentCommunicationContext.GetClassification<UserIntent>(request);
        var userMessage = InterAgentCommunicationContext.GetUserMessage(request);
        
        // Process based on classification
        if (classification == UserIntent.ActionRequest)
        {
            // Ask for confirmation
            return Outcome<ChatTurn>.From(new ChatTurn(
                ChatRole.Assistant,
                "Please confirm this action",
                new[] { new ButtonWidget("Confirm", "confirm_action") },
                request.ThreadId ?? "unknown"
            ));
        }
        
        // Store result for next agent
        var result = await ProcessAsync(userMessage);
        InterAgentCommunicationContext.SetPreviousResult(request, result);
        
        // ... continue processing
    }
}
```

## Routing Mapping

Define how classifications map to agent names:

```csharp
Func<UserIntent, string?> routingMapping = category => category switch
{
    UserIntent.HelpRequest => "help-agent",
    UserIntent.DataQuery => "data-query-agent",
    UserIntent.ActionRequest => "action-agent",
    UserIntent.Feedback => "feedback-agent",
    _ => null // Use fallback agent
};
```

## Error Handling

The system gracefully handles errors:

```csharp
public sealed class TriageAgent<TCategory> : IAgent where TCategory : Enum
{
    public async Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken cancellationToken)
    {
        try
        {
            // Classification or routing fails
            if (targetAgent == null)
            {
                return Outcome<ChatTurn>.Failed(
                    new AgentRoutingException("NoAgent", $"No agent found for: {agentName}"));
            }

            return await targetAgent.InvokeAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            return Outcome<ChatTurn>.Failed(
                new AgentRoutingException("TriageFailed", $"Triage routing failed: {ex.Message}", ex));
        }
    }
}
```

## Integration with ChatService

The sample application integrates triage routing:

```csharp
public class ChatService
{
    public async Task<ChatTurn> SendMessageWithTriageAsync(
        string userMessage,
        TriageAgent<UserIntent> triageAgent)
    {
        var request = new ChatRequest(
            ThreadId: _currentThreadId,
            RequestServices: _serviceProvider,
            Metadata: new Dictionary<string, object> { { "UserMessage", userMessage } }
        );

        var outcome = await triageAgent.InvokeAsync(request, CancellationToken.None);

        if (outcome.IsSuccessful)
        {
            var classification = InterAgentCommunicationContext.GetClassification<UserIntent>(request);
            var routedAgent = InterAgentCommunicationContext.GetRoutedAgent(request);
            
            _logger.LogInformation($"Classified as: {classification}, routed to: {routedAgent}");
            return outcome.Result;
        }
        else
        {
            throw new InvalidOperationException($"Triage routing failed: {outcome.Error}");
        }
    }
}
```

## Example: Multi-Step Workflow

```csharp
// 1. User sends message
// "I need to delete my account"

// 2. Classifier runs
// Classification: ActionRequest

// 3. Router selects agent
// Route to: action-agent

// 4. Action agent processes
// ActionAgent checks classification and requests confirmation
// Returns button widgets for "Confirm" and "Cancel"

// 5. User clicks button
// Metadata updated with action type

// 6. Next agent in chain processes confirmation
// Deletes account and returns success response
```

## Extending the System

### Add New Intent Category

```csharp
public enum UserIntent
{
    // ... existing categories
    Complaint,  // New category
}
```

### Add New Specialized Agent

```csharp
public sealed class ComplaintAgent : IAgent
{
    public async Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken cancellationToken)
    {
        // Get complaint details from context
        var complaint = InterAgentCommunicationContext.GetUserMessage(request);
        
        // Process complaint
        var response = new ChatTurn(
            ChatRole.Assistant,
            $"I'm sorry to hear about this issue. Let me help...",
            new[] { new ButtonWidget("File Complaint", "file_complaint") },
            request.ThreadId ?? "unknown"
        );
        
        return Outcome<ChatTurn>.From(response);
    }
}
```

### Update Routing

```csharp
services.AddTriageAgentSystem(); // Then modify agent registry

var registry = serviceProvider.GetRequiredService<IAgentRegistry>();
registry.Register("complaint-agent", new ComplaintAgent());
```

## Best Practices

? **Do:**
- Use meaningful intent category names
- Implement comprehensive classifier logic
- Add logging for debugging
- Handle fallback cases
- Test agent interactions
- Document routing mappings
- Use strong typing with enums

? **Don't:**
- Create too many agent types (keep it simple)
- Put complex logic in the triage agent
- Forget to handle unknown classifications
- Leave exceptions unhandled
- Hardcode routing mappings
- Bypass the classification system

## Files

| File | Purpose |
|------|---------|
| `BbQ.ChatWidgets\Agents\Abstractions\IAgentRegistry.cs` | Agent registry interface |
| `BbQ.ChatWidgets\Agents\AgentRegistry.cs` | Default registry implementation |
| `BbQ.ChatWidgets\Agents\TriageAgent.cs` | Triage agent for routing |
| `BbQ.ChatWidgets\Agents\InterAgentCommunicationContext.cs` | Inter-agent communication |
| `BbQ.ChatWidgets\Agents\Middleware\TriageMiddleware.cs` | Middleware integration |
| `BbQ.ChatWidgets\Agents\AgentRoutingException.cs` | Exception type |
| `BbQ.ChatWidgets.Sample\Agents\UserIntentClassifier.cs` | Intent classifier |
| `BbQ.ChatWidgets.Sample\Agents\SpecializedAgents.cs` | Specialized agents |
| `BbQ.ChatWidgets.Sample\TriageAgentSetup.cs` | DI setup helper |

## Next Steps

- **Review** the sample application in `BbQ.ChatWidgets.Sample\Program.cs`
- **Test** different intents by running the console app
- **Extend** with custom intent categories
- **Integrate** with your domain logic
- **Monitor** classification accuracy
- **Optimize** classifier prompts for your use cases

---

**See also:**
- [Agent Pipeline Architecture](../api/AGENT_PIPELINE.md)
- [Triage Agent Implementation](../examples/TRIAGE_AGENT.md)
- [Custom Classifiers](../examples/CUSTOM_CLASSIFIERS.md)
