This document has been consolidated into the new documentation structure.

Please refer to `docs/INDEX.md` and `README.md` for the updated documentation.
# Triage Agent System - Complete Implementation Index

## ?? Documentation Index

Start here to understand the triage agent system:

### Quick References
1. **README_TRIAGE_IMPLEMENTATION.md** - Executive summary and quick start
2. **TRIAGE_AGENT_QUICKSTART.md** - 5-minute quick start guide
3. **TRIAGE_IMPLEMENTATION_SUMMARY.md** - Detailed implementation summary

### Comprehensive Guides
1. **TRIAGE_AGENT.md** - Complete architecture and usage guide
2. **TRIAGE_ARCHITECTURE.md** - Detailed architecture diagrams and flows

## ?? Quick Navigation

### "I just want to run it"
? Go to: **README_TRIAGE_IMPLEMENTATION.md** - Quick Start section

### "I want to understand the architecture"
? Go to: **TRIAGE_ARCHITECTURE.md** - System Diagrams section

### "I want to customize it"
? Go to: **TRIAGE_AGENT_QUICKSTART.md** - Customization section

### "I want complete documentation"
? Go to: **TRIAGE_AGENT.md** - Full Guide

## ?? File Structure

```
BbQ.ChatWidgets/
??? Agents/
?   ??? Abstractions/
?   ?   ??? IAgentRegistry.cs           # Registry interface
?   ??? Middleware/
?   ?   ??? TriageMiddleware.cs         # Optional middleware
?   ??? AgentRegistry.cs                # Default registry
?   ??? TriageAgent.cs                  # Main triage agent
?   ??? InterAgentCommunicationContext.cs # Metadata sharing
?   ??? AgentRoutingException.cs        # Exception type
?
??? docs/
?   ??? guides/
?   ?   ??? TRIAGE_AGENT.md             # Complete guide
?   ?   ??? TRIAGE_AGENT_QUICKSTART.md  # Quick start
?   ??? TRIAGE_IMPLEMENTATION_SUMMARY.md
?   ??? TRIAGE_ARCHITECTURE.md
?
??? Sample/
    ??? Agents/
    ?   ??? UserIntentClassifier.cs    # AI classifier
    ?   ??? SpecializedAgents.cs       # 4 agents
    ??? TriageAgentSetup.cs            # DI helper
    ??? Program.cs                      # Console sample
```

## ?? Getting Started

### Step 1: Read the Quick Start
```
?? README_TRIAGE_IMPLEMENTATION.md
   ?? "Quick Start" section
```

### Step 2: Run the Sample
```bash
cd BbQ.ChatWidgets.Sample
dotnet run
```

### Step 3: Try Different Inputs
```
You: help, I'm locked out      ? Help Agent
You: show me the data          ? Data Query Agent
You: delete my account         ? Action Agent
You: great service!            ? Feedback Agent
```

### Step 4: Read the Full Guide
```
?? TRIAGE_AGENT.md
   ?? Complete architecture and examples
```

## ?? Key Concepts

### Classification
The system automatically classifies user input into intent categories:
- HelpRequest
- DataQuery
- ActionRequest
- Feedback
- Unknown

### Routing
Each classification maps to a specialized agent:
```
HelpRequest     ? help-agent
DataQuery       ? data-query-agent
ActionRequest   ? action-agent
Feedback        ? feedback-agent
Unknown         ? help-agent (fallback)
```

### Inter-Agent Communication
Agents share context via metadata:
```
Metadata["UserMessage"] = user input
Metadata["Classification"] = intent category
Metadata["RoutedAgent"] = agent name
```

## ?? Architecture Overview

```
User Input
    ?
[TriageAgent]
    ?? Classify intent
    ?? Look up agent
    ?? Store context
    ?? Invoke specialized agent
        ?
        ?? [HelpAgent]
        ?? [DataQueryAgent]
        ?? [ActionAgent]
        ?? [FeedbackAgent]
    ?
Response with optional widgets
```

## ?? Customization Paths

### Use As-Is
The sample agents and classifier are ready to use immediately.

### Extend Agents
Add more agents without modifying core:
```csharp
public class BillingAgent : IAgent { }
registry.Register("billing-agent", new BillingAgent());
```

### Custom Classifier
Replace the AI classifier with rule-based or ML:
```csharp
public class MyClassifier : IClassifier<UserIntent> { }
```

