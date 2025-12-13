This design decision doc has been consolidated into `docs/design/README.md`.
# Serialization Design Decision

## Problem

We needed to serialize/deserialize complex widget types with custom properties while maintaining:
- Type safety
- Extensibility
- Performance
- Version compatibility

## Solution

We use **System.Text.Json** with custom converters and polymorphic type handling.

### Configuration

```csharp
var options = new JsonSerializerOptions
{
    PropertyNameCaseInsensitive = true,
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    WriteIndented = false
};

// Register widget types
options.AddChatWidgetType<ButtonWidget>("button");
options.AddChatWidgetType<CardWidget>("card");
// ... etc
```

## Rationale

### Why System.Text.Json?
- Built-in to .NET
- High performance
- Native polymorphism support
- No external dependencies

## Alternatives

### Alternative: Newtonsoft.Json
- More feature-rich
- But less performant
- External dependency

## Key Concepts

- **Type Discriminator** - "type" field identifies widget
- **Case Insensitive** - Works with any JSON casing
- **Camel Case** - Frontend friendly naming

## Related Documents

- **[POLYMORPHISM.md](POLYMORPHISM.md)** - Type handling
- **[api/models/](../api/models/)** - Widget models

---

**Back to:** [Design Decisions](README.md)
