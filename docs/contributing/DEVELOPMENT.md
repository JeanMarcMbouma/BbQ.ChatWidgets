Development setup has been consolidated into `docs/contributing/README.md`.
# Development Setup Guide

How to set up your development environment for contributing to BbQ.ChatWidgets.

## Prerequisites

- **.NET 8 SDK** or higher
- **Git** for version control
- **Visual Studio Code** or **Visual Studio 2022**
- **Basic C# knowledge**

## Step 1: Clone the Repository

```bash
git clone https://github.com/JeanMarcMbouma/BbQ.ChatWidgets
cd BbQ.ChatWidgets
```

## Step 2: Open in IDE

### Visual Studio Code

```bash
code .
```

Install extensions:
- C# (OmniSharp)
- REST Client (for API testing)

### Visual Studio

```bash
start BbQ.ChatWidgets.sln
```

## Step 3: Build the Solution

```bash
dotnet build
```

Expected output:
```
Build succeeded. 0 Warning(s)
```

## Step 4: Run Tests

```bash
dotnet test
```

## Step 5: Try the Sample App

```bash
cd BbQ.ChatWidgets.Sample
dotnet run
```

Navigate to `http://localhost:5000`

## Project Structure

```
BbQ.ChatWidgets/
— BbQ.ChatWidgets/                  # Main library
  — Models/                       # Data structures
  — Services/                     # Core services
  — Extensions/                   # Extension methods
  — Abstractions/                 # Interfaces

— BbQ.ChatWidgets.Tests/            # Unit tests
  — Services/
  — Models/

— BbQ.ChatWidgets.Sample/           # Sample app
  — Program.cs
  — wwwroot/

— docs/                             # Documentation
```

## Common Commands

```bash
# Build
dotnet build

# Run tests
dotnet test

# Run test with coverage
dotnet test /p:CollectCoverage=true

# Run sample app
cd BbQ.ChatWidgets.Sample
dotnet run

# Clean build
dotnet clean && dotnet build

# Run specific test
dotnet test --filter "TestClassName"
```

## Setting API Keys for Testing

```bash
# OpenAI API key
dotnet user-secrets set "OpenAI:ApiKey" "sk-..."

# View all secrets
dotnet user-secrets list
```

## Debugging

### Visual Studio Code

1. Press `F5` to start debugging
2. Set breakpoints by clicking line numbers
3. Step through code with `F10`

### Visual Studio

1. Press `F5` to start debugging
2. Set breakpoints by clicking gutter
3. Use Debug menu for controls

## Making Changes

1. Create a branch: `git checkout -b feature/my-feature`
2. Make changes
3. Run tests: `dotnet test`
4. Commit: `git commit -am "Description"`
5. Push: `git push origin feature/my-feature`
6. Create PR on GitHub

## Code Review Checklist

Before submitting a PR:

- [ ] Code builds without errors
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Code follows style guide
- [ ] Documentation updated
- [ ] Commits have clear messages
- [ ] No merge conflicts

## Useful Tools

### REST Client (VS Code)

Create `test.http`:

```http
POST http://localhost:5000/api/chat/message
Content-Type: application/json

{
  "message": "Hello",
  "threadId": null
}
```

### dotnet-format

Format code automatically:

```bash
dotnet format
```

### Code Analysis

```bash
dotnet build /p:EnforceCodeStyleInBuild=true
```

## Troubleshooting

### Build Fails
```bash
dotnet clean
dotnet restore
dotnet build
```

### Tests Fail
- Ensure .NET 8 is installed
- Check API keys are set
- Check database connection

### Hot Reload Not Working
- Restart the application
- Check if files were saved

## Getting Help

- Check documentation
- Look at existing code
- Ask in GitHub Discussions
- Review similar PRs

## Next Steps

- **[CODE_STYLE.md](CODE_STYLE.md)** - Code style guidelines
- **[TESTING.md](TESTING.md)** - Testing guidelines
- **[DOCUMENTATION.md](DOCUMENTATION.md)** - Doc standards

---

**Back to:** [Contributing Guides](README.md)
