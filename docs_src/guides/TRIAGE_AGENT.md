# Triage Agent System

The triage agent system provides intelligent request routing based on user intent classification. It enables multi-agent architectures where an AI classifier decides which specialized agent handles each user request.

## Overview

```
User Message
    │
[TriageAgent<TCategory>]
    │
[IClassifier<TCategory>] ──► Classify intent
    │
[IAgentRegistry] ──► Look up specialized agent by name
    │
[Specialized Agent] ──► Process request
    │
ChatTurn response (with optional widgets)
```

## Core Components

### IAgent

The fundamental unit of the agent pipeline. Every agent — including `TriageAgent` itself — implements this interface.

```csharp
public interface IAgent
{
    Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken cancellationToken);
}
```

### ChatRequest

Carries the request context through the pipeline. The `Metadata` dictionary is the primary mechanism for passing data between agents.

```csharp
public record ChatRequest(string? ThreadId, IServiceProvider RequestServices)
{
    public Dictionary<string, object> Metadata { get; init; } = [];
}
```

### IClassifier&lt;TCategory&gt;

Classifies a string input into one of the enum categories you define.

```csharp
public interface IClassifier<TCategory> where TCategory : Enum
{
    Task<TCategory> ClassifyAsync(string input, CancellationToken ct = default);
}
```

### IAgentRegistry

Resolves agents from the DI container by name.

```csharp
public interface IAgentRegistry
{
    IAgent? GetAgent(string name);
    IEnumerable<string> GetRegisteredAgents();
    bool HasAgent(string name);
}
```

> **Note:** Agents are registered in DI as keyed services using `services.AddAgent<TAgent>("name")`.  
> The `IAgentRegistry` implementation reads directly from the DI container — there is no manual `Register()` method.

### TriageAgent&lt;TCategory&gt;

Routes requests to specialized agents based on a classification result.

```csharp
var triageAgent = new TriageAgent<UserIntent>(
    classifier: serviceProvider.GetRequiredService<IClassifier<UserIntent>>(),
    agentRegistry: serviceProvider.GetRequiredService<IAgentRegistry>(),
    routingMapping: category => category switch
    {
        UserIntent.HelpRequest    => "help-agent",
        UserIntent.DataQuery      => "data-query-agent",
        UserIntent.ActionRequest  => "action-agent",
        UserIntent.Feedback       => "feedback-agent",
        _                         => null            // use fallback
    },
    fallbackAgentName: "help-agent"
);
```

Constructor parameters:

| Parameter | Required | Description |
|-----------|----------|-------------|
| `classifier` | Yes | `IClassifier<TCategory>` that determines intent |
| `agentRegistry` | Yes | `IAgentRegistry` used to look up agents by name |
| `routingMapping` | Yes | `Func<TCategory, string?>` mapping category → agent name |
| `fallbackAgentName` | No | Name of the agent to use when routing returns `null` |
| `fallbackAgent` | No | Concrete `IAgent` instance to use as last-resort fallback |
| `threadService` | No | `IThreadService` to create a thread when `ThreadId` is absent |

### InterAgentCommunicationContext

Provides structured access to shared metadata so agents can communicate without coupling.

```csharp
// The triage agent sets these before routing
InterAgentCommunicationContext.SetUserMessage(request, userMessage);
InterAgentCommunicationContext.SetClassification(request, category);
InterAgentCommunicationContext.SetRoutedAgent(request, agentName);

// Specialized agents read them
var message        = InterAgentCommunicationContext.GetUserMessage(request);
var classification = InterAgentCommunicationContext.GetClassification<UserIntent>(request);
var routedAgent    = InterAgentCommunicationContext.GetRoutedAgent(request);

// Agents can also pass results to downstream agents
InterAgentCommunicationContext.SetPreviousResult(request, someData);
var previous = InterAgentCommunicationContext.GetPreviousResult(request);
```

### AgentPipelineBuilder / IAgentMiddleware

Compose multiple middleware components around an inner agent.

```csharp
// IAgentMiddleware
public interface IAgentMiddleware
{
    Task<Outcome<ChatTurn>> InvokeAsync(
        ChatRequest request, AgentDelegate next, CancellationToken cancellationToken);
}

// Pipeline builder
services.AddAgentPipeline(builder =>
{
    builder.Use<LoggingMiddleware>();
    builder.Use<TriageMiddleware>();   // wraps a TriageAgent
});
```

