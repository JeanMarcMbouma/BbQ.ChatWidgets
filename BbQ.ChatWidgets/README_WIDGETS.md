## BbQ ChatWidgets - Complete Implementation Guide

### ?? Overview

The BbQ ChatWidgets library provides a framework-agnostic system for embedding interactive widgets in AI chat responses. The core component is the **DefaultWidgetHintParser** which extracts widget definitions from AI model output, combined with the **DefaultWidgetToolsProvider** which enables AI models to understand available widgets.

---

### ?? Quick Start

#### Installation & Setup
```csharp
// In your Startup.cs or Program.cs
services.AddBbQChatWidgets(options => {
    options.RoutePrefix = "/api/chat";
    options.ChatClientFactory = sp => new YourChatClient();
    options.ActionHandlerFactory = sp => new YourActionHandler();
});

// In your middleware
app.MapBbQChatEndpoints();
```

#### Basic Usage
```csharp
var chatService = services.GetRequiredService<ChatWidgetService>();
var response = await chatService.RespondAsync("Show me options", threadId: null, ct);

// response.Content = "Here's what you can do:"
// response.Widgets = [ButtonWidget, DropdownWidget, ...]
```

---

### ?? Available Widgets

| Widget | Purpose | Use Case |
|--------|---------|----------|
| **Button** | Action trigger | Submit, Delete, Confirm, Navigate |
| **Card** | Rich content display | Products, Items, Recommendations |
| **Input** | Text entry | Name, Email, Search, Message |
| **Dropdown** | Single selection | Options, Filters, Categories |
| **Slider** | Range selection | Volume, Price, Rating, Scale |
| **Toggle** | Boolean toggle | Enable/Disable, Yes/No, On/Off |
| **FileUpload** | File selection | Documents, Images, Attachments |

---

### ?? File Structure

```
BbQ.ChatWidgets/
??? Services/
?   ??? DefaultWidgetHintParser.cs      # ? Parses widgets from text
?   ??? DefaultWidgetToolsProvider.cs   # ? Provides tool definitions
?   ??? ChatWidgetService.cs            # Main service orchestrator
?   ??? WidgetRegistry.cs               # Widget type registry
??? Models/
?   ??? ChatWidget.cs                   # Widget definitions
?   ??? ChatTurn.cs                     # Conversation turn
?   ??? BbQStructuredResponse.cs        # Response structure
??? Abstractions/
?   ??? IWidgetHintParser.cs            # Parser interface
?   ??? IWidgetToolsProvider.cs         # Tools provider interface
?   ??? ...other abstractions...
??? Extensions/
?   ??? ServiceCollectionExtensions.cs  # DI registration
??? Documentation/
?   ??? IMPLEMENTATION_SUMMARY.md       # Implementation details
?   ??? AI_PROMPT_GUIDE.md              # AI model instructions
?   ??? WidgetParsing.md                # Parsing specifications
```

---

### ?? Implementation Details

#### DefaultWidgetHintParser
Extracts widget definitions from AI model output using XML markers.

**Input**: 
```
"Click here: <widget>{\"type\":\"button\",\"label\":\"Submit\",\"action\":\"submit\"}</widget>"
```

**Output**:
```csharp
(
  Content: "Click here:",
  Widgets: [ButtonWidget(label: "Submit", action: "submit")]
)
```

**Features**:
- ? Regex-based marker extraction
- ? JSON deserialization with error handling
- ? Support for all 7 widget types
- ? Graceful handling of malformed JSON
- ? Whitespace trimming

#### DefaultWidgetToolsProvider
Provides AI-consumable tool definitions for all widget types.

**Features**:
- ? Template widget generation
- ? Tool caching for performance
- ? JSON schema inclusion
- ? Automatic registration in DI

---

### ?? Workflow Example

```
???????????????????????
?   User Query        ?
? "Show me options"   ?
???????????????????????
           ?
           ?
???????????????????????????????????????
?   AI Model (with tools)             ?
?   - Has widget tool descriptions    ?
?   - Knows all available widgets     ?
?   - Returns text + widget markers   ?
???????????????????????????????????????
           ?
           ?
???????????????????????????????????????
?   ChatWidgetService.RespondAsync()  ?
?   1. Send to AI with tools          ?
?   2. Receive response with widgets  ?
?   3. Parse with HintParser          ?
?   4. Store in thread history        ?
???????????????????????????????????????
           ?
           ?
????????????????????????????????????????
?   Response with Widgets              ?
? Content: "Here are your options:"    ?
? Widgets: [ButtonWidget, Dropdown...]?
????????????????????????????????????????
           ?
           ?
????????????????????????????????????????
?   Frontend Renders Widgets           ?
?   - Display content                  ?
?   - Render interactive widgets       ?
?   - User interacts                   ?
????????????????????????????????????????
           ?
           ?
????????????????????????????????????????
?   Widget Action Triggered            ?
? action="submit_form" payload={...}   ?
????????????????????????????????????????
           ?
           ?
????????????????????????????????????????
?   ChatWidgetService.HandleActionAsync?
?   - Process action with handler      ?
?   - Continue conversation            ?
?   - Return next response             ?
????????????????????????????????????????
```

---

### ?? Widget Format Specifications

#### Minimal Example
```json
{"type":"button","label":"Click","action":"click"}
```

#### Full Example (Card with all options)
```json
{
  "type": "card",
  "label": "View Details",
  "action": "view_product",
  "title": "Product Name",
  "description": "Product description here",
  "imageUrl": "https://example.com/image.jpg"
}
```

