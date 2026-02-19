# Use Cases & Tutorials

Real-world scenarios with step-by-step implementation guides. Each tutorial includes sample code and links to working examples.

---

## 🎯 Quick Links

- [1. Support/Triage Bot](#1-supporttriage-bot)
- [2. Form-Based Chat](#2-form-based-chat)
- [3. Streaming & Real-Time Updates (SSE)](#3-streaming--real-time-updates-sse)
- [4. Widget Actions & Interactions](#4-widget-actions--interactions)

---

## 1. Support/Triage Bot

### Scenario
Build an intelligent support bot that classifies user questions and routes them to specialized agents (billing, technical, general inquiry).

### What You'll Learn
- Intent classification with `TriageAgent`
- Routing to specialized agents
- Using inter-agent communication metadata
- Handling different conversation contexts

### Step-by-Step

#### Step 1: Define User Intents

```csharp
public enum UserIntent
{
    TechnicalSupport,
    BillingInquiry,
    GeneralQuestion
}
```

#### Step 2: Create an Intent Classifier

```csharp
using BbQ.ChatWidgets.Agents.Abstractions;

public class SupportClassifier : IClassifier<UserIntent>
{
    private readonly IChatClient _chatClient;

    public async Task<UserIntent> ClassifyAsync(string message, CancellationToken cancellationToken)
    {
        var systemPrompt = """
            Classify the user's message into one of these categories:
            - TechnicalSupport: Issues with software, bugs, errors, login problems
            - BillingInquiry: Questions about payments, invoices, subscriptions, pricing
            - GeneralQuestion: Everything else (product info, how-to, general questions)
            
            Reply with ONLY the category name.
            """;

        var options = new ChatOptions { ToolMode = ChatToolMode.None };
        var response = await _chatClient.GetResponseAsync(
            [new ChatMessage(ChatRole.User, systemPrompt + "\n\nUser message: " + message)],
            options,
            cancellationToken);

        return Enum.Parse<UserIntent>(response.Text.Trim(), ignoreCase: true);
    }
}
```

#### Step 3: Create Specialized Agents

Use `InterAgentCommunicationContext.GetUserMessage(request)` to read the user message — the triage agent writes it there automatically.

```csharp
using BbQ.ChatWidgets.Agents;
using BbQ.ChatWidgets.Agents.Abstractions;
using BbQ.ChatWidgets.Models;
using BbQ.Outcome;
using Microsoft.Extensions.AI;

public class TechnicalSupportAgent : IAgent
{
    private readonly IChatClient _chatClient;

    public TechnicalSupportAgent(IChatClient chatClient) => _chatClient = chatClient;

    public async Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken cancellationToken)
    {
        var userMessage = InterAgentCommunicationContext.GetUserMessage(request) ?? string.Empty;

        var systemPrompt = """
            You are a technical support specialist. Help users troubleshoot issues.
            Use buttons for common actions like 'reset_password', 'clear_cache', 'contact_tech'.
            Wrap widgets in <widget>...</widget> tags with JSON inside.
            """;

        var response = await _chatClient.GetResponseAsync(
            [
                new ChatMessage(ChatRole.System, systemPrompt),
                new ChatMessage(ChatRole.User, userMessage)
            ],
            cancellationToken: cancellationToken);

        var turn = new ChatTurn(ChatRole.Assistant, response.Text, ThreadId: request.ThreadId ?? "");
        return Outcome<ChatTurn>.From(turn);
    }
}

public class BillingAgent : IAgent
{
    private readonly IChatClient _chatClient;

    public BillingAgent(IChatClient chatClient) => _chatClient = chatClient;

    public async Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken cancellationToken)
    {
        var userMessage = InterAgentCommunicationContext.GetUserMessage(request) ?? string.Empty;

        var systemPrompt = """
            You are a billing specialist. Help with invoices, payments, and subscriptions.
            Use buttons for: 'view_invoices', 'update_payment', 'cancel_subscription'.
            Wrap widgets in <widget>...</widget> tags with JSON inside.
            """;

        var response = await _chatClient.GetResponseAsync(
            [
                new ChatMessage(ChatRole.System, systemPrompt),
                new ChatMessage(ChatRole.User, userMessage)
            ],
            cancellationToken: cancellationToken);

        var turn = new ChatTurn(ChatRole.Assistant, response.Text, ThreadId: request.ThreadId ?? "");
        return Outcome<ChatTurn>.From(turn);
    }
}
```

#### Step 4: Register Triage System

Agents are registered as **keyed DI services** via `AddAgent<TAgent>(name)`. The `IAgentRegistry` implementation resolves them from the DI container — there is no `AgentRegistry` constructor or `Register()` method.

```csharp
// In Program.cs
using BbQ.ChatWidgets.Agents;
using BbQ.ChatWidgets.Agents.Abstractions;

// 1. Register the classifier
services.AddScoped<IClassifier<UserIntent>, SupportClassifier>();

// 2. Register specialized agents as keyed DI services
services.AddAgent<TechnicalSupportAgent>("tech-support");
services.AddAgent<BillingAgent>("billing");
services.AddAgent<GeneralAgent>("general");

// 3. Register the triage agent with routing mapping
services.AddScoped(sp =>
{
    var classifier    = sp.GetRequiredService<IClassifier<UserIntent>>();
    var registry      = sp.GetRequiredService<IAgentRegistry>();
    var threadService = sp.GetService<IThreadService>();

    Func<UserIntent, string?> routingMapping = intent => intent switch
    {
        UserIntent.TechnicalSupport => "tech-support",
        UserIntent.BillingInquiry   => "billing",
        UserIntent.GeneralQuestion  => "general",
        _                           => null   // falls back to fallbackAgentName
    };

    return new TriageAgent<UserIntent>(
        classifier,
        registry,
        routingMapping,
        fallbackAgentName: "general",
        threadService: threadService
    );
});
```

#### Step 5: Use the Triage Agent

Set the user message via `InterAgentCommunicationContext` before invoking the triage agent.

```csharp
// The triage agent automatically classifies and routes
app.MapPost("/api/chat/support", async (
    string message,
    string threadId,
    HttpContext httpContext,
    TriageAgent<UserIntent> triageAgent) =>
{
    var chatRequest = new ChatRequest(threadId, httpContext.RequestServices);
    InterAgentCommunicationContext.SetUserMessage(chatRequest, message);

    var outcome = await triageAgent.InvokeAsync(chatRequest, CancellationToken.None);

    return outcome.IsSuccess
        ? Results.Ok(outcome.Value)
        : Results.Problem(outcome.Error?.ToString());
});
```

### Try It Out

Run the [Console Sample](../../Sample/BbQ.ChatWidgets.Sample.Console/) or [React Sample](../../Sample/BbQ.ChatWidgets.Sample.React/) which both include triage examples.

```bash
# Console sample
cd Sample/BbQ.ChatWidgets.Sample.Console
dotnet run

# Try these messages:
# "I can't log in" → Routes to TechnicalSupportAgent
# "Where is my invoice?" → Routes to BillingAgent
# "What features do you offer?" → Routes to GeneralAgent
```

---

## 2. Form-Based Chat

### Scenario
Collect structured information from users through conversational forms (contact forms, surveys, registration, etc.).

### What You'll Learn
- Creating forms with multiple input types
- Handling form submissions
- Validating user input
- Providing feedback

### Step-by-Step

#### Step 1: Define Form Action and Payload

```csharp
public record ContactFormAction : IWidgetAction<ContactFormPayload>
{
    public string ActionId => "submit_contact";
}

public record ContactFormPayload(
    string Name,
    string Email,
    string Message,
    bool Subscribe);
```

#### Step 2: Create Form Action Handler

```csharp
public class ContactFormHandler : IActionWidgetActionHandler<ContactFormAction, ContactFormPayload>
{
    private readonly ILogger<ContactFormHandler> _logger;
    
    public async Task<string> HandleAsync(
        ContactFormAction action,
        ContactFormPayload payload,
        string threadId,
        CancellationToken cancellationToken)
    {
        // Validate
        if (string.IsNullOrWhiteSpace(payload.Email) || !payload.Email.Contains("@"))
        {
            return "❌ Please provide a valid email address.";
        }
        
        // Process the form (save to DB, send email, etc.)
        _logger.LogInformation(
            "Contact form submitted: {Name} ({Email}), Subscribe: {Subscribe}",
            payload.Name, payload.Email, payload.Subscribe);
        
        // Simulate processing
        await Task.Delay(500, cancellationToken);
        
        // Return confirmation with a button
        return $"""
            ✅ Thank you, {payload.Name}! We've received your message and will get back to you soon.
            
            <widget>
            {{
                "type": "button",
                "label": "Submit Another",
                "action": "new_contact_form"
            }}
            </widget>
            """;
    }
}
```

#### Step 3: Register Action Handler

```csharp
// In Program.cs
services.AddBbQChatWidgets(options =>
{
    options.ChatClientFactory = sp => chatClient;
    
    // Register the action handler
    options.ActionRegistry.RegisterHandler<
        ContactFormAction,
        ContactFormPayload,
        ContactFormHandler>();
});

services.AddScoped<ContactFormHandler>();
```

#### Step 4: AI Generates the Form

When the user says "I want to contact support" or "Show me a contact form", the LLM will generate:

```xml
<widget>
{
  "type": "form",
  "title": "Contact Us",
  "action": "submit_contact",
  "fields": [
    {"name": "Name", "label": "Name", "type": "input", "required": true, "placeholder": "Your full name"},
    {"name": "Email", "label": "Email", "type": "input", "required": true, "placeholder": "you@example.com"},
    {"name": "Message", "label": "Message", "type": "textarea", "required": true, "rows": 4, "placeholder": "How can we help?"},
    {"name": "Subscribe", "label": "Subscribe to newsletter", "type": "toggle", "required": false}
  ],
  "actions": [
    {"type": "submit", "label": "Send Message"},
    {"type": "cancel", "label": "Cancel"}
  ]
}
</widget>
```

#### Step 5: Frontend Handles Submission

The `WidgetManager` automatically handles form submission:

```typescript
import { WidgetManager } from '@bbq-chat/widgets';

const manager = new WidgetManager();

// Render the form widget
manager.render(formWidget, container);

// When user clicks submit, WidgetManager automatically:
// 1. Collects all input values
// 2. POSTs to /api/chat/action with action="submit_contact" and payload
// 3. Displays the response
```

### Try It Out

Run the [React Sample](../../Sample/BbQ.ChatWidgets.Sample.React/):

```bash
cd Sample/BbQ.ChatWidgets.Sample.React
dotnet run

# In the browser, type:
# "Show me a contact form"
# Fill out the form and submit
```

---

## 3. Streaming & Real-Time Updates (SSE)

### Scenario
Push live updates to the client without polling (stock prices, progress updates, notifications, live charts).

### What You'll Learn
- Server-Sent Events (SSE) integration
- Publishing widget updates from background services
- Creating SSE-powered widgets
- Real-time data streaming

### Step-by-Step

#### Step 1: Create a Custom SSE Widget

```csharp
public record ClockWidget(string Label, string StreamId) 
    : ChatWidget(Label, "clock_action")
{
    public override string Purpose => "Displays real-time clock updates via SSE";
}
```

#### Step 2: Register Widget and Stream Validation

```csharp
services.AddBbQChatWidgets(options =>
{
    options.ChatClientFactory = sp => chatClient;
    
    options.WidgetRegistryConfigurator = registry =>
    {
        registry.Register(new ClockWidget("Live Clock", "clock-stream"));
    };
    
    options.StreamValidationRules = new StreamValidationRules
    {
        AllowedStreamIds = new[] { "clock-stream", "weather-stream" },
        MaxPublishRatePerMinute = 60
    };
});
```

#### Step 3: Create Background Publisher

```csharp
public class ClockPublisher : BackgroundService
{
    private readonly IWidgetSseService _sseService;
    private readonly ILogger<ClockPublisher> _logger;
    
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var now = DateTime.Now;
                var clockWidget = new ClockWidget(
                    $"🕐 {now:HH:mm:ss}",
                    "clock-stream");
                
                await _sseService.PublishWidgetAsync(
                    "clock-stream",
                    clockWidget,
                    stoppingToken);
                
                await Task.Delay(1000, stoppingToken); // Update every second
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error publishing clock update");
            }
        }
    }
}

// Register in Program.cs
services.AddHostedService<ClockPublisher>();
```

#### Step 4: Frontend Subscribes to Stream

```typescript
import { SseManager } from '@bbq-chat/widgets';

const sseManager = new SseManager('/api/chat/widgets/streams');

// Subscribe to the clock stream
sseManager.subscribe('clock-stream', (widget) => {
    console.log('Clock update:', widget);
    // Update UI with new time
    document.getElementById('clock').textContent = widget.label;
});

// Clean up when done
// sseManager.unsubscribe('clock-stream');
```

#### Step 5: AI Tells User About SSE Widget

When the user asks "Show me a live clock", the LLM responds:

```xml
I'll show you a real-time clock that updates every second:

<widget type="clock" label="Live Clock" streamId="clock-stream" />

The clock will update automatically via Server-Sent Events.
```

### Advanced: Progress Updates

Perfect for long-running operations:

```csharp
public class FileUploadService
{
    private readonly IWidgetSseService _sseService;
    
    public async Task UploadFileAsync(Stream fileStream, string streamId)
    {
        var totalBytes = fileStream.Length;
        var uploadedBytes = 0L;
        var buffer = new byte[8192];
        
        while (uploadedBytes < totalBytes)
        {
            var bytesRead = await fileStream.ReadAsync(buffer);
            uploadedBytes += bytesRead;
            
            var progress = (int)((uploadedBytes / (double)totalBytes) * 100);
            
            // Push progress update
            var progressWidget = new ProgressBarWidget(
                "Uploading...",
                "upload_progress",
                progress,
                $"{uploadedBytes:N0} / {totalBytes:N0} bytes");
            
            await _sseService.PublishWidgetAsync(streamId, progressWidget);
        }
        
        // Send completion widget
        var completeWidget = new ButtonWidget("View File", "view_uploaded_file");
        await _sseService.PublishWidgetAsync(streamId, completeWidget);
    }
}
```

### Try It Out

Run the [React Sample](../../Sample/BbQ.ChatWidgets.Sample.React/) with SSE:

```bash
cd Sample/BbQ.ChatWidgets.Sample.React
dotnet run

# Try: "Show me a live clock" or "Show me live weather"
```

---

## 4. Widget Actions & Interactions

### Scenario
Handle user clicks, form submissions, and custom widget interactions on the server.

### What You'll Learn
- Creating typed action handlers
- Passing payloads with actions
- Chaining widgets (one action triggers another widget)
- Error handling and validation

### Step-by-Step

#### Step 1: Simple Button Action (No Payload)

```csharp
public record ApproveAction : IWidgetAction<ApprovePayload>
{
    public string ActionId => "approve_request";
}

public record ApprovePayload(); // Empty payload for simple button

public class ApproveHandler : IActionWidgetActionHandler<ApproveAction, ApprovePayload>
{
    public async Task<string> HandleAsync(
        ApproveAction action,
        ApprovePayload payload,
        string threadId,
        CancellationToken cancellationToken)
    {
        // Process approval
        await Task.Delay(100, cancellationToken);
        
        return """
            ✅ Request approved!
            
            <widget>
            {
                "type": "button",
                "label": "View Details",
                "action": "view_details"
            }
            </widget>
            <widget>
            {
                "type": "button",
                "label": "Notify User",
                "action": "send_notification"
            }
            </widget>
            """;
    }
}
```

#### Step 2: Action with Payload Data

```csharp
public record SelectPlanAction : IWidgetAction<SelectPlanPayload>
{
    public string ActionId => "select_plan";
}

public record SelectPlanPayload(string PlanId, string PlanName, decimal Price);

public class SelectPlanHandler : IActionWidgetActionHandler<SelectPlanAction, SelectPlanPayload>
{
    public async Task<string> HandleAsync(
        SelectPlanAction action,
        SelectPlanPayload payload,
        string threadId,
        CancellationToken cancellationToken)
    {
        return $"""
            You've selected the **{payload.PlanName}** plan at ${payload.Price}/month.
            
            <widget>
            {{
                "type": "form",
                "title": "Complete Purchase",
                "action": "confirm_purchase",
                "fields": [
                    {{"name": "cardNumber", "label": "Card Number", "type": "input", "required": true, "placeholder": "1234 5678 9012 3456"}},
                    {{"name": "expiry", "label": "Expiry", "type": "input", "required": true, "placeholder": "MM/YY"}},
                    {{"name": "cvv", "label": "CVV", "type": "input", "required": true, "placeholder": "123"}}
                ],
                "actions": [
                    {{"type": "submit", "label": "Confirm"}},
                    {{"type": "cancel", "label": "Cancel"}}
                ]
            }}
            </widget>
            """;
    }
}
```

#### Step 3: Action Chaining (Multi-Step Flow)

```csharp
// Step 1: Show plans
public class ShowPlansHandler : IActionWidgetActionHandler<ShowPlansAction, ShowPlansPayload>
{
    public async Task<string> HandleAsync(...)
    {
        return """
            Choose your plan:
            
            <widget>
            {
                "type": "card",
                "title": "Basic",
                "description": "$9/month",
                "label": "Select",
                "action": "select_plan"
            }
            </widget>
            
            <widget>
            {
                "type": "card",
                "title": "Pro",
                "description": "$29/month",
                "label": "Select",
                "action": "select_plan"
            }
            </widget>
            """;
    }
}

// Step 2: Select plan (see above)

// Step 3: Confirm purchase
public class ConfirmPurchaseHandler : IActionWidgetActionHandler<ConfirmPurchaseAction, ConfirmPurchasePayload>
{
    public async Task<string> HandleAsync(...)
    {
        // Process payment...
        
        return """
            🎉 Payment successful! Welcome to the Pro plan.
            
            <widget>
            {
                "type": "button",
                "label": "Go to Dashboard",
                "action": "open_dashboard"
            }
            </widget>
            """;
    }
}
```

#### Step 4: Register All Handlers

```csharp
services.AddBbQChatWidgets(options =>
{
    var registry = options.ActionRegistry;
    
    registry.RegisterHandler<ApproveAction, ApprovePayload, ApproveHandler>();
    registry.RegisterHandler<SelectPlanAction, SelectPlanPayload, SelectPlanHandler>();
    registry.RegisterHandler<ShowPlansAction, ShowPlansPayload, ShowPlansHandler>();
    registry.RegisterHandler<ConfirmPurchaseAction, ConfirmPurchasePayload, ConfirmPurchaseHandler>();
});
```

#### Step 5: Error Handling

```csharp
public class PaymentHandler : IActionWidgetActionHandler<PaymentAction, PaymentPayload>
{
    public async Task<string> HandleAsync(...)
    {
        try
        {
            await ProcessPaymentAsync(payload);
            return "✅ Payment successful!";
        }
        catch (PaymentFailedException ex)
        {
            return $"""
                ❌ Payment failed: {ex.Message}
                
                <widget>
                {{
                    "type": "button",
                    "label": "Try Again",
                    "action": "retry_payment"
                }}
                </widget>
                <widget>
                {{
                    "type": "button",
                    "label": "Contact Support",
                    "action": "contact_support"
                }}
                </widget>
                """;
        }
    }
}
```

### Try It Out

Run any of the samples and interact with buttons:

```bash
cd Sample/BbQ.ChatWidgets.Sample.Console
dotnet run

# Try: "Show me some buttons"
# Click the buttons to trigger actions
```

---

## 📚 Next Steps

- **[Custom Widgets Guide](../guides/CUSTOM_WIDGETS.md)** - Build your own widget types
- **[Custom Action Handlers](../guides/CUSTOM_ACTION_HANDLERS.md)** - Advanced action handling
- **[Chat History Summarization](../guides/CHAT_HISTORY_SUMMARIZATION.md)** - Manage long conversations
- **[Triage Agents Deep Dive](../guides/TRIAGE_AGENTS.md)** - Advanced routing patterns

---

## 🔗 Sample Projects

All tutorials reference these working samples:

- [Console Sample](../../Sample/BbQ.ChatWidgets.Sample.Console/) - Command-line chat with triage
- [React Sample](../../Sample/BbQ.ChatWidgets.Sample.React/) - Web UI with forms and SSE
- [Angular Sample](../../Sample/BbQ.ChatWidgets.Sample.Angular/) - Angular components
- [Blazor Sample](../../Sample/BbQ.ChatWidgets.Sample.Blazor/) - Server-side Blazor

Each sample includes multiple use cases and is fully runnable.
