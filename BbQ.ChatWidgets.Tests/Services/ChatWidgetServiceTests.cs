using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Services;
using BbQ.MockLite;
using Microsoft.Extensions.AI;
using Xunit;

namespace BbQ.ChatWidgets.Tests.Services;

/// <summary>
/// Tests for ChatWidgetService message processing and widget integration.
/// </summary>
public class ChatWidgetServiceTests
{
    private readonly MockChatClient mockChat = new();
    private readonly Mock<IWidgetHintParser> mockWidgetHintParser = new();
    private readonly Mock<IWidgetHintSanitizer> mockWidgetHintSanitizer = new();
    private readonly Mock<IWidgetToolsProvider> mockToolsProvider = new();
    private readonly Mock<IAIToolsProvider> mockAIToolsProvider = new();
    private readonly Mock<IThreadService> mockThreadService = new();
    private readonly Mock<IThreadPersonaStore> mockThreadPersonaStore = new();
    private readonly Mock<IAIInstructionProvider> mockAIInstructionsProvider = new();
    private readonly Mock<IWidgetActionRegistry> mockActionRegistry = new();
    private readonly Mock<IWidgetActionHandlerResolver> mockHandlerResolver = new();
    private readonly Mock<IChatHistorySummarizer> mockHistorySummarizer = new();
    private readonly BbQChatOptions options = new();

    private readonly ChatWidgetService chatWidgetService;

    public ChatWidgetServiceTests()
    {
        chatWidgetService = new ChatWidgetService(
            mockChat,
            mockWidgetHintParser.Object,
            mockWidgetHintSanitizer.Object,
            mockToolsProvider.Object,
            mockAIToolsProvider.Object,
            mockThreadService.Object,
            mockThreadPersonaStore.Object,
            mockAIInstructionsProvider.Object,
            mockActionRegistry.Object,
            mockHandlerResolver.Object,
            mockHistorySummarizer.Object,
            options
        );
    }

    private void SetupBasicConversationFlow()
    {
        mockThreadService.Setup(ts => ts.ThreadExists(It.IsAny<string>()), () => true);
        mockThreadService
            .Setup(ts => ts.AppendMessageToThread(It.IsAny<string>(), It.IsAny<ChatTurn>()), () => new ChatMessages([new ChatTurn(ChatRole.User, "Hello")]));

        mockToolsProvider.Setup(tp => tp.GetTools(), () => []);
        mockAIToolsProvider.Setup(tp => tp.GetAITools(), () => []);
        mockThreadPersonaStore.Setup(ps => ps.GetPersona(It.IsAny<string>()), () => null);
        mockAIInstructionsProvider.Setup(ip => ip.GetInstructions(), () => "Base instructions");
    }

    [Fact]
    public async Task RespondAsync_CreatesThreadIfNotExists()
    {
        // Arrange

        mockThreadService.Setup(ts => ts.ThreadExists(It.IsAny<string>()), () => false);
        mockThreadService.Setup(ts => ts.CreateThread(), () => "thread-123");
        mockThreadService
            .Setup(ts => ts.AppendMessageToThread(
                It.IsAny<string>(),
                It.IsAny<ChatTurn>()),
                () => new ChatMessages([new ChatTurn(ChatRole.User, "Hello")]));

        mockToolsProvider.Setup(tp => tp.GetTools(), () => []);
        mockAIToolsProvider.Setup(tp => tp.GetAITools(), () => []);

        // Act
        var result = await chatWidgetService.RespondAsync("Hello", threadId: null);

        // Assert
        mockThreadService.Verify(ts => ts.CreateThread(), Times.Once);
    }

    [Fact]
    public async Task RespondAsync_UsesExistingThread()
    {
        // Arrange
        SetupBasicConversationFlow();
        mockThreadService.Setup(ts => ts.ThreadExists("thread-123"), () => true);


        // Act
        var result = await chatWidgetService.RespondAsync("Hello", threadId: "thread-123");

        // Assert
        mockThreadService.Verify(ts => ts.CreateThread(), Times.Never);
    }

    [Fact]
    public async Task RespondAsync_AppendsMessageToThread()
    {
        // Arrange
        SetupBasicConversationFlow();


        // Act
        await chatWidgetService.RespondAsync("Test message", threadId: "thread-123");

        // Assert
        mockThreadService.Verify(
            ts => ts.AppendMessageToThread(
                It.IsAny<string>(),
                It.Matches<ChatTurn>(ct => ct.Content == "Test message" && ct.Role == ChatRole.User)),
            Times.Exactly(2));
    }

    [Fact]
    public async Task RespondAsync_ProvidesTool()
    {
        // Arrange
        mockThreadService.Setup(ts => ts.ThreadExists(It.IsAny<string>()), () => true);
        mockThreadService
            .Setup(ts => ts.AppendMessageToThread(It.IsAny<string>(), It.IsAny<ChatTurn>()), () => new ChatMessages([new ChatTurn(ChatRole.User, "Hello")]));

        var tools = new List<WidgetTool> { new(new ButtonWidget("test", "Test tool")) };
        mockToolsProvider.Setup(tp => tp.GetTools(), () => tools);
        mockAIToolsProvider.Setup(tp => tp.GetAITools(), () => tools);
        mockAIInstructionsProvider.Setup(ip => ip.GetInstructions(), () => "Base instructions");
        mockThreadPersonaStore.Setup(ps => ps.GetPersona(It.IsAny<string>()), () => null);

        // Act
        await chatWidgetService.RespondAsync("Test", threadId: "thread-123");

        // Assert

        mockAIToolsProvider.Verify(
            c => c.GetAITools(),
            Times.Once);
    }

