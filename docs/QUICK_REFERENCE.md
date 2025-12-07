# Quick Reference: Find What You Need

A quick lookup guide to find documentation by topic.

## 🚀 Getting Help

| Need | Location | File |
|---|---|---|
| **I'm new, where do I start?** | Getting Started | `docs/GETTING_STARTED.md` |
| **Quick overview** | Master Index | `docs/INDEX.md` |
| **How does it work?** | Architecture | `docs/ARCHITECTURE.md` |
| **I want to see code** | Examples | `docs/examples/BASIC_SETUP.md` |
| **I need API docs** | API Reference | `docs/api/README.md` |

## 📖 By Topic

### Installation & Setup
| Topic | File |
|---|---|
| Install package | `docs/GETTING_STARTED.md` |
| Configure options | `docs/guides/CONFIGURATION.md` |
| First message | `docs/GETTING_STARTED.md` |
| Troubleshooting | `docs/guides/INSTALLATION.md` |

### Features & Widgets
| Topic | File |
|---|---|
| Available widgets | `docs/GETTING_STARTED.md` |
| Widget types | `docs/api/models/ChatWidget.md` |
| Widget schemas | `docs/design/` |
| Creating custom widgets | `docs/guides/CUSTOM_WIDGETS.md` |

### AI Integration
| Topic | File |
|---|---|
| Supported AI models | `docs/ARCHITECTURE.md` |
| AI tools | `docs/guides/CUSTOM_AI_TOOLS.md` |
| Context windows | `docs/design/CONTEXT_WINDOWS.md` |
| AI instructions | `docs/guides/CONFIGURATION.md` |

### Conversation Management
| Topic | File |
|---|---|
| Threads/conversations | `docs/design/THREAD_MANAGEMENT.md` |
| Message history | `docs/api/models/ChatTurn.md` |
| Conversation context | `docs/design/CONTEXT_WINDOWS.md` |
| Multi-turn support | `docs/ARCHITECTURE.md` |

### Customization
| Topic | File |
|---|---|
| Custom widgets | `docs/guides/CUSTOM_WIDGETS.md` |
| Custom AI tools | `docs/guides/CUSTOM_AI_TOOLS.md` |
| Custom actions | `docs/guides/CUSTOM_ACTION_HANDLERS.md` |
| Custom chat client | `docs/guides/CONFIGURATION.md` |

### Architecture & Design
| Topic | File |
|---|---|
| System overview | `docs/ARCHITECTURE.md` |
| Component diagrams | `docs/ARCHITECTURE.md` |
| Data flows | `docs/ARCHITECTURE.md` |
| JSON polymorphism | `docs/design/POLYMORPHISM.md` |
| Serialization | `docs/design/SERIALIZATION.md` |

### API Reference
| Topic | File |
|---|---|
| ChatWidgetService | `docs/api/services/ChatWidgetService.md` |
| DefaultThreadService | `docs/api/services/DefaultThreadService.md` |
| ChatWidget | `docs/api/models/ChatWidget.md` |
| ChatTurn | `docs/api/models/ChatTurn.md` |
| All services | `docs/api/services/README.md` |
| All models | `docs/api/models/README.md` |
| All abstractions | `docs/api/abstractions/README.md` |

### Development
| Topic | File |
|---|---|
| Set up dev environment | `docs/contributing/DEVELOPMENT.md` |
| Code style | `docs/contributing/CODE_STYLE.md` |
| Writing documentation | `docs/contributing/DOCUMENTATION.md` |
| Running tests | `docs/contributing/TESTING.md` |
| Manage docs | `docs/MANAGEMENT.md` |

### Examples
| Topic | File |
|---|---|
| Basic setup | `docs/examples/BASIC_SETUP.md` |
| Advanced configuration | `docs/examples/ADVANCED_CONFIGURATION.md` |
| Custom implementation | `docs/examples/CUSTOM_IMPLEMENTATION.md` |

## 👥 By Audience

### I'm a User (Want to Use the Library)
1. Start: `docs/INDEX.md`
2. Read: `docs/GETTING_STARTED.md` (5 min)
3. Reference: `docs/api/README.md` (as needed)
4. Examples: `docs/examples/BASIC_SETUP.md`

### I'm a Developer (Want to Extend/Customize)
1. Start: `docs/INDEX.md`
2. Read: `docs/ARCHITECTURE.md` (understand design)
3. Guide: `docs/guides/CUSTOM_WIDGETS.md` or `docs/guides/CUSTOM_AI_TOOLS.md`
4. API: `docs/api/README.md` (reference)

### I'm Contributing Code
1. Setup: `docs/contributing/DEVELOPMENT.md`
2. Standards: `docs/contributing/CODE_STYLE.md`
3. Docs: `docs/contributing/DOCUMENTATION.md`
4. Tests: `docs/contributing/TESTING.md`

### I'm Maintaining Documentation
1. Guide: `docs/MANAGEMENT.md`
2. Templates: In `docs/MANAGEMENT.md`
3. Standards: `docs/contributing/DOCUMENTATION.md`

## 🔍 By Question