### New Intent Categories
Add to the enum and update routing:
```csharp
public enum MyIntent
{
    Billing,      // New
    Technical,    // New
    ...
}
```

## ?? Documentation Files

| File | Purpose | Length |
|------|---------|--------|
| README_TRIAGE_IMPLEMENTATION.md | Overview & quick start | 300+ |
| TRIAGE_AGENT_QUICKSTART.md | Quick reference | 300+ |
| TRIAGE_AGENT.md | Complete guide | 400+ |
| TRIAGE_IMPLEMENTATION_SUMMARY.md | Summary & stats | 200+ |
| TRIAGE_ARCHITECTURE.md | Architecture details | 300+ |

## ? Features at a Glance

- ? Automatic intent classification
- ? Intelligent request routing
- ? Agent-to-agent communication
- ? Type-safe design
- ? Error handling
- ? DI container integration
- ? Extensible architecture
- ? Full documentation
- ? Working samples

## ?? Use Cases

### Customer Support Chatbot
Route help requests to support agents, data queries to knowledge base, feedback to feedback agents.

### E-Commerce Assistant
Route product inquiries to catalog agent, billing questions to billing agent, actions to order agent.

### Technical Support
Route error reports to debugging agent, FAQ to knowledge agent, feature requests to feedback agent.

### Internal Tool
Route employee requests to appropriate department/function based on intent.

## ??? Architecture Styles

### Pattern: Triage + Routing
```
Request ? Classify ? Route ? Process ? Respond
```

### Pattern: Inter-Agent Communication
```
Request ? Store metadata ? Agent 1 ? Agent 2 ? Response
                              ?
                    Read/write shared context
```

### Pattern: Fallback Chain
```
Classify intent
    ?? Primary agent found? ? Use it
    ?? Fallback agent name? ? Use it
    ?? Fallback agent instance? ? Use it
```

## ?? Code Examples

### Basic Usage
```csharp
// Setup
services.AddTriageAgentSystem();
var triageAgent = sp.GetRequiredService<TriageAgent<UserIntent>>();

// Use
var request = new ChatRequest(threadId, sp)
{
    Metadata = new Dictionary<string, object> 
    { 
        { "UserMessage", message } 
    }
};

var outcome = await triageAgent.InvokeAsync(request, ct);
```

### Get Classification
```csharp
var classification = InterAgentCommunicationContext
    .GetClassification<UserIntent>(request);
```

### Create Custom Agent
```csharp
public class MyAgent : IAgent
{
    public async Task<Outcome<ChatTurn>> InvokeAsync(
        ChatRequest request, 
        CancellationToken ct)
    {
        var message = InterAgentCommunicationContext
            .GetUserMessage(request);
        // ... process and return response
    }
}
```

## ? FAQ

### Q: Can I use my own classifier?
**A:** Yes! Implement `IClassifier<TCategory>` and register it in DI.

### Q: Can I add more agents?
**A:** Yes! Create agents implementing `IAgent` and register them in the registry.

### Q: Can I change the intent categories?
**A:** Yes! Create your own enum and use `TriageAgent<YourEnum>`.

### Q: Does it work with OpenAI?
**A:** Yes! The sample uses OpenAI for classification via ChatClient.

### Q: Can I use in production?
**A:** Yes! Full error handling, type safety, and comprehensive design.

## ?? Related Documentation

- **IAgent Interface**: `BbQ.ChatWidgets\Agents\Abstractions\IAgent.cs`
- **ChatRequest**: `BbQ.ChatWidgets\Agents\ChatRequest.cs`
- **Outcome Pattern**: `BbQ.Outcome` NuGet package

## ?? Support

For questions about:
- **Architecture**: See TRIAGE_ARCHITECTURE.md
- **Usage**: See TRIAGE_AGENT_QUICKSTART.md
- **Implementation**: See TRIAGE_AGENT.md
- **Quick Start**: See README_TRIAGE_IMPLEMENTATION.md

## ? Status

- **Build**: ? Passing
- **Documentation**: ? Complete
- **Quality**: ? Production-Ready
- **Testing**: ? Verified

---

## Start Now!

1. **Read**: README_TRIAGE_IMPLEMENTATION.md
2. **Run**: `cd BbQ.ChatWidgets.Sample && dotnet run`
3. **Explore**: Try different inputs to see routing
4. **Learn**: Read TRIAGE_AGENT.md for details
5. **Customize**: Create your own agents and classifiers

**The triage agent system is ready to use!**