    [Fact]
    public async Task RespondAsync_PersonaOverride_PersistsAndPrependsInstructions()
    {
        // Arrange
        SetupBasicConversationFlow();
        options.EnablePersona = true;

        // Act
        await chatWidgetService.RespondAsync("Hello", "thread-123", "Friendly pirate");

        // Assert
        Assert.NotNull(mockChat.LastChatOptions);
        Assert.Contains("Friendly pirate", mockChat.LastChatOptions!.Instructions);
        Assert.Contains("Base instructions", mockChat.LastChatOptions.Instructions);
    }

    [Fact]
    public async Task RespondAsync_UsesThreadPersona_WhenRequestPersonaIsNotProvided()
    {
        // Arrange
        SetupBasicConversationFlow();
        options.EnablePersona = true;
        mockThreadPersonaStore.Setup(ps => ps.GetPersona("thread-123"), () => "Helpful teacher");

        // Act
        await chatWidgetService.RespondAsync("Hello", "thread-123");

        // Assert
        Assert.NotNull(mockChat.LastChatOptions);
        Assert.Contains("Helpful teacher", mockChat.LastChatOptions!.Instructions);
    }

    [Fact]
    public async Task RespondAsync_UsesDefaultPersona_WhenNoRequestOrThreadPersona()
    {
        // Arrange
        SetupBasicConversationFlow();
        options.EnablePersona = true;
        options.DefaultPersona = "Concise architect";

        // Act
        await chatWidgetService.RespondAsync("Hello", "thread-123");

        // Assert
        Assert.NotNull(mockChat.LastChatOptions);
        Assert.Contains("Concise architect", mockChat.LastChatOptions!.Instructions);
    }

    [Fact]
    public async Task RespondAsync_EmptyPersonaOverride_ClearsThreadPersona()
    {
        // Arrange
        SetupBasicConversationFlow();
        options.EnablePersona = true;
        options.DefaultPersona = "Default advisor";

        // Act
        await chatWidgetService.RespondAsync("Hello", "thread-123", "   ");

        // Assert
        Assert.NotNull(mockChat.LastChatOptions);
        Assert.Contains("Default advisor", mockChat.LastChatOptions!.Instructions);
    }

    [Fact]
    public async Task RespondAsync_TooLongPersonaOverride_ThrowsArgumentException()
    {
        // Arrange
        SetupBasicConversationFlow();
        options.EnablePersona = true;
        options.MaxPersonaLength = 10;

        // Act + Assert
        await Assert.ThrowsAsync<ArgumentException>(() =>
            chatWidgetService.RespondAsync("Hello", "thread-123", "this persona is way too long"));
    }

    [Fact]
    public async Task RespondAsync_PersonaOverrideWithControlCharacters_ThrowsArgumentException()
    {
        // Arrange
        SetupBasicConversationFlow();
        options.EnablePersona = true;

        // Act + Assert
        await Assert.ThrowsAsync<ArgumentException>(() =>
            chatWidgetService.RespondAsync("Hello", "thread-123", "safe\u0001persona"));
    }

    [Fact]
    public async Task RespondAsync_WhenPersonaDisabled_PersonaOverrideThrows()
    {
        // Arrange
        SetupBasicConversationFlow();
        options.EnablePersona = false;

        // Act + Assert
        await Assert.ThrowsAsync<ArgumentException>(() =>
            chatWidgetService.RespondAsync("Hello", "thread-123", "Friendly pirate"));
    }

    [Fact]
    public async Task RespondAsync_WhenPersonaDisabled_DefaultPersonaIsIgnored()
    {
        // Arrange
        SetupBasicConversationFlow();
        options.EnablePersona = false;
        options.DefaultPersona = "Concise architect";

        // Act
        await chatWidgetService.RespondAsync("Hello", "thread-123");

        // Assert
        Assert.NotNull(mockChat.LastChatOptions);
        Assert.Equal("Base instructions", mockChat.LastChatOptions!.Instructions);
    }
}


class MockChatClient : IChatClient
{
    public ChatOptions? LastChatOptions { get; private set; }

    public void Dispose()
    {
        throw new NotImplementedException();
    }

    public Task<ChatResponse> GetResponseAsync(IEnumerable<ChatMessage> messages, ChatOptions? options = null, CancellationToken cancellationToken = default)
    {
        LastChatOptions = options;
        var input = @"This is a widget: <widget>{""type"":""input"",""label"":""Email"",""action"":""email"",""placeholder"":""user@example.com"",""maxLength"":100}</widget>";
        
        return Task.FromResult(new ChatResponse([new ChatMessage(ChatRole.Assistant, input)]));
    }

    public object? GetService(Type serviceType, object? serviceKey = null)
    {
        return null;
    }

    public IAsyncEnumerable<ChatResponseUpdate> GetStreamingResponseAsync(IEnumerable<ChatMessage> messages, ChatOptions? options = null, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }
}