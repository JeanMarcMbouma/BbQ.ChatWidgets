??????????????????????????????????????????????????????????????????????????????
?                                                                            ?
?         ? BbQ.ChatWidgets Sample Console Application                     ?
?                                                                            ?
?               OpenAI + User Secrets Integration Sample                    ?
?                                                                            ?
??????????????????????????????????????????????????????????????????????????????


## ?? Quick Navigation

### Getting Started
- ?? **[QUICKSTART.md](QUICKSTART.md)** - 5-minute setup (START HERE)
- ?? **[README.md](README.md)** - Full documentation
- ?? **[CONFIGURATION_GUIDE.md](CONFIGURATION_GUIDE.md)** - Production setup

### Core Files
- ?? **Program.cs** - Main application code
- ?? **BbQ.ChatWidgets.Sample.csproj** - Project configuration
- ? **appsettings.json** - Default settings
- ?? **.gitignore** - Security (prevents secret commits)

### Configuration Files
- **appsettings.Development.json** - Dev environment
- **appsettings.Production.json** - Production environment

### Deployment
- ?? **Dockerfile** - Container definition
- ?? **docker-compose.yml** - Docker Compose setup

### Summary
- ?? **SAMPLE_COMPLETE_SUMMARY.txt** - Full overview


## ? 5-Minute Quick Start

```bash
# 1. Initialize secrets
cd BbQ.ChatWidgets.Sample
dotnet user-secrets init

# 2. Store your OpenAI API key
dotnet user-secrets set "OpenAI:ApiKey" "sk-your-api-key"

# 3. Run the application
dotnet run

# 4. Start chatting!
You: Hello!
```

**That's it!** See [QUICKSTART.md](QUICKSTART.md) for more.


## ?? What This Sample Shows

### ? User Secrets (Secure Configuration)
- How to store API keys locally without committing them
- Commands to manage secrets
- Integration with configuration builder
- Development vs production setup

### ? OpenAI Integration
- How to set up OpenAI chat client
- Multi-turn conversation support
- Error handling for API calls
- Proper dependency injection

### ? BbQ.ChatWidgets Integration
- How to use BbQ.ChatWidgets with OpenAI
- Handling widget responses
- Conversation management
- Real-world usage patterns

### ? Production Patterns
- Proper error handling
- Logging setup
- Configuration management
- Multiple deployment options


## ?? Documentation Structure

### Quick Reference
- **QUICKSTART.md** (5 min read) - Get running immediately

### Comprehensive Guide
- **README.md** (30 min read) - Full features, architecture, examples

### Advanced Topics
- **CONFIGURATION_GUIDE.md** (30 min read) - Production deployment

### Code Documentation
- **Program.cs** - Inline XML documentation and comments

### Overview
- **SAMPLE_COMPLETE_SUMMARY.txt** - Everything at a glance


## ?? User Secrets Overview

User Secrets is a .NET feature for secure local development:

```bash
# Initialize secrets for your project
dotnet user-secrets init

# Store a secret
dotnet user-secrets set "OpenAI:ApiKey" "sk-..."

# View secrets (values masked)
dotnet user-secrets list

# Remove a secret
dotnet user-secrets remove "OpenAI:ApiKey"
```

**Stored in**: `~/.microsoft/usersecrets/{ProjectId}/secrets.json`  
**Benefits**: Never committed to git, secure local development, easy to use

See [README.md](README.md) for detailed explanation.


## ?? Usage Examples

### Basic Chat
```
You: What is the capital of France?
Assistant: The capital of France is Paris...
```

### Conversation Context
```
You: What is 2+2?
Assistant: 2 + 2 = 4

You: Times 3?
Assistant: 4 × 3 = 12
```

### Commands
```
You: history      (Show all messages)
You: clear        (Clear history)
You: exit         (Exit app)
```


## ?? Project Structure

```
BbQ.ChatWidgets.Sample/
?
??? Program.cs                      ? Main application
??? BbQ.ChatWidgets.Sample.csproj  ? Project file (has UserSecretsId)
?
??? appsettings.json                ? Default config
??? appsettings.Development.json    ? Dev config
??? appsettings.Production.json     ? Production config
?
??? Dockerfile                      ? Docker build
??? docker-compose.yml              ? Docker Compose
?
??? .gitignore                      ? Excludes secrets from git
?
??? QUICKSTART.md                   ? 5-minute setup ? START HERE
??? README.md                       ? Full documentation
??? CONFIGURATION_GUIDE.md          ? Production setup
??? SAMPLE_COMPLETE_SUMMARY.txt    ? This overview
```


## ??? Architecture Overview

### Configuration Hierarchy
```
appsettings.json (defaults)
    ? Override by:
appsettings.{Environment}.json (environment-specific)
    ? Override by:
User Secrets (local development)
    ? Override by:
Environment Variables (any environment)
    ? Override by:
Command-line Arguments (runtime)
```

### Services
```
Program.cs
??? Configuration Setup
?   ??? Load User Secrets, JSON files, env vars
??? Dependency Injection
?   ??? OpenAI Chat Client
?   ??? BbQ.ChatWidgets Services
?   ??? ChatService (custom)
?   ??? ConversationManager (custom)
??? Interactive Loop
?   ??? Get user input
?   ??? Send to OpenAI
?   ??? Display response
?   ??? Manage history
??? Error Handling
    ??? Try-catch with logging
```


## ?? Key Concepts Demonstrated