`TriageMiddleware` is a convenience middleware that delegates to a registered `IAgent` (typically a `TriageAgent<TCategory>`) and ignores the `next` delegate so the pipeline short-circuits at the triage point.

---

## Step-by-Step Setup

### 1. Define an intent enum

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

### 2. Implement a classifier

```csharp
using BbQ.ChatWidgets.Agents.Abstractions;
using Microsoft.Extensions.AI;

public sealed class UserIntentClassifier : IClassifier<UserIntent>
{
    private readonly IChatClient _chatClient;

    public UserIntentClassifier(IChatClient chatClient) => _chatClient = chatClient;

    public async Task<UserIntent> ClassifyAsync(string input, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(input))
            return UserIntent.Unknown;

        var prompt = $"""
            Classify the following message into EXACTLY ONE category.
            Respond with ONLY the category name.

            Categories:
            - HelpRequest   : user asks for help or support
            - DataQuery     : user asks for information or data
            - ActionRequest : user wants an action performed
            - Feedback      : user provides feedback or suggestions
            - Unknown       : none of the above

            Message: {input}
            """;

        var options = new ChatOptions { ToolMode = ChatToolMode.None };
        var response = await _chatClient.GetResponseAsync(
            [new ChatMessage(ChatRole.User, prompt)], options, ct);

        return Enum.TryParse<UserIntent>(response.Text.Trim(), ignoreCase: true, out var intent)
            ? intent
            : UserIntent.Unknown;
    }
}
```

### 3. Create specialized agents

Each specialized agent receives context set by the triage agent via `InterAgentCommunicationContext`.

```csharp
using BbQ.ChatWidgets.Agents;
using BbQ.ChatWidgets.Agents.Abstractions;
using BbQ.ChatWidgets.Models;
using BbQ.Outcome;
using Microsoft.Extensions.AI;

public sealed class HelpAgent : IAgent
{
    public Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken ct)
    {
        var message        = InterAgentCommunicationContext.GetUserMessage(request) ?? "";
        var classification = InterAgentCommunicationContext.GetClassification<UserIntent>(request);

        var turn = new ChatTurn(
            Role: ChatRole.Assistant,
            Content: $"Help desk here! Regarding '{message}' (intent: {classification}): ...",
            Widgets: [],
            ThreadId: request.ThreadId ?? ""
        );

        return Task.FromResult(Outcome<ChatTurn>.From(turn));
    }
}

public sealed class DataQueryAgent : IAgent
{
    public Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken ct)
    {
        var message = InterAgentCommunicationContext.GetUserMessage(request) ?? "";

        var turn = new ChatTurn(
            Role: ChatRole.Assistant,
            Content: $"Data agent: processing query '{message}'...",
            Widgets: [],
            ThreadId: request.ThreadId ?? ""
        );

        return Task.FromResult(Outcome<ChatTurn>.From(turn));
    }
}
```

### 4. Register agents in DI

Use `AddAgent<TAgent>(name)` to register each agent as a keyed DI service. This makes them resolvable by name through `IAgentRegistry`.

```csharp
// Program.cs or a service extension method
services.AddScoped<IClassifier<UserIntent>, UserIntentClassifier>();

services.AddAgent<HelpAgent>("help-agent");
services.AddAgent<DataQueryAgent>("data-query-agent");
services.AddAgent<ActionAgent>("action-agent");
services.AddAgent<FeedbackAgent>("feedback-agent");

// Register the triage agent itself
services.AddScoped(sp =>
{
    var classifier = sp.GetRequiredService<IClassifier<UserIntent>>();
    var registry   = sp.GetRequiredService<IAgentRegistry>();
    var threads    = sp.GetService<IThreadService>();

    Func<UserIntent, string?> routingMapping = intent => intent switch
    {
        UserIntent.HelpRequest   => "help-agent",
        UserIntent.DataQuery     => "data-query-agent",
        UserIntent.ActionRequest => "action-agent",
        UserIntent.Feedback      => "feedback-agent",
        _                        => null
    };

    return new TriageAgent<UserIntent>(
        classifier,
        registry,
        routingMapping,
        fallbackAgentName: "help-agent",
        threadService: threads);
});
```

### 5. Invoke the triage agent

The user message **must** be placed in the `Metadata` dictionary before calling `InvokeAsync`. Use `InterAgentCommunicationContext.SetUserMessage` (or the key `"UserMessage"` directly) to set it.

