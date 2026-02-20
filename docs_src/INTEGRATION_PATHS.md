# Integration Paths

Choose the right integration approach for your application stack and requirements.

## 🤔 Decision Matrix

Use this guide to pick the best integration path for your project:

| Your Stack | Best Integration | What You Get | Complexity |
|------------|------------------|--------------|------------|
| **ASP.NET Core API + React/Vue/Vanilla JS** | .NET Backend + JS Client | Full flexibility, framework-agnostic | ⭐⭐ Medium |
| **ASP.NET Core API + Angular** | .NET Backend + Angular Client | Type-safe Angular components | ⭐⭐ Medium |
| **Blazor Server** | .NET Backend + Blazor Components | Full .NET stack, no JS needed | ⭐ Easy |
| **Pure JavaScript (Node.js backend)** | JS-only (consume .NET API) | Frontend-first, backend agnostic | ⭐⭐⭐ Advanced |
| **Existing .NET app** | .NET-only (extend current app) | Add chat to existing project | ⭐ Easy |

---

## 📋 Integration Scenarios

### 1️⃣ .NET Backend + JavaScript/TypeScript Client

**Best for**: Modern web applications with separate frontend and backend

**What you need**:
- ASP.NET Core 8+ backend
- Any frontend framework (React, Vue, Svelte, etc.) or vanilla JS

#### Backend Setup (.NET)

```csharp
using Microsoft.Extensions.AI;
using BbQ.ChatWidgets.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Configure chat client with function invocation
var apiKey = builder.Configuration["OpenAI:ApiKey"] 
    ?? throw new InvalidOperationException("OpenAI:ApiKey not configured");
    
IChatClient chatClient = new ChatClientBuilder(
    new OpenAI.Chat.ChatClient("gpt-4o-mini", apiKey).AsIChatClient())
    .UseFunctionInvocation()
    .Build();

// Register BbQ services
builder.Services.AddBbQChatWidgets(options => {
    options.ChatClientFactory = _ => chatClient;
    options.RoutePrefix = "/api/chat";
  options.EnablePersona = true; // optional, disabled by default
});

var app = builder.Build();
app.MapBbQChatEndpoints(); // Creates /api/chat/message, /api/chat/action, etc.
app.Run();
```

#### Frontend Setup (JS/TS)

```bash
npm install @bbq-chat/widgets
```

```typescript
import { WidgetManager } from '@bbq-chat/widgets';
import '@bbq-chat/widgets/dist/styles/theme.css'; // Optional: default theme

const manager = new WidgetManager();

async function sendMessage(text: string) {
    const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, threadId: 'user-123' })
    });
    
    const turn = await response.json();
    
    // Render widgets
    const container = document.getElementById('chat-widgets');
    turn.widgets?.forEach(widget => manager.render(widget, container));
}
```

**Pros**:
- ✅ Framework-agnostic frontend
- ✅ Full control over UI/UX
- ✅ Can integrate with any JS framework

**Cons**:
- ❌ More manual wiring
- ❌ Need to handle widget actions yourself

**Sample**: [React Sample](../Sample/BbQ.ChatWidgets.Sample.React/)

---

### 2️⃣ .NET Backend + Angular Client

**Best for**: Angular applications that want native Angular components

**What you need**:
- ASP.NET Core 8+ backend
- Angular 15+ frontend

#### Backend Setup (.NET)

Same as scenario #1 above.

#### Frontend Setup (Angular)

```bash
npm install @bbq-chat/widgets @bbq-chat/widgets-angular
```

**app.component.ts**:
```typescript
import { Component } from '@angular/core';
import { ChatWidgetsModule } from '@bbq-chat/widgets-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ChatWidgetsModule],
  template: `
    <bbq-chat-widget 
      [apiEndpoint]="'/api/chat'"
      [threadId]="'user-123'"
      [enableStreaming]="true"
      (widgetAction)="onWidgetAction($event)">
    </bbq-chat-widget>
  `
})
export class AppComponent {
  onWidgetAction(event: any) {
    console.log('Widget action:', event);
  }
}
```

**Pros**:
- ✅ Native Angular components and services
- ✅ Type-safe with TypeScript
- ✅ Reactive bindings with RxJS
- ✅ Pre-built chat UI

