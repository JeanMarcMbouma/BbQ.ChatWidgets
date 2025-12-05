using Xunit;
using Microsoft.Extensions.AI;
using BbQ.ChatWidgets.Services;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Abstractions;
using BbQ.MockLite;

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
        var mockChat = new Mock<IChatClient>();
        var mockActionHandler = new Mock<IWidgetActionHandler>();
        var mockToolsProvider = new Mock<IWidgetToolsProvider>();
        var mockThreadService = new Mock<IThreadService>();

        mockThreadService.Setup(ts => ts.ThreadExists(It.IsAny<string>()),() => false);
        mockThreadService.Setup(ts => ts.CreateThread(), () => "thread-123");
        mockThreadService
            .Setup(ts => ts.AppendMessageToThread(It.IsAny<string>(), It.IsAny<ChatTurn>()), () => new ChatWidgets.Models.ChatMessages([]));
        
        mockToolsProvider.Setup(tp => tp.GetTools(), () => []);

        var response = Mock.Of<ChatResponse<BbQStructuredResponse>>();
        mockChat
            .Setup(c => c.GetResponseAsync<BbQStructuredResponse>(
                It.IsAny<IEnumerable<ChatMessage>>(),
                It.IsAny<ChatOptions>(),
                It.IsAny<bool>(),
                It.IsAny<CancellationToken>()), () => Task.FromResult(response));

        var service = new ChatWidgetService(mockChat.Object, mockActionHandler.Object, mockToolsProvider.Object, mockThreadService.Object);

        // Act
        var result = await service.RespondAsync("Hello", threadId: null);

        // Assert
        mockThreadService.Verify(ts => ts.CreateThread(), Times.Once);
    }

    [Fact]
    public async Task RespondAsync_UsesExistingThread()
    {
        // Arrange
        var mockChat = new Mock<IChatClient>();
        var mockActionHandler = new Mock<IWidgetActionHandler>();
        var mockToolsProvider = new Mock<IWidgetToolsProvider>();
        var mockThreadService = new Mock<IThreadService>();

        mockThreadService.Setup(ts => ts.ThreadExists("thread-123"), () => true);
        mockThreadService
            .Setup(ts => ts.AppendMessageToThread(It.IsAny<string>(), It.IsAny<ChatTurn>()), () => new ChatMessages([]));
        
        mockToolsProvider.Setup(tp => tp.GetTools(), () => new List<WidgetTool>());

        var response = Mock.Of<ChatResponse<BbQStructuredResponse>>();
        mockChat
            .Setup(c => c.GetResponseAsync<BbQStructuredResponse>(
                It.IsAny<IEnumerable<ChatMessage>>(),
                It.IsAny<ChatOptions>(),
                It.IsAny<bool>(),
                It.IsAny<CancellationToken>()), () => Task.FromResult(response));

        var service = new ChatWidgetService(mockChat.Object, mockActionHandler.Object, mockToolsProvider.Object, mockThreadService.Object);

        // Act
        var result = await service.RespondAsync("Hello", threadId: "thread-123");

        // Assert
        mockThreadService.Verify(ts => ts.CreateThread(), Times.Never);
    }

    [Fact]
    public async Task RespondAsync_AppendsMessageToThread()
    {
        // Arrange
        var mockChat = new Mock<IChatClient>();
        var mockActionHandler = new Mock<IWidgetActionHandler>();
        var mockToolsProvider = new Mock<IWidgetToolsProvider>();
        var mockThreadService = new Mock<IThreadService>();

        mockThreadService.Setup(ts => ts.ThreadExists(It.IsAny<string>()), () => true);
        mockThreadService
            .Setup(ts => ts.AppendMessageToThread(It.IsAny<string>(), It.IsAny<ChatTurn>()), () => new ChatMessages([]));
        
        mockToolsProvider.Setup(tp => tp.GetTools(), () => new List<WidgetTool>());
        
        var response = Mock.Of<ChatResponse<BbQStructuredResponse>>();
        mockChat
            .Setup(c => c.GetResponseAsync<BbQStructuredResponse>(
                It.IsAny<IEnumerable<ChatMessage>>(),
                It.IsAny<ChatOptions>(),
                It.IsAny<bool>(),
                It.IsAny<CancellationToken>()), () => Task.FromResult(response));

        var service = new ChatWidgetService(mockChat.Object, mockActionHandler.Object, mockToolsProvider.Object, mockThreadService.Object);

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
        var mockChat = new Mock<IChatClient>();
        var mockActionHandler = new Mock<IWidgetActionHandler>();
        var mockToolsProvider = new Mock<IWidgetToolsProvider>();
        var mockThreadService = new Mock<IThreadService>();

        mockThreadService.Setup(ts => ts.ThreadExists(It.IsAny<string>()), () => true);
        mockThreadService
            .Setup(ts => ts.AppendMessageToThread(It.IsAny<string>(), It.IsAny<ChatTurn>()), () => new ChatMessages([]));

        var tools = new List<WidgetTool> { new (new ButtonWidget("test", "Test tool")) };
        mockToolsProvider.Setup(tp => tp.GetTools(), () => tools);

        var response = Mock.Of<ChatResponse<BbQStructuredResponse>>();

        mockChat
            .Setup(c => c.GetResponseAsync<BbQStructuredResponse>(
                It.IsAny<IEnumerable<ChatMessage>>(),
                It.IsAny<ChatOptions>(),
                It.IsAny<bool>(),
                It.IsAny<CancellationToken>()), () => Task.FromResult(response));

        var service = new ChatWidgetService(mockChat.Object, mockActionHandler.Object, mockToolsProvider.Object, mockThreadService.Object);

        // Act
        await service.RespondAsync("Test", threadId: "thread-123");

        // Assert
        mockChat.Verify(
            c => c.GetResponseAsync<BbQStructuredResponse>(
                It.IsAny<IEnumerable<ChatMessage>>(),
                It.Matches<ChatOptions>(co => co.Tools != null && co.Tools.Count > 0),
                It.IsAny<bool>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
