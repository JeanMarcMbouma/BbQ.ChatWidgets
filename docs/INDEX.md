# BbQ.ChatWidgets - Main Documentation Index

This is the central documentation hub for BbQ.ChatWidgets. All documentation has been consolidated here.

## ?? Documentation Guide

### ?? Getting Started
- **[Quick Start (5 Minutes)](GETTING_STARTED.md)** - Get up and running immediately
- **[Installation Guide](guides/INSTALLATION.md)** - Step-by-step setup instructions
- **[Basic Example](examples/BASIC_SETUP.md)** - Copy-paste ready code

### ??? Architecture & Design
- **[System Architecture](ARCHITECTURE.md)** - How BbQ.ChatWidgets works
- **[Design Decisions](design/)** - Why things are the way they are
  - [JSON Polymorphism](design/POLYMORPHISM.md)
  - [Thread Management](design/THREAD_MANAGEMENT.md)
  - [Context Windows](design/CONTEXT_WINDOWS.md)

### ?? API Reference
Complete documentation of all services, models, and extensions:
- **[Services](api/services/README.md)** - Core service classes
- **[Models](api/models/README.md)** - Data structures and records
- **[Abstractions](api/abstractions/README.md)** - Interfaces and contracts
- **[Extensions](api/extensions/README.md)** - Helper extension methods

### ?? Configuration & Customization
- **[Configuration Guide](guides/CONFIGURATION.md)** - All options explained
- **[Custom Widgets](guides/CUSTOM_WIDGETS.md)** - Create your own widget types
- **[Custom AI Tools](guides/CUSTOM_AI_TOOLS.md)** - Extend AI capabilities
- **[Custom Actions](guides/CUSTOM_ACTION_HANDLERS.md)** - Handle widget actions

### ?? Code Examples
- **[Basic Setup](examples/BASIC_SETUP.md)** - Minimal working example
- **[Advanced Configuration](examples/ADVANCED_CONFIGURATION.md)** - Complex setups
- **[Custom Implementation](examples/CUSTOM_IMPLEMENTATION.md)** - Complete custom example

### ?? Contributing
- **[Development Setup](contributing/DEVELOPMENT.md)** - Set up dev environment
- **[Code Style](contributing/CODE_STYLE.md)** - Coding standards
- **[Documentation](contributing/DOCUMENTATION.md)** - Docs guidelines
- **[Testing](contributing/TESTING.md)** - Testing guidelines

## ?? Find What You Need

| I want to... | Read this |
|---|---|
| Get started in 5 minutes | [Quick Start](GETTING_STARTED.md) |
| Install the library | [Installation Guide](guides/INSTALLATION.md) |
| Understand how it works | [Architecture](ARCHITECTURE.md) |
| See working code | [Basic Example](examples/BASIC_SETUP.md) |
| Configure options | [Configuration Guide](guides/CONFIGURATION.md) |
| Create custom widgets | [Custom Widgets](guides/CUSTOM_WIDGETS.md) |
| Extend AI capabilities | [Custom AI Tools](guides/CUSTOM_AI_TOOLS.md) |
| Look up API documentation | [API Reference](api/README.md) |
| Contribute code | [Development Setup](contributing/DEVELOPMENT.md) |

## ?? Documentation Structure

```
docs/
??? README.md                           # This file
??? GETTING_STARTED.md                  # 5-minute quick start
??? FEATURES.md                         # Feature overview
??? ARCHITECTURE.md                     # System architecture
?
??? guides/                             # How-to guides
?   ??? INSTALLATION.md                 # Installation steps
?   ??? CONFIGURATION.md                # Configuration options
?   ??? CUSTOM_WIDGETS.md               # Creating widgets
?   ??? CUSTOM_AI_TOOLS.md              # Extending AI
?   ??? CUSTOM_ACTION_HANDLERS.md       # Custom actions
?
??? examples/                           # Code examples
?   ??? BASIC_SETUP.md                  # Simple example
?   ??? ADVANCED_CONFIGURATION.md       # Complex setup
?   ??? CUSTOM_IMPLEMENTATION.md        # Full custom impl
?
??? design/                             # Design decisions
?   ??? POLYMORPHISM.md                 # JSON polymorphic types
?   ??? THREAD_MANAGEMENT.md            # Thread design
?   ??? CONTEXT_WINDOWS.md              # AI context management
?   ??? SERIALIZATION.md                # Serialization strategy
?
??? api/                                # API Reference
?   ??? README.md                       # API overview
?   ??? services/                       # Service documentation
?   ?   ??? ChatWidgetService.md
?   ?   ??? DefaultThreadService.md
?   ?   ??? ...
?   ??? models/                         # Model documentation
?   ?   ??? ChatWidget.md
?   ?   ??? ChatTurn.md
?   ?   ??? ...
?   ??? abstractions/                   # Interface documentation
?   ?   ??? ...
?   ??? extensions/                     # Extension method docs
?       ??? ...
?
??? contributing/                       # Development guides
    ??? DEVELOPMENT.md                  # Dev setup
    ??? CODE_STYLE.md                   # Code standards
    ??? DOCUMENTATION.md                # Doc standards
    ??? TESTING.md                      # Test guidelines
```

## ?? Quick Reference

### Core Concepts
1. **Widgets** - Interactive UI elements (Button, Card, Input, etc.)
2. **Chat Turns** - Individual messages in a conversation
3. **Threads** - Conversation contexts
4. **Tools** - AI-callable functions
5. **Actions** - Widget interaction handlers

### Key Files
- **ChatWidgetService** - Main orchestrator
- **DefaultThreadService** - Conversation management
- **ChatWidget** - Widget definitions
- **ChatTurn** - Message representation
- **Serialization** - JSON configuration

## ?? Related Resources

- **GitHub**: [BbQ.ChatWidgets](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets)
- **NuGet**: [BbQ.ChatWidgets](https://www.nuget.org/packages/BbQ.ChatWidgets/)
- **Issues**: [GitHub Issues](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/issues)

## ?? Tips

- **Start here**: [Getting Started Guide](GETTING_STARTED.md)
- **Have questions?** Check the [FAQ](#faq) or open an issue
- **Found a bug?** [Report it](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/issues/new)
- **Want to contribute?** [See Contributing Guide](contributing/DEVELOPMENT.md)

## ?? In-Code Documentation

In addition to these guides, the source code includes comprehensive **XML comments**:
- Every class is documented
- Every public method is documented
- Parameters and return values are explained
- Examples are inline with the code

**Access in your IDE:**
- Hover over any type or method
- Press `Ctrl+Shift+Space` for quick docs
- Use "Go To Definition" to read full comments

## ?? Need Help?

1. **First time?** ? [Getting Started](GETTING_STARTED.md)
2. **How to use?** ? [API Reference](api/README.md)
3. **Not working?** ? [Troubleshooting](guides/INSTALLATION.md#troubleshooting)
4. **Need more?** ? [GitHub Issues](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/issues)

## ?? License

Documentation is provided under the same license as the code (MIT). See LICENSE file in root.

---

**Last Updated**: 2024  
**Version**: 1.0.0+  
**Status**: Complete and Current
