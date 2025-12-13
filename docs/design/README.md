# Design

Design decisions, patterns, and rationale. Includes JSON polymorphism approach, thread management, context windows and serialization details.
# Design Decisions

This folder contains documentation about architectural decisions and design patterns used in BbQ.ChatWidgets.

## Available Topics

### Data Handling
- **[POLYMORPHISM.md](POLYMORPHISM.md)** - JSON polymorphic type handling for widgets
- **[SERIALIZATION.md](SERIALIZATION.md)** - Serialization and deserialization strategy

### System Design
- **[THREAD_MANAGEMENT.md](THREAD_MANAGEMENT.md)** - Conversation thread management
- **[CONTEXT_WINDOWS.md](CONTEXT_WINDOWS.md)** - AI context window limiting

## Quick Links

| Decision | Document |
|---|---|
| How widgets are serialized | [POLYMORPHISM.md](POLYMORPHISM.md) |
| Conversation persistence | [THREAD_MANAGEMENT.md](THREAD_MANAGEMENT.md) |
| Token optimization | [CONTEXT_WINDOWS.md](CONTEXT_WINDOWS.md) |
| JSON handling | [SERIALIZATION.md](SERIALIZATION.md) |

## Document Structure

Each design decision document includes:
- **Problem** - What problem does it solve?
- **Solution** - How we solved it
- **Rationale** - Why this approach?
- **Trade-offs** - What are the costs?
- **Examples** - Code examples
- **Alternatives** - Other approaches considered

## Related Documentation

- **Architecture**: [ARCHITECTURE.md](../ARCHITECTURE.md)
- **API Reference**: [api/](../api/)
- **Guides**: [guides/](../guides/)

---

**Back to:** [Documentation Index](../INDEX.md)
