Testing guidance has been consolidated into `docs/contributing/README.md`.
# Testing Guidelines

How to write tests for BbQ.ChatWidgets.

## Testing Framework

- **Framework**: xUnit
- **Assertions**: xUnit built-in + FluentAssertions
- **Mocking**: Moq (when needed)
- **Async**: xUnit supports async tests

## Test Project Structure

```
BbQ.ChatWidgets.Tests/
— Services/
    — ChatWidgetServiceTests.cs
    — DefaultThreadServiceTests.cs
— Models/
    — ChatWidgetTests.cs
    — ChatTurnTests.cs
— Fixtures/
    — MockChatClient.cs
    — TestDataBuilder.cs
```

## Test Naming

Use descriptive names following this pattern:

```
MethodName_Scenario_ExpectedResult

Example:
RespondAsync_WithValidMessage_ReturnsNonEmptyResponse
HandleAction_InvalidPayload_ThrowsException
```

## Basic Test Structure

```csharp
using Xunit;
using BbQ.ChatWidgets;

public class ChatWidgetServiceTests
{
    [Fact]
    public async Task RespondAsync_WithValidMessage_ReturnsResponse()
    {
        // Arrange
        var mockClient = new Mock<IChatClient>();
        var service = new ChatWidgetService(mockClient.Object);

        // Act
        var result = await service.RespondAsync("Hello", null);

        // Assert
        Assert.NotNull(result);
    }
}
```

## Test Types

### Unit Tests
Test individual components in isolation.

```csharp
[Fact]
public void ProcessMessage_ValidInput_ReturnsProcessed()
{
    // Test single method in isolation
    var processor = new MessageProcessor();
    var result = processor.Process("test");
    Assert.NotNull(result);
}
```

### Integration Tests
Test multiple components together.

```csharp
[Fact]
public async Task ChatFlow_FullConversation_WorksEnd2End()
{
    // Test entire workflow
    var service = new ChatWidgetService(chatClient, threadService);
    var message1 = await service.RespondAsync("Hi");
    var message2 = await service.RespondAsync("Help", message1.ThreadId);
    
    Assert.NotEmpty(message2.Content);
}
```

### Async Tests
Always use async patterns for async code.

```csharp
[Fact]
public async Task RespondAsync_WithMessage_Completes()
{
    var result = await service.RespondAsync("test", null);
    Assert.NotNull(result);
}
```

## Fixtures & Setup

Reuse test setup with fixtures:

```csharp
public class ChatServiceFixture : IDisposable
{
    public Mock<IChatClient> MockChatClient { get; }
    public Mock<IThreadService> MockThreadService { get; }
    public ChatWidgetService Service { get; }

    public ChatServiceFixture()
    {
        MockChatClient = new Mock<IChatClient>();
        MockThreadService = new Mock<IThreadService>();
        Service = new ChatWidgetService(
            MockChatClient.Object,
            MockThreadService.Object);
    }

    public void Dispose()
    {
        // Cleanup
    }
}

public class ChatWidgetServiceTests : IClassFixture<ChatServiceFixture>
{
    private readonly ChatServiceFixture _fixture;

    public ChatWidgetServiceTests(ChatServiceFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task RespondAsync_ValidMessage_Returns Response()
    {
        var result = await _fixture.Service.RespondAsync("test");
        Assert.NotNull(result);
    }
}
```

## Mocking

Use Moq for dependencies:

```csharp
[Fact]
public async Task HandleAction_CallsThreadService()
{
    // Arrange
    var mockThreadService = new Mock<IThreadService>();
    var handler = new ActionHandler(mockThreadService.Object);

    // Act
    await handler.HandleActionAsync("test", new { }, "thread-1", null);

    // Assert
    mockThreadService.Verify(
        x => x.AppendMessageToThreadAsync(
            It.IsAny<string>(),
            It.IsAny<ChatTurn>()),
        Times.Once);
}
```

## Assertions

