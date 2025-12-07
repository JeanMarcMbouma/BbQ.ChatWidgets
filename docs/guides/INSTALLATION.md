# Installation Guide

Complete step-by-step guide to install and set up BbQ.ChatWidgets in your project.

## Overview

This guide will walk you through:
1. Installing the NuGet package
2. Registering services in your ASP.NET Core application
3. Configuring your AI chat client
4. Setting up API endpoints
5. Verifying the installation

## Prerequisites

Before you start, you need:
- **.NET 8** or higher
- **ASP.NET Core** project (Web API or MVC)
- **An AI Chat Client** (OpenAI, Claude, etc.)
- **NuGet** package manager access

## Step 1: Install the NuGet Package

### Using .NET CLI

```bash
dotnet add package BbQ.ChatWidgets
```

### Using Package Manager

```powershell
Install-Package BbQ.ChatWidgets
```

### Using Visual Studio

1. Right-click project ? **Manage NuGet Packages**
2. Search for **BbQ.ChatWidgets**
3. Click **Install**

### Verify Installation

After installation, verify in your `.csproj` file:

```xml
<ItemGroup>
    <PackageReference Include="BbQ.ChatWidgets" Version="1.0.0" />
</ItemGroup>
```

## Step 2: Install AI Chat Client

You need an AI chat client. Here are common options:

### OpenAI (Most Common)

```bash
dotnet add package OpenAI
```

### Azure OpenAI

```bash
dotnet add package Azure.AI.OpenAI
```

### Other Providers

- Claude: Check Anthropic's documentation
- Local models: Use compatible SDKs

## Step 3: Register Services

In your `Program.cs`, add the following:

```csharp
using BbQ.ChatWidgets.Extensions;
using Microsoft.Extensions.AI;

var builder = WebApplication.CreateBuilder(args);

// Configure your AI chat client
var openaiClient = new OpenAI.Chat.ChatClient(
    modelId: "gpt-4o-mini",
    apiKey: builder.Configuration["OpenAI:ApiKey"]
).AsIChatClient();

// Optionally wrap with function invocation
var chatClient = new ChatClientBuilder(openaiClient)
    .UseFunctionInvocation()
    .Build();

// Register BbQ.ChatWidgets services
builder.Services.AddBbQChatWidgets(options =>
{
    options.RoutePrefix = "/api/chat";  // API route prefix
    options.ChatClientFactory = sp => chatClient;
});

var app = builder.Build();

// Map the chat endpoints
app.MapBbQChatEndpoints();

app.Run();
```

## Step 4: Configure API Keys

Store your API keys securely. In `appsettings.json`:

```json
{
  "OpenAI": {
    "ApiKey": "sk-..."
  }
}
```

Or use **User Secrets** for development:

```bash
dotnet user-secrets set "OpenAI:ApiKey" "sk-..."
```

## Step 5: Test the Installation

### Using HTTP Client (PowerShell)

```powershell
$body = @{
    message = "Hello"
    threadId = $null
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/chat/message" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

### Using curl

```bash
curl -X POST "http://localhost:5000/api/chat/message" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","threadId":null}'
```

### Expected Response

```json
{
  "role": "assistant",
  "content": "Hello! How can I help you today?",
  "widgets": [],
  "threadId": "abc-123-def"
}
```

## Step 6: Add to Your Frontend

### JavaScript/TypeScript

```javascript
// Send a message
async function sendMessage(message, threadId = null) {
    const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, threadId })
    });
    
    return await response.json();
}

// Handle widget action
async function handleWidgetAction(action, payload, threadId) {
    const response = await fetch('/api/chat/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload, threadId })
    });
    
    return await response.json();
}

// Example usage
const response = await sendMessage("What widgets are available?");
console.log(response.content);
console.log(response.widgets);
```

### HTML Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>Chat Widget Example</title>
</head>
<body>
    <div id="chat-container">
        <div id="messages"></div>
        <input type="text" id="message-input" placeholder="Your message...">
        <button onclick="sendMessage()">Send</button>
    </div>

    <script>
        let threadId = null;

        async function sendMessage() {
            const message = document.getElementById('message-input').value;
            
            const response = await fetch('/api/chat/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, threadId })
            });
            
            const data = await response.json();
            threadId = data.threadId;
            
            // Display message and widgets
            displayMessage(data.content);
            displayWidgets(data.widgets);
            
            document.getElementById('message-input').value = '';
        }

        function displayMessage(content) {
            const div = document.createElement('div');
            div.textContent = content;
            document.getElementById('messages').appendChild(div);
        }

        function displayWidgets(widgets) {
            widgets.forEach(widget => {
                // Render widgets based on type
                const div = document.createElement('div');
                div.textContent = `[Widget: ${widget.type}]`;
                document.getElementById('messages').appendChild(div);
            });
        }
    </script>
</body>
</html>
```

## Troubleshooting

### Error: "Cannot find package BbQ.ChatWidgets"
- Ensure you're using a compatible NuGet source
- Check your internet connection
- Try: `dotnet nuget add source https://api.nuget.org/v3/index.json`

### Error: "ChatClient not configured"
- Verify `ChatClientFactory` is set in options
- Check AI service is properly registered

### Error: "API endpoints not found"
- Ensure `app.MapBbQChatEndpoints()` is called
- Check route prefix matches your frontend requests

### Error: "401 Unauthorized from AI service"
- Verify API key is correct in appsettings
- Check API key hasn't expired
- Confirm correct API key for your region

### Widgets not appearing
- Verify AI model supports function calling
- Check widget tools are registered
- Review AI response format

## Next Steps

- **[Configuration Guide](CONFIGURATION.md)** - Configure all options
- **[Getting Started](../GETTING_STARTED.md)** - Quick start
- **[Examples](../examples/)** - See working code
- **[API Reference](../api/)** - Detailed API documentation

---

**Back to:** [Guides](README.md) | [Documentation Index](../INDEX.md)
