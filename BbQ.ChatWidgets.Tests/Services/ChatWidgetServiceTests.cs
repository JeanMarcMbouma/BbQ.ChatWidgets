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
            mockAIInstructionsProvider.Object,
            mockActionRegistry.Object,
            mockHandlerResolver.Object,
            mockHistorySummarizer.Object,
            options
        );
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
        mockThreadService.Setup(ts => ts.ThreadExists("thread-123"), () => true);
        mockThreadService
            .Setup(ts => ts.AppendMessageToThread(It.IsAny<string>(), It.IsAny<ChatTurn>()), () => new ChatMessages([new ChatTurn(ChatRole.User, "Hello")]));

        mockToolsProvider.Setup(tp => tp.GetTools(), () => []);
        mockAIToolsProvider.Setup(tp => tp.GetAITools(), () => []);


        // Act
        var result = await chatWidgetService.RespondAsync("Hello", threadId: "thread-123");

        // Assert
        mockThreadService.Verify(ts => ts.CreateThread(), Times.Never);
    }

    [Fact]
    public async Task RespondAsync_AppendsMessageToThread()
    {
        // Arrange

        mockThreadService.Setup(ts => ts.ThreadExists(It.IsAny<string>()), () => true);
        mockThreadService
            .Setup(ts => ts.AppendMessageToThread(It.IsAny<string>(), It.IsAny<ChatTurn>()), () => new ChatMessages([new ChatTurn(ChatRole.User, "Hello")]));

        mockToolsProvider.Setup(tp => tp.GetTools(), () => []);
        mockAIToolsProvider.Setup(tp => tp.GetAITools(), () => []);


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

        // Act
        await chatWidgetService.RespondAsync("Test", threadId: "thread-123");

        // Assert

        mockAIToolsProvider.Verify(
            c => c.GetAITools(),
            Times.Once);
    }
}


class MockChatClient : IChatClient
{
    public void Dispose()
    {
        throw new NotImplementedException();
    }

    public Task<ChatResponse> GetResponseAsync(IEnumerable<ChatMessage> messages, ChatOptions? options = null, CancellationToken cancellationToken = default)
    {
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