| Question | Answer In |
|---|---|
| **What can I build?** | `docs/FEATURES.md` |
| **How do I install?** | `docs/GETTING_STARTED.md` |
| **What widgets are available?** | `docs/GETTING_STARTED.md` |
| **How do I configure options?** | `docs/guides/CONFIGURATION.md` |
| **How do I add custom widgets?** | `docs/guides/CUSTOM_WIDGETS.md` |
| **How do I extend AI?** | `docs/guides/CUSTOM_AI_TOOLS.md` |
| **How do I handle widget actions?** | `docs/guides/CUSTOM_ACTION_HANDLERS.md` |
| **How does it work internally?** | `docs/ARCHITECTURE.md` |
| **What's the API for Service X?** | `docs/api/services/ServiceX.md` |
| **What's the Model X structure?** | `docs/api/models/ModelX.md` |
| **How do I set up to contribute?** | `docs/contributing/DEVELOPMENT.md` |
| **What's the code style?** | `docs/contributing/CODE_STYLE.md` |
| **How do I write documentation?** | `docs/contributing/DOCUMENTATION.md` |
| **How do I run tests?** | `docs/contributing/TESTING.md` |
| **How do I manage documentation?** | `docs/MANAGEMENT.md` |

## 🚪 Navigation Paths

### "I want to use this library" Path
```
docs/INDEX.md
  → GETTING_STARTED.md (5 min quick start)
    → guides/INSTALLATION.md (detailed setup)
      → examples/BASIC_SETUP.md (working code)
        → api/README.md (reference as needed)
```

### "I want to understand how it works" Path
```
docs/INDEX.md
  → ARCHITECTURE.md (system overview)
    → design/ (specific design decisions)
      → POLYMORPHISM.md
      → THREAD_MANAGEMENT.md
      → CONTEXT_WINDOWS.md
      → SERIALIZATION.md
```

### "I want to customize it" Path
```
docs/INDEX.md
  → guides/CONFIGURATION.md (config options)
    → guides/CUSTOM_WIDGETS.md (add widgets)
    → guides/CUSTOM_AI_TOOLS.md (extend AI)
    → guides/CUSTOM_ACTION_HANDLERS.md (handle actions)
```

### "I want to contribute" Path
```
docs/INDEX.md
  → contributing/DEVELOPMENT.md (set up dev)
    → contributing/CODE_STYLE.md (standards)
      → contributing/DOCUMENTATION.md (doc standards)
        → contributing/TESTING.md (write tests)
```

### "I want API details" Path
```
docs/INDEX.md
  → api/README.md (API overview)
    → api/services/README.md (services)
      → api/services/ChatWidgetService.md (specific service)
    → api/models/README.md (data models)
      → api/models/ChatWidget.md (specific model)
```

## 📚 Document Relationships

### Getting Started Documents
```
INDEX.md
├── GETTING_STARTED.md
│   ├── guides/INSTALLATION.md
│   ├── examples/BASIC_SETUP.md
│   └── ARCHITECTURE.md
```

### Configuration Documents
```
guides/CONFIGURATION.md
├── BbQChatOptions (api reference)
├── guides/CUSTOM_WIDGETS.md
├── guides/CUSTOM_AI_TOOLS.md
└── guides/CUSTOM_ACTION_HANDLERS.md
```

### Architecture Documents
```
ARCHITECTURE.md
├── design/POLYMORPHISM.md
├── design/THREAD_MANAGEMENT.md
├── design/CONTEXT_WINDOWS.md
├── design/SERIALIZATION.md
└── api/ (all API docs)
```

### Contribution Documents
```
contributing/DEVELOPMENT.md
├── contributing/CODE_STYLE.md
├── contributing/DOCUMENTATION.md
├── contributing/TESTING.md
└── MANAGEMENT.md
```

## 💡 Tips

1. **Bookmark `docs/INDEX.md`** - It's your navigation hub
2. **Use Ctrl+F to search** - Find docs by keyword
3. **Follow breadcrumbs** - Each doc links to related topics
4. **Check "Next Steps"** - End of each doc suggests what to read
5. **View raw on GitHub** - Easier to see links
6. **Ask questions** - Open GitHub issues for unclear docs

## 🔗 Outside Resources

| Resource | Link |
|---|---|
| GitHub Repository | https://github.com/JeanMarcMbouma/BbQ.ChatWidgets |
| GitHub Issues | https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/issues |
| GitHub Discussions | https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/discussions |
| NuGet Package | https://www.nuget.org/packages/BbQ.ChatWidgets/ |

## 📞 Still Can't Find It?

1. **Search `docs/INDEX.md`** - Has table of all topics
2. **Check `docs/MANAGEMENT.md`** - Has document glossary
3. **Open GitHub issue** - Ask the community
4. **Read source code** - Has XML comments with examples

---

**Quick Links:**
- 🏠 [Home](INDEX.md)
- 🚀 [Getting Started](GETTING_STARTED.md)
- 🏗️ [Architecture](ARCHITECTURE.md)
- 📚 [API Reference](api/README.md)
- 👨‍💻 [Contributing](contributing/DEVELOPMENT.md)
- 🔧 [Management](MANAGEMENT.md)