### 1. User Secrets
- ? Initialize secrets for project
- ? Store sensitive configuration
- ? Load in configuration builder
- ? Exclude from source control

### 2. Dependency Injection
- ? Register services
- ? Create service provider
- ? Resolve dependencies
- ? Factory patterns

### 3. Configuration Management
- ? Load from JSON files
- ? Environment-specific settings
- ? Configuration hierarchy
- ? Type-safe access

### 4. OpenAI Integration
- ? Initialize chat client
- ? Send messages
- ? Handle responses
- ? Error handling

### 5. Logging
- ? Configure logging
- ? Create loggers
- ? Log at different levels
- ? Monitor application


## ?? Learning Outcomes

After studying this sample, you'll understand:

- How to use .NET User Secrets
- How to configure applications properly
- How to integrate OpenAI API
- How to manage conversations
- How to use dependency injection
- How to handle errors gracefully
- How to deploy to Docker
- Production best practices


## ?? Common Tasks

### Run Locally
```bash
cd BbQ.ChatWidgets.Sample
dotnet user-secrets set "OpenAI:ApiKey" "sk-..."
dotnet run
```

### Check Configuration
```bash
dotnet user-secrets list
```

### Run in Production Mode
```bash
dotnet run -- --environment Production
```

### Build Docker Image
```bash
docker build -t bbq-sample .
```

### Run in Docker
```bash
docker run -e OpenAI__ApiKey="sk-..." bbq-sample
```


## ?? Security Checklist

- ? User Secrets initialized
- ? API key stored in secrets
- ? .gitignore excludes secrets.json
- ? No hardcoded secrets in code
- ? No secrets in appsettings.json
- ? Error messages don't expose keys
- ? Production uses environment variables


## ? Features

| Feature | Status | Notes |
|---------|--------|-------|
| OpenAI Integration | ? Full | gpt-3.5-turbo, gpt-4 support |
| User Secrets | ? Full | Secure API key storage |
| Multi-turn | ? Full | Conversation context |
| Widgets | ? Full | Displays BbQ widgets |
| Logging | ? Full | Debug/Info/Warning levels |
| Error Handling | ? Full | Graceful failures |
| Docker | ? Full | Container ready |
| Configuration | ? Full | Dev/Prod environments |
| Documentation | ? Comprehensive | 4 guide files |


## ?? Next Steps

1. **Start here**: Read [QUICKSTART.md](QUICKSTART.md) (5 minutes)
2. **Set up locally**: Follow the 5-step setup
3. **Try it out**: Run the application and chat
4. **Learn more**: Read [README.md](README.md) (30 minutes)
5. **Deploy**: Use [CONFIGURATION_GUIDE.md](CONFIGURATION_GUIDE.md)
6. **Study code**: Review Program.cs and comments
7. **Customize**: Adapt to your needs


## ?? Help & Troubleshooting

### "API key not found"
See [README.md - User Secrets Setup](README.md#user-secrets-setup-detailed-guide)

### "Invalid API key"
See [README.md - API Errors](README.md#api-errors)

### "Configuration not loading"
See [CONFIGURATION_GUIDE.md - Troubleshooting](CONFIGURATION_GUIDE.md#troubleshooting)

### General issues
See [README.md - Troubleshooting](README.md#troubleshooting)


## ?? File Statistics

| File | Size | Purpose |
|------|------|---------|
| Program.cs | ~250 lines | Main application |
| README.md | ~800 lines | Full documentation |
| QUICKSTART.md | ~50 lines | Fast setup guide |
| CONFIGURATION_GUIDE.md | ~400 lines | Advanced config |
| .csproj | ~25 lines | Project config |

**Total Documentation**: 1,000+ lines  
**Total Code**: 250+ lines


## ?? What You'll Learn

- ? .NET User Secrets best practices
- ? Configuration management patterns
- ? OpenAI API integration
- ? Dependency injection setup
- ? Error handling strategies
- ? Logging configuration
- ? Docker containerization
- ? Production deployment patterns


## ?? Technologies Used

- **.NET 8.0** - Latest .NET framework
- **Microsoft.Extensions.AI** - OpenAI client library
- **Microsoft.Extensions.Configuration** - Config management
- **User Secrets** - Secure key storage
- **Dependency Injection** - Service management
- **Docker** - Containerization
- **BbQ.ChatWidgets** - Chat widget library


## ? Verification Checklist

After setup, verify:

- [ ] Solution builds without errors
- [ ] User secrets initialized
- [ ] API key stored in secrets
- [ ] Application starts without errors
- [ ] Can send messages to OpenAI
- [ ] Receives responses correctly
- [ ] Commands (exit, clear, history) work
- [ ] Docker builds successfully

See [QUICKSTART.md](QUICKSTART.md) for setup instructions.


## ?? Summary

You have a **complete, production-ready sample application** that demonstrates:

- ?? Secure secret management with User Secrets
- ?? OpenAI integration with Microsoft.Extensions.AI
- ?? BbQ.ChatWidgets integration
- ?? Multi-turn conversations
- ?? Proper dependency injection
- ?? Docker deployment
- ?? Comprehensive documentation

**Start with**: [QUICKSTART.md](QUICKSTART.md) (5 minutes)  
**Learn more**: [README.md](README.md) (30 minutes)  
**Deploy**: [CONFIGURATION_GUIDE.md](CONFIGURATION_GUIDE.md)

---

**Status**: ? COMPLETE AND READY TO USE

Happy coding! ??
