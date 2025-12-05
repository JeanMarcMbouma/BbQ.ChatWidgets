# BbQ.ChatWidgets Installation and Setup Guide

Complete guide for installing and setting up BbQ.ChatWidgets with CSS themes.

## Table of Contents

1. [Installation](#installation)
2. [Quick Setup (5 Minutes)](#quick-setup-5-minutes)
3. [Detailed Setup](#detailed-setup)
4. [CSS Theme Setup](#css-theme-setup)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

---

## Installation

### Via NuGet Package Manager (Visual Studio)

1. Open Visual Studio
2. Tools ? NuGet Package Manager ? Manage NuGet Packages for Solution
3. Search for "BbQ.ChatWidgets"
4. Click Install on the desired project

### Via Package Manager Console

```powershell
Install-Package BbQ.ChatWidgets
```

### Via .NET CLI

```bash
dotnet add package BbQ.ChatWidgets
```

### Via Visual Studio (Command Line)

```cmd
nuget install BbQ.ChatWidgets
```

---

## Quick Setup (5 Minutes)

### Step 1: Install NuGet Package

```bash
dotnet add package BbQ.ChatWidgets
```

### Step 2: Copy Themes to Your Project

**Windows (Batch):**
```cmd
copy-themes.bat
```

**Windows/Mac/Linux (PowerShell):**
```powershell
.\copy-themes.ps1
```

**Manual Copy:**
- Locate NuGet package in `%USERPROFILE%\.nuget\packages\bbq.chatwidgets`
- Copy `contentFiles\any\any\themes\` to your `wwwroot\themes\` directory

### Step 3: Register Services

Edit `Program.cs`:

```csharp
using BbQ.ChatWidgets.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Add BbQ ChatWidgets
builder.Services.AddBbQChatWidgets(options => {
    options.RoutePrefix = "/api/chat";
    options.ChatClientFactory = sp => new YourChatClient();
});

var app = builder.Build();

// Map endpoints
app.MapBbQChatEndpoints();

app.Run();
```

### Step 4: Create HTML Page

Create `Pages/Chat.html` or `wwwroot/chat.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>BbQ Chat Widgets</title>
    
    <!-- Include CSS theme (choose one) -->
    <link rel="stylesheet" href="/themes/bbq-chat-light.css">
</head>
<body>
    <div id="chat-container" style="max-width: 800px; margin: 0 auto; padding: 20px;">
        <!-- Chat widgets will be rendered here -->
    </div>

    <script>
        // Send a message
        async function sendMessage(message) {
            const response = await fetch('/api/chat/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    threadId: null
                })
            });

            const data = await response.json();
            console.log('Response:', data);
            
            // Render widgets here
            if (data.widgets) {
                renderWidgets(data.widgets);
            }
        }

        // Handle widget actions
        async function handleWidgetAction(action, payload) {
            const response = await fetch('/api/chat/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: action,
                    payload: payload,
                    threadId: currentThreadId
                })
            });

            const data = await response.json();
            console.log('Action response:', data);
        }

        // Example usage
        document.addEventListener('DOMContentLoaded', () => {
            sendMessage('Hello, what can you help me with?');
        });
    </script>
</body>
</html>
```

### Step 5: Run Your Application

```bash
dotnet run
```

Navigate to `https://localhost:5001/chat.html` (or your configured port)

---

## Detailed Setup

### Project Structure

After installation, your project should look like this:

```
MyProject/
??? wwwroot/
?   ??? themes/
?   ?   ??? bbq-chat-light.css
?   ?   ??? bbq-chat-dark.css
?   ?   ??? bbq-chat-corporate.css
?   ?   ??? README.md
?   ??? css/
?   ??? js/
?   ??? index.html
??? Pages/
??? Services/
??? Program.cs
??? MyProject.csproj
```

### Configuration Options

Edit `Program.cs` to customize behavior:

```csharp
builder.Services.AddBbQChatWidgets(options => {
    // Set custom API route prefix
    options.RoutePrefix = "/api/v2/chat";
    
    // Provide chat client factory
    options.ChatClientFactory = sp => 
        new OllamaChatClient(
            new Uri("http://localhost:11434"),
            "neural-chat:7b"
        );
    
    // Provide custom action handler
    options.ActionHandlerFactory = sp =>
        new YourCustomActionHandler(
            sp.GetRequiredService<IDatabase>()
        );
});
```

### Environment-Specific Configuration

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddBbQChatWidgets(options => {
    if (builder.Environment.IsDevelopment()) {
        options.RoutePrefix = "/api/dev/chat";
    } else {
        options.RoutePrefix = "/api/chat";
    }
    
    // Use different chat client based on environment
    options.ChatClientFactory = sp => {
        return builder.Environment.IsDevelopment()
            ? new MockChatClient()
            : new ProductionChatClient();
    };
});
```

---

## CSS Theme Setup

### Switching Themes

#### Static Theme (in HTML)

```html
<!-- Light theme -->
<link rel="stylesheet" href="/themes/bbq-chat-light.css">

<!-- OR Dark theme -->
<link rel="stylesheet" href="/themes/bbq-chat-dark.css">

<!-- OR Corporate theme -->
<link rel="stylesheet" href="/themes/bbq-chat-corporate.css">
```

#### Dynamic Theme Switching (JavaScript)

```javascript
function switchTheme(themeName) {
    const validThemes = ['light', 'dark', 'corporate'];
    
    if (!validThemes.includes(themeName)) {
        console.error('Invalid theme:', themeName);
        return;
    }
    
    const link = document.querySelector('link[href*="bbq-chat"]');
    link.href = `/themes/bbq-chat-${themeName}.css`;
    
    // Save preference to localStorage
    localStorage.setItem('preferred-theme', themeName);
}

