using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Services;
using BbQ.MockLite;
using Microsoft.Extensions.AI;
using System.Text.Json;
using Xunit;

namespace BbQ.ChatWidgets.Tests.Services;

/// <summary>
/// Tests for ChatWidgetService message processing and widget integration.
/// </summary>
public class ChatWidgetServiceTests
{
    [Fact]
    public async Task RespondAsync_CreatesThreadIfNotExists()
    {
        // Arrange
        var mockChat = new MockChatClient();
        var mockActionHandler = new Mock<IWidgetActionHandler>();
        var mockToolsProvider = new Mock<IWidgetToolsProvider>();
        var mockThreadService = new Mock<IThreadService>();

        mockThreadService.Setup(ts => ts.ThreadExists(It.IsAny<string>()), () => false);
        mockThreadService.Setup(ts => ts.CreateThread(), () => "thread-123");
        mockThreadService
            .Setup(ts => ts.AppendMessageToThread(
                It.IsAny<string>(),
                It.IsAny<ChatTurn>()),
                () => new ChatMessages([]));

        mockToolsProvider.Setup(tp => tp.GetTools(), () => []);


        var service = new ChatWidgetService(mockChat, mockActionHandler.Object, mockToolsProvider.Object, mockThreadService.Object);

        // Act
        var result = await service.RespondAsync("Hello", threadId: null);

        // Assert
        mockThreadService.Verify(ts => ts.CreateThread(), Times.Once);
    }

    [Fact]
    public async Task RespondAsync_UsesExistingThread()
    {
        // Arrange
        var mockChat = new MockChatClient();
        var mockActionHandler = new Mock<IWidgetActionHandler>();
        var mockToolsProvider = new Mock<IWidgetToolsProvider>();
        var mockThreadService = new Mock<IThreadService>();

        mockThreadService.Setup(ts => ts.ThreadExists("thread-123"), () => true);
        mockThreadService
            .Setup(ts => ts.AppendMessageToThread(It.IsAny<string>(), It.IsAny<ChatTurn>()), () => new ChatMessages([]));

        mockToolsProvider.Setup(tp => tp.GetTools(), () => new List<WidgetTool>());


        var service = new ChatWidgetService(mockChat, mockActionHandler.Object, mockToolsProvider.Object, mockThreadService.Object);

        // Act
        var result = await service.RespondAsync("Hello", threadId: "thread-123");

        // Assert
        mockThreadService.Verify(ts => ts.CreateThread(), Times.Never);
    }

    [Fact]
    public async Task RespondAsync_AppendsMessageToThread()
    {
        // Arrange
        var mockChat = new MockChatClient();

        var mockActionHandler = new Mock<IWidgetActionHandler>();
        var mockToolsProvider = new Mock<IWidgetToolsProvider>();
        var mockThreadService = new Mock<IThreadService>();

        mockThreadService.Setup(ts => ts.ThreadExists(It.IsAny<string>()), () => true);
        mockThreadService
            .Setup(ts => ts.AppendMessageToThread(It.IsAny<string>(), It.IsAny<ChatTurn>()), () => new ChatMessages([]));

        mockToolsProvider.Setup(tp => tp.GetTools(), () => new List<WidgetTool>());


        var service = new ChatWidgetService(mockChat, mockActionHandler.Object, mockToolsProvider.Object, mockThreadService.Object);

        // Act
        await service.RespondAsync("Test message", threadId: "thread-123");

        // Assert
        mockThreadService.Verify(
            ts => ts.AppendMessageToThread(
                It.IsAny<string>(),
                It.Matches<ChatTurn>(ct => ct.Content == "Test message" && ct.Role == ChatRole.User)),
            Times.Once);
    }

    [Fact]
    public async Task RespondAsync_ProvidesTool()
    {
        // Arrange
        var mockChat = new MockChatClient();
        var mockActionHandler = new Mock<IWidgetActionHandler>();
        var mockToolsProvider = new Mock<IWidgetToolsProvider>();
        var mockThreadService = new Mock<IThreadService>();

        mockThreadService.Setup(ts => ts.ThreadExists(It.IsAny<string>()), () => true);
        mockThreadService
            .Setup(ts => ts.AppendMessageToThread(It.IsAny<string>(), It.IsAny<ChatTurn>()), () => new ChatMessages([]));

        var tools = new List<WidgetTool> { new(new ButtonWidget("test", "Test tool")) };
        mockToolsProvider.Setup(tp => tp.GetTools(), () => tools);

        var service = new ChatWidgetService(mockChat, mockActionHandler.Object, mockToolsProvider.Object, mockThreadService.Object);

        // Act
        await service.RespondAsync("Test", threadId: "thread-123");

        // Assert
        mockToolsProvider.Verify(
            c => c.GetTools(),
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
        var input = @"<widget>{""type"":""input"",""label"":""Email"",""action"":""email"",""placeholder"":""user@example.com"",""maxLength"":100}</widget>";
        var item = JsonSerializer.Serialize(new BbQStructuredResponse(
            Content: input,
            Widgets: [new InputWidget("Email", "email")]
        ));
        return Task.FromResult(new ChatResponse<BbQStructuredResponse>(new ChatResponse([new ChatMessage(ChatRole.Assistant, item)]), Serialization.Default) as ChatResponse);
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