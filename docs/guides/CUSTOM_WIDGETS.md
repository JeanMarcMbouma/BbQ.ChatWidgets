Custom widget guide consolidated into `docs/guides/README.md` and `docs/examples/`.
# Custom Widgets Guide

Learn how to create custom widget types for your specific needs.

## Overview

This guide shows you how to:
1. Understand the widget architecture
2. Create custom widget types
3. Register custom widgets
4. Handle custom widget actions
5. Integrate widgets with AI

## Understanding Widgets

### Widget Basics

A widget is a JSON-serializable object that represents interactive UI:

```csharp
[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(ButtonWidget), "button")]
[JsonDerivedType(typeof(CardWidget), "card")]
public abstract record ChatWidget(string Label, string Action);
```

### Built-in Widgets

BbQ.ChatWidgets includes 7 built-in widgets:
- `ButtonWidget` - Clickable button
- `CardWidget` - Rich content card
- `InputWidget` - Text input
- `DropdownWidget` - Selection list
- `SliderWidget` - Range selection
- `ToggleWidget` - Boolean switch
- `FileUploadWidget` - File input

## Creating a Custom Widget

### Step 1: Define the Widget Class

Create a new record that inherits from `ChatWidget`:

```csharp
using BbQ.ChatWidgets.Models;
using System.Text.Json.Serialization;

public record RatingWidget(
    string Label,
    string Action,
    int MaxRating = 5,
    string? HelpText = null
) : ChatWidget(Label, Action);
```

**Key points:**
- Inherit from `ChatWidget` (abstract base)
- Use record type (immutable)
- Decorate with `[JsonDerivedType]`
- Include `Label` and `Action` properties
- Add custom properties as needed

### Step 2: Register the Widget Type

There are two supported approaches to wire up your custom widget for JSON polymorphic (de)serialization:

- Compile-time registration (attributes)
- Runtime registration (recommended for external libraries)

Compile-time registration

You can add `[JsonDerivedType]` attributes to your assembly so `System.Text.Json` knows about the discriminator at build time. This works well when you control the widget assembly.

Runtime registration (recommended)

When you want to add custom widgets from external projects without modifying the library source, register them at runtime via the provided DI helpers. This approach injects a small custom registry and a converter that resolves custom types at deserialization time.

Example using DI helper `AddCustomWidgetSupport`:

```csharp
// In Program.cs (or Startup)
builder.Services.AddBbQChatWidgets();

// Registers the custom registry and injects it into the serialization system
builder.Services.AddCustomWidgetSupport(registry =>
{
    // Auto-discriminator will be derived from the type name (lower-cased)
    registry.Register<RatingWidget>();

    // Or register with explicit discriminator
    registry.Register<ProgressWidget>("progress");
});
```

Notes:
- `AddCustomWidgetSupport()` registers an `ICustomWidgetRegistry` singleton and configures `Serialization.Default` to use the extensible converter.
- Use `registry.Register<T>()` to auto-generate a discriminator (from the type name) or `registry.Register<T>("discriminator")` to specify it explicitly.
- This avoids needing `[JsonDerivedType]` attributes and lets external libraries add widgets without touching the core.

#### Manual runtime registration

If you don't use the DI helper, you can create and configure the registry yourself and call `Serialization.SetCustomWidgetRegistry(...)` during application startup.

```csharp
var registry = new CustomWidgetRegistry();
registry.Register<RatingWidget>("rating");
Serialization.SetCustomWidgetRegistry(registry);
```

Use `Serialization.Default` (it will include the extensible converter when a custom registry is configured) when serializing/deserializing widgets across the app.

### Step 3: Create the Frontend Component

Render the widget in your UI:

```javascript
function renderWidget(widget) {
    if (widget.type === 'rating') {
        return createRatingWidget(widget);
    }
    // ... handle other widget types
}

function createRatingWidget(widget) {
    const container = document.createElement('div');
    container.className = 'rating-widget';
    
    // Create stars
    for (let i = 1; i <= widget.maxRating; i++) {
        const star = document.createElement('span');
        star.className = 'star';
        star.textContent = '?';
        star.onclick = () => submitRating(i, widget.action);
        container.appendChild(star);
    }
    
    if (widget.helpText) {
        const help = document.createElement('p');
        help.className = 'help-text';
        help.textContent = widget.helpText;
        container.appendChild(help);
    }
    
    return container;
}

function submitRating(rating, action) {
    fetch('/api/chat/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: action,
            payload: { rating: rating },
            threadId: currentThreadId
        })
    }).then(r => r.json()).then(data => {
        // Display response
        addMessage(data.content);
        data.widgets.forEach(w => renderWidget(w));
    });
}
```

## Complete Example: Progress Widget

### Backend