### Common Assertions
```csharp
// Null checks
Assert.Null(value);
Assert.NotNull(value);

// Boolean
Assert.True(condition);
Assert.False(condition);

// Equality
Assert.Equal(expected, actual);
Assert.NotEqual(expected, actual);

// Collections
Assert.Empty(collection);
Assert.NotEmpty(collection);
Assert.Contains(item, collection);
Assert.Single(collection);

// Exceptions
Assert.Throws<Exception>(() => { /* code */ });
await Assert.ThrowsAsync<Exception>(() => { /* async code */ });

// Strings
Assert.StartsWith("prefix", str);
Assert.EndsWith("suffix", str);
Assert.Contains("substring", str);
```

## Test Data Builders

Create test data consistently:

```csharp
public class ChatTurnBuilder
{
    private ChatRole _role = ChatRole.Assistant;
    private string _content = "Test content";
    private ChatWidget[] _widgets = Array.Empty<ChatWidget>();

    public ChatTurnBuilder WithRole(ChatRole role)
    {
        _role = role;
        return this;
    }

    public ChatTurnBuilder WithContent(string content)
    {
        _content = content;
        return this;
    }

    public ChatTurn Build()
    {
        return new ChatTurn(_role, _content, _widgets, "thread-1");
    }
}

// Usage
[Fact]
public void CreateTurn_WithBuilder_CreatesCorrectly()
{
    var turn = new ChatTurnBuilder()
        .WithRole(ChatRole.User)
        .WithContent("User message")
        .Build();

    Assert.Equal(ChatRole.User, turn.Role);
}
```

## Testing Edge Cases

Test boundary conditions:

```csharp
[Theory]
[InlineData("")]
[InlineData(null)]
public void ValidateMessage_EmptyOrNull_ThrowsException(string message)
{
    var validator = new MessageValidator();
    Assert.Throws<ArgumentException>(() =>
        validator.Validate(message));
}

[Theory]
[InlineData(-1)]
[InlineData(0)]
[InlineData(101)]
public void ValidateRating_OutOfRange_ThrowsException(int rating)
{
    var validator = new RatingValidator();
    Assert.Throws<ArgumentException>(() =>
        validator.Validate(rating));
}
```

## Test Organization

Group related tests:

```csharp
public class ChatWidgetServiceTests
{
    public class RespondAsync
    {
        [Fact]
        public async Task WithValidMessage_ReturnsResponse() { }

        [Fact]
        public async Task WithEmptyMessage_ThrowsException() { }

        [Fact]
        public async Task WithValidThread_MaintainsContext() { }
    }

    public class HandleActionAsync
    {
        [Fact]
        public async Task WithValidAction_ProcessesCorrectly() { }

        [Fact]
        public async Task WithInvalidAction_ThrowsException() { }
    }
}
```

## Running Tests

```bash
# Run all tests
dotnet test

# Run specific test class
dotnet test --filter "ChatWidgetServiceTests"

# Run specific test
dotnet test --filter "RespondAsync_WithValidMessage"

# Run with coverage
dotnet test /p:CollectCoverage=true

# Run with detailed output
dotnet test --verbosity detailed
```

### Frontend / JavaScript tests

The sample frontend uses Vitest. From the sample frontend folder run:
```bash
cd Sample/WebApp/ClientApp
npm install
npm test
```
If `npm test` is not present, run `npx vitest` directly or add `"test": "vitest"` to `package.json` scripts.

## Code Coverage Goals

Aim for:
- **Overall**: 80%+ coverage
- **Critical paths**: 90%+ coverage
- **Models**: 100% coverage

## Testing Best Practices

? Do's
- One assertion per test (when possible)
- Clear test names
- Test behavior, not implementation
- Use fixtures for setup
- Test edge cases
- Keep tests focused
- Run tests frequently
- Use test data builders

? Don'ts
- Test multiple concepts
- Use vague test names
- Test implementation details
- Share state between tests
- Ignore edge cases
- Use Thread.Sleep()
- Leave commented test code
- Make tests interdependent

## Related Documents

- **[CODE_STYLE.md](CODE_STYLE.md)** - Code style guidelines
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Dev setup

---

**Back to:** [Contributing Guides](README.md)
