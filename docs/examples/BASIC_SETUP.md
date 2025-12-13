This basic setup example has been consolidated into `docs/GETTING_STARTED.md` and `docs/examples/README.md`.
# Basic Setup Example

A minimal, working example to get BbQ.ChatWidgets running in 10 minutes.

## Overview

This example shows the minimal setup needed to:
- Install BbQ.ChatWidgets
- Configure OpenAI
- Create a chat interface
- Send and receive messages

## Setup

### Prerequisites
- .NET 8 or higher
- OpenAI API key
- A code editor (VS Code or Visual Studio)

### Step 1: Create Project

```bash
dotnet new web -n ChatWidgetExample
cd ChatWidgetExample
dotnet add package BbQ.ChatWidgets
dotnet add package OpenAI
```

## Code: Program.cs

```csharp
using BbQ.ChatWidgets.Extensions;
using Microsoft.Extensions.AI;
using OpenAI.Chat;

var builder = WebApplication.CreateBuilder(args);

// Configure OpenAI
var apiKey = builder.Configuration["OpenAI:ApiKey"];
var openaiClient = new ChatClient("gpt-4o-mini", apiKey)
    .AsIChatClient();

// Register BbQ.ChatWidgets
builder.Services.AddBbQChatWidgets(options =>
{
    options.ChatClientFactory = sp => openaiClient;
});

var app = builder.Build();
app.UseStaticFiles();
app.MapBbQChatEndpoints();
app.Run();
```

## Code: appsettings.json

```json
{
  "OpenAI": {
    "ApiKey": "sk-your-key-here"
  }
}
```

## Code: wwwroot/index.html

```html
<!DOCTYPE html>
<html>
<head>
    <title>Chat Widget</title>
    <style>
        body { font-family: Arial; max-width: 600px; margin: 50px auto; }
        #messages { border: 1px solid #ccc; height: 400px; 
                    overflow-y: auto; padding: 10px; margin-bottom: 10px; }
        .user { text-align: right; color: blue; }
        .assistant { text-align: left; color: green; }
        input { width: 80%; padding: 8px; }
        button { padding: 8px 15px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>Chat Assistant</h1>
    <div id="messages"></div>
    <div>
        <input type="text" id="input" placeholder="Your message...">
        <button onclick="send()">Send</button>
    </div>

    <script>
        let threadId = null;

        async function send() {
            const msg = document.getElementById('input').value;
            if (!msg) return;

            document.getElementById('input').value = '';
            addMessage(msg, 'user');

            try {
                const res = await fetch('/api/chat/message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: msg, threadId })
                });
                const data = await res.json();
                threadId = data.threadId;
                addMessage(data.content, 'assistant');
            } catch (e) {
                addMessage('Error: ' + e.message, 'assistant');
            }
        }

        function addMessage(text, role) {
            const div = document.createElement('div');
            div.className = role;
            div.textContent = text;
            document.getElementById('messages').appendChild(div);
        }

        document.getElementById('input')
            .addEventListener('keypress', e => {
                if (e.key === 'Enter') send();
            });
    </script>
</body>
</html>
```

## Try It

### 1. Set API Key
```bash
dotnet user-secrets set "OpenAI:ApiKey" "sk-..."
```

### 2. Run
```bash
dotnet run
```

### 3. Open Browser
Navigate to `http://localhost:5000`

### 4. Chat
Type messages and interact with the assistant.

## What Happens

1. **User sends message** ? `POST /api/chat/message`
2. **Backend calls AI** ? OpenAI generates response
3. **Return to frontend** ? Display message and widgets
4. **User interacts** ? `POST /api/chat/action`
5. **Loop continues** ? Chat continues

## Next Steps

- **[ADVANCED_CONFIGURATION.md](ADVANCED_CONFIGURATION.md)** - Add custom widgets/tools
- **[guides/CONFIGURATION.md](../guides/CONFIGURATION.md)** - Configure options
- **[guides/CUSTOM_WIDGETS.md](../guides/CUSTOM_WIDGETS.md)** - Create custom widgets

---

**Back to:** [Examples](README.md) | [Documentation Index](../INDEX.md)