```csharp
// 1. Define the widget
public record ProgressWidget(
    string Label,
    string Action,
    int Current = 0,
    int Total = 100
) : ChatWidget(Label, Action);

// 2. Register the widget
builder.Services.ConfigureJsonSerializerOptions(options =>
{
    options.AddChatWidgetType<ProgressWidget>("progress");
});

// 3. Create an action handler
public class ProgressActionHandler : IWidgetActionHandler
{
    public async Task<ChatTurn> HandleActionAsync(
        string action,
        Dictionary<string, object> payload,
        string threadId,
        IServiceProvider serviceProvider)
    {
        if (action != "update_progress")
            throw new InvalidOperationException("Unknown action");
        
        var current = (int)payload["current"];
        var total = (int)payload["total"];
        var percentage = (current * 100) / total;
        
        var response = $"Progress: {percentage}% complete";
        
        return new ChatTurn(
            ChatRole.Assistant,
            response,
            new[]
            {
                new ProgressWidget(
                    Label: $"{percentage}%",
                    Action: "update_progress",
                    Current: current,
                    Total: total
                )
            },
            threadId
        );
    }
}

// 4. Register the handler
builder.Services.AddScoped<IWidgetActionHandler, ProgressActionHandler>();
```

### Frontend

```html
<div id="widgets"></div>

<script>
function renderProgressWidget(widget) {
    const container = document.createElement('div');
    container.className = 'progress-container';
    
    const bar = document.createElement('div');
    bar.className = 'progress-bar';
    
    const fill = document.createElement('div');
    fill.className = 'progress-fill';
    fill.style.width = `${(widget.current / widget.total) * 100}%`;
    bar.appendChild(fill);
    
    const label = document.createElement('p');
    label.textContent = `${widget.label}`;
    
    container.appendChild(bar);
    container.appendChild(label);
    
    return container;
}

function renderWidget(widget) {
    if (widget.type === 'progress') {
        return renderProgressWidget(widget);
    }
    // ... other types
}
</script>

<style>
.progress-container {
    margin: 20px 0;
}

.progress-bar {
    width: 100%;
    height: 20px;
    background-color: #e0e0e0;
    border-radius: 10px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background-color: #4caf50;
    transition: width 0.3s ease;
}
</style>
```

## Widget Guidelines

### Do's ?
- Keep widgets simple and focused
- Include helpful labels
- Use consistent naming conventions
- Document required payload fields
- Handle edge cases gracefully
- Test widget rendering

### Don'ts ?
- Don't create overly complex widgets
- Don't forget to register the type
- Don't hardcode values
- Don't ignore payload validation
- Don't break on unexpected input

## Widget Validation

Validate widget inputs on the backend:

```csharp
public record CustomWidget(
    string Label,
    string Action,
    int Value = 0
) : ChatWidget(Label, Action)
{
    // Custom validation
    public void Validate()
    {
        if (string.IsNullOrEmpty(Label))
            throw new ArgumentException("Label required");
        if (string.IsNullOrEmpty(Action))
            throw new ArgumentException("Action required");
        if (Value < 0)
            throw new ArgumentException("Value must be positive");
    }
}
```

## Styling Widgets

Add CSS classes for consistent styling:

```csharp
public record StyledWidget(
    string Label,
    string Action,
    string? CssClass = null
) : ChatWidget(Label, Action);
```

Frontend:

```javascript
function renderStyledWidget(widget) {
    const container = document.createElement('div');
    if (widget.cssClass) {
        container.className = widget.cssClass;
    }
    // ... render content
    return container;
}
```

## Common Patterns

### Confirmation Dialog

```csharp
public record ConfirmWidget(
    string Label,
    string Action,
    string Message,
    string ConfirmText = "Yes",
    string CancelText = "No"
) : ChatWidget(Label, Action);
```

### Multi-Step Form

```csharp
public record FormStepWidget(
    string Label,
    string Action,
    int CurrentStep,
    int TotalSteps,
    Dictionary<string, string> Fields
) : ChatWidget(Label, Action);
```

### Alert/Notification

```csharp
public record AlertWidget(
    string Label,
    string Action,
    string Message,
    string AlertType = "info" // info, warning, error, success
) : ChatWidget(Label, Action);
```

## Troubleshooting

### Widget not rendering
- Check widget type is registered
- Verify frontend handles the widget type
- Check browser console for errors

### Serialization errors
- Ensure all properties are JSON-serializable
- Check `[JsonDerivedType]` is applied
- Verify type discriminator is correct

### Action not handled
- Check action handler is registered
- Verify action name matches
- Check payload structure

## Next Steps

- **[Custom AI Tools](CUSTOM_AI_TOOLS.md)** - Add AI functions
- **[Custom Actions](CUSTOM_ACTION_HANDLERS.md)** - Handle widget actions
- **[Examples](../examples/)** - See working examples
- **[API Reference](../api/)** - Detailed API docs

---

**Back to:** [Guides](README.md) | [Documentation Index](../INDEX.md)