#### Complex Example (Dropdown with many options)
```json
{
  "type": "dropdown",
  "label": "Select Priority",
  "action": "set_priority",
  "options": ["Critical", "High", "Medium", "Low"]
}
```

---

### ?? Testing

#### Unit Testing the Parser
```csharp
[Test]
public void Parse_WithValidWidget_ExtractsWidget()
{
    var parser = new DefaultWidgetHintParser();
    var input = "Text <widget>{\"type\":\"button\",\"label\":\"X\",\"action\":\"a\"}</widget>";
    
    var (content, widgets) = parser.Parse(input);
    
    Assert.AreEqual("Text", content);
    Assert.AreEqual(1, widgets.Count);
    Assert.IsInstanceOf<ButtonWidget>(widgets[0]);
}
```

#### Integration Testing
```csharp
[Test]
public async Task ChatService_ReturnedWithWidgets()
{
    var response = await service.RespondAsync("Show widgets", null, ct);
    
    Assert.IsNotNull(response.Widgets);
    Assert.Greater(response.Widgets.Count, 0);
}
```

---

### ?? Configuration

#### Custom Route Prefix
```csharp
services.AddBbQChatWidgets(options => {
    options.RoutePrefix = "/api/v2/chat";  // Default: "/api/chat"
});
```

#### Custom Chat Client
```csharp
services.AddBbQChatWidgets(options => {
    options.ChatClientFactory = sp => 
        new CustomChatClient(sp.GetRequiredService<ILogger>());
});
```

#### Custom Action Handler
```csharp
services.AddBbQChatWidgets(options => {
    options.ActionHandlerFactory = sp => 
        new CustomActionHandler(sp.GetRequiredService<IDatabase>());
});
```

---

### ?? Extensibility

#### Implement Custom Parser
```csharp
public class CustomWidgetParser : IWidgetHintParser
{
    public (string Content, IReadOnlyList<ChatWidget>? Widgets) Parse(string rawModelOutput)
    {
        // Custom parsing logic
    }
}

// Register
services.AddSingleton<IWidgetHintParser, CustomWidgetParser>();
```

#### Implement Custom Tools Provider
```csharp
public class CustomToolsProvider : IWidgetToolsProvider
{
    public IReadOnlyList<WidgetTool> GetTools()
    {
        // Custom tool generation
    }
}

// Register
services.AddSingleton<IWidgetToolsProvider, CustomToolsProvider>();
```

---

### ?? Error Handling

The parser gracefully handles various error scenarios:

| Error | Handling |
|-------|----------|
| Null input | Throws `ArgumentNullException` |
| Malformed JSON | Skips widget, continues parsing |
| Invalid widget type | Skips widget, continues parsing |
| Empty markers | Skips empty content |
| Nested widgets | Parsed based on marker positions |
| No widgets | Returns null for widgets |

---

### ?? Performance Characteristics

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Parse single widget | O(n) | n = response length |
| Parse multiple widgets | O(n) | Linear scan with regex |
| Get tools (first call) | O(1) | Static initialization |
| Get tools (cached) | O(1) | Returns cached list |
| JSON deserialization | O(m) | m = JSON size |

---

### ?? API Endpoints

#### POST /api/chat/message
Send a user message and get response with widgets.

**Request**:
```json
{
  "message": "Show me options",
  "threadId": "optional-thread-id"
}
```

**Response**:
```json
{
  "role": "Assistant",
  "content": "Here are your options:",
  "widgets": [
    {"type": "button", "label": "Option 1", "action": "select_1"},
    {"type": "button", "label": "Option 2", "action": "select_2"}
  ],
  "threadId": "thread-123"
}
```

#### POST /api/chat/action
Handle widget action and get response.

**Request**:
```json
{
  "action": "select_1",
  "payload": {"selected": "value"},
  "threadId": "thread-123"
}
```

**Response**:
```json
{
  "role": "Assistant",
  "content": "You selected option 1.",
  "widgets": null,
  "threadId": "thread-123"
}
```

---

### ?? Documentation Files

1. **IMPLEMENTATION_SUMMARY.md** - Technical implementation details
2. **AI_PROMPT_GUIDE.md** - Instructions for AI model configuration
3. **WidgetParsing.md** - Widget format specifications
4. **README.md** (this file) - Overview and quick start

---

### ? Checklist for Using BbQChatWidgets

- [ ] Install NuGet package
- [ ] Configure in Startup
- [ ] Register DI services
- [ ] Map endpoints
- [ ] Configure AI model with system prompt
- [ ] Test widget generation
- [ ] Implement action handler
- [ ] Create frontend widget renderer
- [ ] Test end-to-end flow
- [ ] Deploy and monitor

---

### ?? Contributing

When extending the library:
1. Follow existing code patterns
2. Add XML documentation
3. Include unit tests
4. Update relevant documentation
5. Ensure backward compatibility

---

### ?? License

See LICENSE file in repository.

---

### ?? Support

For issues or questions:
1. Check documentation files
2. Review examples in tests
3. File GitHub issue with reproduction
4. Include error messages and logs

---

### ?? Summary

The DefaultWidgetHintParser and DefaultWidgetToolsProvider provide a complete, production-ready solution for embedding interactive widgets in AI-generated chat responses. They're designed to be:

- ? **Easy to use** - Simple API, sensible defaults
- ? **Robust** - Graceful error handling
- ? **Performant** - Optimized parsing and caching
- ? **Extensible** - Custom implementations supported
- ? **Well-documented** - Comprehensive guides and examples
- ? **AI-ready** - Tool generation for language models
