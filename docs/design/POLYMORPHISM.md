This design decision doc has been consolidated into `docs/design/README.md`.
# JSON Polymorphism Design Decision

## Problem

BbQ.ChatWidgets supports 7 different widget types, each with different properties. We needed a way to:
- Store different widget types in a single collection
- Serialize/deserialize them correctly
- Identify widget type at runtime
- Support custom widget types

## Solution

We use **JSON polymorphism** with a type discriminator property:

```csharp
[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(ButtonWidget), "button")]
[JsonDerivedType(typeof(CardWidget), "card")]
[JsonDerivedType(typeof(InputWidget), "input")]
[JsonDerivedType(typeof(DropdownWidget), "dropdown")]
[JsonDerivedType(typeof(SliderWidget), "slider")]
[JsonDerivedType(typeof(ToggleWidget), "toggle")]
[JsonDerivedType(typeof(FileUploadWidget), "fileupload")]
public abstract record ChatWidget(string Label, string Action);
```

### How It Works

1. **Abstract Base Class** - `ChatWidget` defines common properties
2. **Derived Types** - Each widget type inherits from base
3. **Type Discriminator** - `"type"` field identifies the specific widget
4. **Auto Serialization** - System.Text.Json handles serialization/deserialization

### Example

```json
{
  "type": "button",
  "label": "Click Me",
  "action": "confirm"
}
```

vs.

```json
{
  "type": "dropdown",
  "label": "Choose",
  "action": "select_option",
  "options": ["Option 1", "Option 2"]
}
```

## Rationale

### Why Polymorphism?
- **Type Safety** - Compile-time type checking
- **Extensibility** - Easy to add custom widgets
- **Auto-Handling** - No manual type checking

### Why Type Discriminator?
- **Clear Identification** - Widget type is always obvious
- **Standards Compliant** - Follows JSON schema standards
- **Frontend Friendly** - JavaScript can easily read type

## Trade-offs

### Advantages ?
- Strongly typed at compile time
- Easy to add custom types
- Clean JSON output
- No manual casting needed
- Excellent IDE support

### Disadvantages ?
- Requires registering each type
- Custom widgets need setup
- Version compatibility considerations

## Custom Widget Example

```csharp
// 1. Define the widget
public record RatingWidget(
    string Label,
    string Action,
    int MaxRating = 5
) : ChatWidget(Label, Action);

// 2. Register the type
[JsonDerivedType(typeof(RatingWidget), "rating")]

// Now it's automatically handled
var json = @"{ ""type"": ""rating"", ""label"": ""Rate this"", ""action"": ""submit"", ""maxRating"": 5 }";
var widget = JsonSerializer.Deserialize<ChatWidget>(json);
// widget is correctly deserialized as RatingWidget
```

## Alternatives Considered

### Alternative 1: String Switch

```csharp
public class WidgetFactory
{
    public static ChatWidget Create(string type, 
        Dictionary<string, object> data)
    {
        return type switch
        {
            "button" => new ButtonWidget(...),
            "card" => new CardWidget(...),
            // ... etc
        };
    }
}
```

**Rejected Because:**
- No type safety
- Manual handling required
- No IDE support
- Error prone

### Alternative 2: Inheritance with Converters

```csharp
public class ChatWidgetConverter : JsonConverter<ChatWidget>
{
    public override ChatWidget Read(...)
    {
        // Manual type detection
    }
    
    public override void Write(...)
    {
        // Manual serialization
    }
}
```

**Rejected Because:**
- More code to write
- System.Text.Json has built-in support
- Less maintainable

### Alternative 3: Composition Instead of Inheritance

```csharp
public record Chat
{
    public ChatRole Role { get; set; }
    public string Content { get; set; }
    public ButtonWidget[] Buttons { get; set; }
    public CardWidget[] Cards { get; set; }
    // ... one property per type
}
```

**Rejected Because:**
- Inflexible
- Can't mix widget types easily
- Not scalable for custom widgets

## Current Implementation

### Type Hierarchy

```
ChatWidget (abstract)
— ButtonWidget
— CardWidget
— InputWidget
— DropdownWidget
— SliderWidget
— ToggleWidget
— FileUploadWidget
```

### Serialization Example

```csharp
var widgets = new ChatWidget[]
{
    new ButtonWidget("Click", "action1"),
    new CardWidget("Card", "action2", title: "Title"),
    new InputWidget("Enter", "action3")
};

var json = JsonSerializer.Serialize(widgets);
// [
//   { "type": "button", "label": "Click", "action": "action1" },
//   { "type": "card", "label": "Card", "action": "action2", "title": "Title" },
//   { "type": "input", "label": "Enter", "action": "action3" }
// ]

var deserialized = JsonSerializer
    .Deserialize<ChatWidget[]>(json);
// Correctly deserializes to specific types
```

## Future Considerations

- Schema versioning for backward compatibility
- Widget type inheritance (widget extending widget)
- Plugin system for third-party widgets

## Related Documents

- **[SERIALIZATION.md](SERIALIZATION.md)** - Serialization details
- **[API Reference](../api/)** - Widget definitions
- **[guides/CUSTOM_WIDGETS.md](../guides/CUSTOM_WIDGETS.md)** - Creating custom widgets

---

**Back to:** [Design Decisions](README.md) | [Documentation Index](../INDEX.md)