// Restore saved theme on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('preferred-theme') || 'light';
    switchTheme(savedTheme);
});
```

#### Respect System Preferences

```javascript
// Use system theme preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const theme = prefersDark ? 'dark' : 'light';
switchTheme(theme);

// Listen for changes
window.matchMedia('(prefers-color-scheme: dark)').addListener((e) => {
    switchTheme(e.matches ? 'dark' : 'light');
});
```

### Custom Theme

Create `wwwroot/themes/custom-theme.css`:

```css
/* Import base theme */
@import url('/themes/bbq-chat-light.css');

/* Override colors */
:root {
    --brand-primary: #your-brand-color;
    --brand-secondary: #your-secondary-color;
}

.bbq-button {
    background-color: var(--brand-primary);
    border-color: var(--brand-primary);
}

.bbq-button:hover {
    background-color: color-mix(in srgb, var(--brand-primary) 80%, black);
}

/* Add your custom styles */
.bbq-card {
    border-radius: 12px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}
```

---

## Verification

### Verify Installation

Check that files are in the correct location:

```bash
# Check themes directory exists
ls wwwroot/themes/

# You should see:
# - bbq-chat-light.css
# - bbq-chat-dark.css
# - bbq-chat-corporate.css
# - README.md
```

### Verify Services Registration

Test with this endpoint:

```bash
# Should return 200 if services are registered correctly
curl -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","threadId":null}'
```

### Verify CSS Loading

In browser developer tools (F12):

1. Open Network tab
2. Refresh page
3. Look for `bbq-chat-light.css` (or your theme)
4. Status should be 200

In Console tab:

```javascript
// Check if styles are applied
const button = document.querySelector('.bbq-button');
const styles = window.getComputedStyle(button);
console.log('Button color:', styles.backgroundColor); // Should show color
```

---

## Troubleshooting

### Theme Files Not Found (404 Error)

**Problem:** CSS files return 404 in Network tab

**Solution:**

1. Verify files are in correct location:
   ```bash
   ls wwwroot/themes/bbq-chat-*.css
   ```

2. Check file permissions:
   ```bash
   # On Unix/Linux/Mac
   chmod 644 wwwroot/themes/bbq-chat-*.css
   ```

3. Rebuild and restart:
   ```bash
   dotnet clean
   dotnet build
   dotnet run
   ```

### Styles Not Applying

**Problem:** CSS loads (200 status) but styles don't apply

**Solution:**

1. **Clear browser cache:**
   - Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
   - Clear all cached files
   - Reload page

2. **Check CSS specificity:**
   ```css
   /* Override with higher specificity */
   html body .bbq-button {
       background-color: your-color;
   }
   ```

3. **Verify correct theme:**
   ```javascript
   // Check which theme is loaded
   const link = document.querySelector('link[href*="bbq-chat"]');
   console.log('Current theme:', link.href);
   ```

### Services Not Registered

**Problem:** 404 on `/api/chat/message` endpoint

**Solution:**

1. Verify `Program.cs` has:
   ```csharp
   builder.Services.AddBbQChatWidgets(...);
   app.MapBbQChatEndpoints();
   ```

2. Check route prefix:
   ```csharp
   // If you set custom prefix
   options.RoutePrefix = "/api/v2/chat";
   // Then endpoint is: POST /api/v2/chat/message
   ```

3. Verify application is running:
   ```bash
   # Check if server is listening
   curl http://localhost:5000/health
   ```

### Chat Client Not Configured

**Problem:** 500 error when sending messages

**Solution:**

1. Provide chat client factory:
   ```csharp
   options.ChatClientFactory = sp => new YourChatClient();
   ```

2. Verify chat client dependency is available:
   ```csharp
   builder.Services.AddSingleton<IYourChatClientService>(
       sp => new YourChatClientService()
   );
   ```

3. Check application logs for errors:
   ```bash
   # Run with detailed logging
   ASPNETCORE_ENVIRONMENT=Development dotnet run --verbose
   ```

---

## Next Steps

After setup is complete:

1. **Read Documentation**
   - See `themes/README.md` for theme documentation
   - See `NUGET_INTEGRATION_GUIDE.md` for advanced setup

2. **Customize Theme**
   - Create custom CSS file
   - Override colors and styles
   - Add your branding

3. **Implement Widget Rendering**
   - Create renderer for your framework (React, Vue, etc.)
   - Handle widget actions
   - Store conversation state

4. **Deploy**
   - Test on staging environment
   - Verify CSS loads correctly
   - Deploy to production

---

## Support

### Documentation Files

- **themes/README.md** - CSS theme documentation
- **NUGET_INTEGRATION_GUIDE.md** - NuGet package details
- **README_WIDGETS.md** - Widget documentation
- **AI_PROMPT_GUIDE.md** - AI model integration guide

### Common Questions

**Q: Can I use multiple themes?**
A: Yes, load themes on demand using JavaScript theme switching.

**Q: Do I need to modify the CSS?**
A: No, but you can create custom themes by overriding styles.

**Q: What browsers are supported?**
A: All modern browsers (Chrome, Firefox, Safari, Edge) and mobile browsers.

**Q: Can I use with my CSS framework?**
A: Yes, you can combine with Bootstrap, Tailwind, etc.

---

**Status**: ? Ready to Use

Your BbQ.ChatWidgets installation is complete and ready for development!