**Cons**:
- ❌ Angular-only (can't use in React/Vue)

**Sample**: [Angular Sample](../Sample/BbQ.ChatWidgets.Sample.Angular/)

---

### 3️⃣ Blazor Server Integration

**Best for**: Full .NET stack with server-side rendering

**What you need**:
- ASP.NET Core 8+ with Blazor Server
- No JavaScript needed

#### Setup

```bash
dotnet add package BbQ.ChatWidgets
dotnet add package BbQ.ChatWidgets.Blazor
```

**Program.cs**:
```csharp
using Microsoft.Extensions.AI;
using BbQ.ChatWidgets.Extensions;
using BbQ.ChatWidgets.Blazor;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddRazorComponents()
    .AddInteractiveServerComponents();

// Configure chat client
IChatClient chatClient = new ChatClientBuilder(
    new OpenAI.Chat.ChatClient("gpt-4o-mini", apiKey).AsIChatClient())
    .UseFunctionInvocation()
    .Build();

builder.Services.AddBbQChatWidgets(options => 
    options.ChatClientFactory = _ => chatClient);

var app = builder.Build();

app.MapBbQChatEndpoints();
app.MapRazorComponents<App>()
   .AddInteractiveServerRenderMode();

app.Run();
```

**ChatComponent.razor**:
```razor
@using BbQ.ChatWidgets.Blazor
@inject ChatWidgetService ChatService

<BbqChatWidget ThreadId="@threadId" />

@code {
    private string threadId = "blazor-user-123";
}
```

**Pros**:
- ✅ Pure .NET/C# - no JavaScript required
- ✅ Server-side rendering
- ✅ Tight integration with Blazor

**Cons**:
- ❌ Requires SignalR connection
- ❌ Not suitable for static hosting

**Sample**: [Blazor Sample](../Sample/BbQ.ChatWidgets.Sample.Blazor/)

---

### 4️⃣ JavaScript-Only (No .NET Backend)

**Best for**: Frontend-first applications or existing Node.js backends

**What you need**:
- Your own backend API that wraps OpenAI/Azure OpenAI
- Frontend framework of choice

#### Approach

Since BbQ.ChatWidgets' .NET backend provides the widget orchestration layer, you have two options:

**Option A**: Host a minimal .NET API just for chat
- Deploy a small ASP.NET Core service with BbQ.ChatWidgets
- Your main app calls this service's `/api/chat` endpoints
- Best for microservices architectures

**Option B**: Implement widget logic in your backend
- Use `@bbq-chat/widgets` for frontend rendering
- Implement your own backend that follows the BbQ chat API contract:
  - `POST /api/chat/message` → Returns `ChatTurn` with widgets
  - `POST /api/chat/action` → Handles widget actions
- More work, but fully customizable

**Example API Contract** (if implementing your own):
```typescript
// POST /api/chat/message
interface MessageRequest {
  message: string;
  threadId?: string;
  persona?: string; // requires options.EnablePersona = true on the backend
}

interface ChatTurn {
  content: string;
  widgets?: Widget[]; // See @bbq-chat/widgets for Widget type definitions
  threadId: string;
}

// POST /api/chat/action
interface ActionRequest {
  action: string;
  payload?: any;
  threadId: string;
}
```

**Pros**:
- ✅ Use any backend technology
- ✅ Frontend-first development

**Cons**:
- ❌ More implementation work
- ❌ Miss out on .NET-specific features (triage agents, etc.)

---

### 5️⃣ .NET-Only (Extend Existing App)

**Best for**: Adding chat to an existing .NET application

**What you need**:
- Existing ASP.NET Core application
- Access to modify `Program.cs` and add services

#### Setup

```bash
dotnet add package BbQ.ChatWidgets
```

```csharp
// In your existing Program.cs or Startup.cs
using BbQ.ChatWidgets.Extensions;

// Add to your existing service registration
builder.Services.AddBbQChatWidgets(options => {
    options.ChatClientFactory = sp => /* your chat client */;
    options.RoutePrefix = "/api/chat"; // or any prefix you prefer
});

// Add to your existing app configuration
app.MapBbQChatEndpoints();
```

Then integrate with your existing frontend (jQuery, MVC views, etc.) by calling the endpoints.

**Pros**:
- ✅ Minimal changes to existing app
- ✅ Reuse existing infrastructure
- ✅ Gradual adoption

**Cons**:
- ❌ May need to adapt to existing architecture
- ❌ Limited if frontend is very old (no fetch/AJAX)

---

## 🔀 Mix-and-Match

You can combine approaches! For example:

- **Multi-platform**: One .NET backend serving both Angular and React clients
- **Hybrid**: Blazor Server for admin, React for public-facing chat
- **Microservices**: Dedicated chat service (.NET) consumed by multiple frontend apps

---

## 🚦 Getting Started Steps

### For All Paths

1. **Install packages** (NuGet and/or npm)
2. **Configure chat client** (OpenAI, Azure OpenAI, etc.)
3. **Register services** (`AddBbQChatWidgets`)
4. **Map endpoints** (`MapBbQChatEndpoints`)
5. **Test with a simple message** (use curl, Postman, or browser)

### Next Steps

- 📚 **[Getting Started Guide](GETTING_STARTED.md)** - Detailed setup instructions
- 🎨 **[Widget Gallery](widgets/GALLERY.md)** - See all available widgets
- 🔧 **[Use Cases & Tutorials](examples/USE_CASES.md)** - Real-world scenarios
- 🧑‍💻 **[Sample Projects](../Sample/)** - Working examples for each stack

---

## 💡 Still Not Sure?

Ask yourself:

1. **Do I have a .NET backend?**
   - Yes → Start with scenario #1, #2, or #3
   - No → Go with scenario #4

2. **What's my frontend?**
   - Angular → Scenario #2 (native components)
   - React/Vue/Other → Scenario #1 (framework-agnostic)
   - Blazor → Scenario #3 (full .NET)
   - No preference → Try scenario #1 (most flexible)

3. **Do I want server-side or client-side rendering?**
   - Server-side → Scenario #3 (Blazor Server)
   - Client-side → Scenario #1 or #2

4. **Am I adding to an existing app or starting fresh?**
   - Existing → Scenario #5 (extend)
   - Fresh → Pick based on team skills (Scenario #1, #2, or #3)
