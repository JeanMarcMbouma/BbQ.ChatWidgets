# BbQ.ChatWidgets Sample Console Application

A production-ready sample console application demonstrating how to use BbQ.ChatWidgets with OpenAI, featuring secure secret management using .NET User Secrets.

## Features

? **OpenAI Integration** - Uses Microsoft.Extensions.AI with OpenAI chat client  
? **User Secrets** - Securely stores API keys without committing them to source control  
? **Multi-turn Conversations** - Maintains conversation history with the AI  
? **Widget Support** - Displays widgets returned by BbQ.ChatWidgets  
? **Interactive CLI** - User-friendly command-line interface with special commands  
? **Error Handling** - Comprehensive error handling and logging  
? **Logging** - Built-in logging with Microsoft.Extensions.Logging  

## Prerequisites

- .NET 8.0 SDK or later
- OpenAI API key (from https://platform.openai.com/api-keys)

## Quick Start (5 minutes)

### Step 1: Initialize User Secrets

```bash
cd BbQ.ChatWidgets.Sample
dotnet user-secrets init
```

### Step 2: Store Your OpenAI API Key

```bash
dotnet user-secrets set "OpenAI:ApiKey" "sk-your-api-key"
```

### Step 3: Run the Application

```bash
dotnet run
```

## User Secrets Setup - Detailed Guide

### What are User Secrets?

User Secrets is a .NET feature that stores sensitive configuration values in a local file outside your project directory. This prevents secrets from being accidentally committed to version control.

**Secrets are stored in:**
- **Windows**: `%APPDATA%\Microsoft\UserSecrets\<UserSecretsId>\secrets.json`
- **Mac/Linux**: `~/.microsoft/usersecrets/<UserSecretsId>/secrets.json`

### Initialize User Secrets

Before using secrets, initialize them for your project:

```bash
dotnet user-secrets init
```

This command:
1. Generates a unique `UserSecretsId` GUID
2. Adds it to your `.csproj` file in a `<UserSecretsId>` property
3. Creates the secrets storage directory

**Verify it was added to the project file:**

```xml
<PropertyGroup>
  <UserSecretsId>BbQ.ChatWidgets.Sample-{GUID}</UserSecretsId>
</PropertyGroup>
```

### Set Secrets

Store your OpenAI API key:

```bash
dotnet user-secrets set "OpenAI:ApiKey" "sk-..."
```

Store optional settings:

```bash
dotnet user-secrets set "OpenAI:ModelId" "gpt-3.5-turbo"
```

**Hierarchical format**: Use colons `:` for nested configuration

### List Secrets

View all secrets (values shown as `*****`):

```bash
dotnet user-secrets list
```

### Remove Secrets

Remove a specific secret:

```bash
dotnet user-secrets remove "OpenAI:ApiKey"
```

Clear all secrets:

```bash
dotnet user-secrets clear
```

## Configuration Structure

Secrets are organized hierarchically in `secrets.json`:

```json
{
  "OpenAI": {
    "ApiKey": "sk-...",
    "ModelId": "gpt-4"
  }
}
```

Accessed in code as:

```csharp
configuration["OpenAI:ApiKey"]    // Returns API key
configuration["OpenAI:ModelId"]   // Returns model ID
```

## Application Architecture

### Program.cs Highlights

#### Configuration Setup

```csharp
var configuration = new ConfigurationBuilder()
    .AddUserSecrets<Program>()
    .build();
```

Loads configuration including User Secrets.

#### Dependency Injection

```csharp
var services = new ServiceCollection()
    .AddOpenAIChatClient(options => {
        options.ApiKey = configuration["OpenAI:ApiKey"];
        options.ModelId = configuration["OpenAI:ModelId"] ?? "gpt-4";
    })
    .AddBbQChatWidgets(...)
    .BuildServiceProvider();
```

Registers:
- OpenAI chat client with secure API key
- BbQ.ChatWidgets services
- Custom services (ChatService, ConversationManager)

### ChatService Class

Handles all communication with OpenAI:

```csharp
public class ChatService
{
    public async Task<ChatTurn> SendMessageAsync(string userMessage)
    {
        // Add user message to history
        // Get conversation context
        // Call OpenAI API
        // Return response with widgets
    }
}
```

### ConversationManager Class

Manages multi-turn conversation state:

```csharp
public class ConversationManager
{
    private readonly List<ChatTurn> _turns = new();
    
    public void AddUserMessage(string message) { }
    public void AddTurn(ChatTurn turn) { }
    public IEnumerable<ChatMessage> GetMessages() { }
    public void PrintHistory() { }
    public void ClearHistory() { }
}
```

## Interactive Commands

| Command | Description |
|---------|-------------|
| Type message | Send message to OpenAI |
| `exit` | Exit the application |
| `clear` | Clear conversation history |
| `history` | Display full conversation |

## Error Handling

### Configuration Errors

```
OpenAI API key not found in user secrets.
Run: dotnet user-secrets set "OpenAI:ApiKey" "your-api-key"
```

**Solution**: Initialize and set your API key using the steps above.

### API Errors

```
OpenAI API error: Unauthorized
```

**Solution**: Verify your API key is correct and has access to the model.

### Network Errors

```
Error communicating with OpenAI API
```

**Solution**: Check your internet connection and OpenAI API status.

## Best Practices

### ? Do

- ? Use User Secrets for local development
- ? Use environment variables or Azure Key Vault for production
- ? Never commit secrets to version control
- ? Rotate API keys regularly
- ? Use .gitignore to exclude secrets.json
- ? Log sensitive operations (without exposing keys)

### ? Don't

- ? Hardcode API keys in source code
- ? Commit secrets.json to git
- ? Share API keys via email or messaging
- ? Log API keys or sensitive data
- ? Use the same key across multiple projects
- ? Store production secrets in User Secrets

## Deploying to Production

For production deployments, use:

### Azure Key Vault

```csharp
var configuration = new ConfigurationBuilder()
    .AddAzureKeyVault(...)
    .Build();
```

### Environment Variables

```csharp
var apiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY");
```

### Docker Secrets

```csharp
// Mount secrets as files
var apiKey = File.ReadAllText("/run/secrets/openai_api_key");
```

### AWS Secrets Manager

```csharp
// Use AWS SDK
var secretManager = new AmazonSecretsManagerClient();
var secret = await secretManager.GetSecretValueAsync(...);
```

## Troubleshooting

### Secrets Not Loading

**Problem**: Application throws "API key not found" error

**Solution**:
1. Verify user secrets initialized: `dotnet user-secrets init`
2. Verify secret was set: `dotnet user-secrets list`
3. Check UserSecretsId in .csproj file
4. Rebuild project: `dotnet clean && dotnet build`

### API Key Not Working

**Problem**: "Invalid API key" error from OpenAI

**Solution**:
1. Verify API key is correct: `dotnet user-secrets list`
2. Ensure key is from https://platform.openai.com/api-keys
3. Check key hasn't been revoked
4. Verify key has access to the specified model

### Secrets File Locked

**Problem**: Cannot set/remove secrets (file locked)

**Solution**:
1. Close all VS instances
2. Close Terminal/Command Prompt
3. Try again

## Project Structure

```
BbQ.ChatWidgets.Sample/
??? BbQ.ChatWidgets.Sample.csproj
??? Program.cs                    (Main entry point + ChatService)
??? README.md                     (This file)
??? .gitignore                    (Includes secrets.json)
```

## File Descriptions

- **Program.cs**: Main application with CLI loop, configuration, DI setup
- **BbQ.ChatWidgets.Sample.csproj**: Project file with User Secrets configuration
- **README.md**: This documentation

## Configuration Files

### .csproj

Contains User Secrets ID:

```xml
<UserSecretsId>BbQ.ChatWidgets.Sample-{GUID}</UserSecretsId>
```

### .gitignore

Prevents secrets from being committed:

```
# User Secrets
secrets.json
[Uu]serSecrets/
```

## Running Tests

Currently no tests are included, but you can add them:

```bash
dotnet new xunit -n BbQ.ChatWidgets.Sample.Tests
cd BbQ.ChatWidgets.Sample.Tests
dotnet add reference ../BbQ.ChatWidgets.Sample/BbQ.ChatWidgets.Sample.csproj
```

## Examples

### Example 1: Ask a Question

```
You: What is the capital of France?
Assistant: The capital of France is Paris...
```

### Example 2: Request Code

```
You: Write a C# hello world program
Assistant: Here's a simple C# hello world program:
...
```

### Example 3: Use Conversation Context

```
You: What is 2+2?
Assistant: 2 + 2 = 4

You: What is the answer times 3?
Assistant: The answer (4) times 3 is 12
```

## Integration with BbQ.ChatWidgets

This sample demonstrates how to:

1. **Use ChatWidgets services** in a console app
2. **Handle widget responses** from the AI
3. **Manage conversation threads** with thread IDs
4. **Display widgets** in the UI

When the AI returns widgets, the app displays:

```
[2 widget(s) available]
  1. button: Click here
  2. dropdown: Select option
```

## Support

For issues or questions:

1. Check the Troubleshooting section above
2. Review BbQ.ChatWidgets documentation
3. Check OpenAI API documentation
4. File an issue on GitHub

## License

This sample is part of BbQ.ChatWidgets and follows the same MIT license.

---

**Happy Coding! ??**