```csharp
var triageAgent = serviceProvider.GetRequiredService<TriageAgent<UserIntent>>();

var request = new ChatRequest(ThreadId: threadId, RequestServices: serviceProvider);
InterAgentCommunicationContext.SetUserMessage(request, "Can you help me reset my password?");

var outcome = await triageAgent.InvokeAsync(request, CancellationToken.None);

if (outcome.IsSuccess)
{
    var classification = InterAgentCommunicationContext.GetClassification<UserIntent>(request);
    var routedAgent    = InterAgentCommunicationContext.GetRoutedAgent(request);

    Console.WriteLine($"Classified as : {classification}");
    Console.WriteLine($"Routed to     : {routedAgent}");
    Console.WriteLine($"Response      : {outcome.Value.Content}");
}
else
{
    Console.WriteLine($"Error: {outcome.Error}");
}
```

---

## Agent-to-Agent Communication

All context flows through `ChatRequest.Metadata`. The `InterAgentCommunicationContext` helper provides typed access:

| Key | Set by | Read by |
|-----|--------|---------|
| `"UserMessage"` | `TriageAgent` | All specialized agents |
| `"Classification"` | `TriageAgent` | All specialized agents |
| `"RoutedAgent"` | `TriageAgent` | Logging / debugging code |
| `"PreviousResult"` | Any agent | Next agent in a chain |

Specialized agents can also write their own keys for downstream consumers:

```csharp
// In a chained agent
InterAgentCommunicationContext.SetPreviousResult(request, myResult);
```

---

## Error Handling

`TriageAgent` returns structured errors rather than throwing:

| Error Code | Cause |
|------------|-------|
| `"NoMessage"` | `UserMessage` key not found in `request.Metadata` |
| `"NoAgent"` | No registered agent matched the routing key, and no fallback was configured |
| `"TriageFailed"` | An unexpected exception was caught during classification or routing |

`OperationCanceledException` is always re-thrown so cancellation is propagated correctly.

---

## Adding a Custom Intent Category

```csharp
// 1. Extend the enum
public enum UserIntent
{
    HelpRequest,
    DataQuery,
    ActionRequest,
    Feedback,
    Complaint,   // ← new
    Unknown
}

// 2. Add the agent
public sealed class ComplaintAgent : IAgent
{
    public Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken ct)
    {
        var message = InterAgentCommunicationContext.GetUserMessage(request) ?? "";
        var turn = new ChatTurn(ChatRole.Assistant,
            $"Thank you for your feedback. We have logged: '{message}'");
        return Task.FromResult(Outcome<ChatTurn>.From(turn));
    }
}

// 3. Register it
services.AddAgent<ComplaintAgent>("complaint-agent");

// 4. Add to routing mapping
Func<UserIntent, string?> routingMapping = intent => intent switch
{
    UserIntent.HelpRequest   => "help-agent",
    // ...
    UserIntent.Complaint     => "complaint-agent",   // ← new
    _                        => null
};
```

---

## Best Practices

- Keep the triage agent thin — it only classifies and routes. Business logic belongs in specialized agents.
- Always provide a `fallbackAgentName` so unknown classifications degrade gracefully.
- Use `InterAgentCommunicationContext` instead of accessing `request.Metadata` directly — it provides type safety and avoids key typos.
- Register agents with appropriate lifetimes. `Scoped` (the default) is safe for most agents. Use `Singleton` only when the agent has no per-request state.
- Log `GetClassification` and `GetRoutedAgent` at `Debug` or `Information` level to diagnose routing issues.

---

## Sample Applications

Working examples of the full triage system are available in:

| Sample | Location |
|--------|----------|
| Console | `Sample/BbQ.ChatWidgets.Sample.Console/` |
| React Web API | `Sample/BbQ.ChatWidgets.Sample.React/` |
| Angular Web API | `Sample/BbQ.ChatWidgets.Sample.Angular/` |
| Blazor | `Sample/BbQ.ChatWidgets.Sample.Blazor/` |

Shared triage setup (agents + classifier + DI wiring) lives in `Sample/BbQ.ChatWidgets.Sample.Shared/Agents/`.

---

## Related Topics

- [Agent Pipeline Builder](../api/BbQ.ChatWidgets.Agents.AgentPipelineBuilder.html) — advanced middleware composition
- [Use Cases](../examples/USE_CASES.md) — end-to-end triage bot walkthrough
- [Architecture Overview](../ARCHITECTURE.md) — where agents fit in the broader system
