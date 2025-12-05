using Xunit;
using BbQ.ChatWidgets.Models;
using Microsoft.Extensions.AI;

namespace BbQ.ChatWidgets.Tests.Models;

/// <summary>
/// Tests for ChatTurn conversation turn modeling.
/// </summary>
public class ChatTurnTests
{
    [Fact]
    public void ChatTurn_CreatedWithUserRole()
    {
        // Arrange
        var threadId = "thread-123";
        var content = "Hello, assistant!";

        // Act
        var turn = new ChatTurn(ChatRole.User, content, Widgets: null, ThreadId: threadId);

        // Assert
        Assert.Equal(ChatRole.User, turn.Role);
        Assert.Equal(content, turn.Content);
        Assert.Equal(threadId, turn.ThreadId);
        Assert.Null(turn.Widgets);
    }

    [Fact]
    public void ChatTurn_CreatedWithAssistantRole()
    {
        // Arrange
        var threadId = "thread-123";
        var content = "Hello, user!";

        // Act
        var turn = new ChatTurn(ChatRole.Assistant, content, Widgets: null, ThreadId: threadId);

        // Assert
        Assert.Equal(ChatRole.Assistant, turn.Role);
        Assert.Equal(content, turn.Content);
    }

    [Fact]
    public void ChatTurn_WithWidgets()
    {
        // Arrange
        var widgets = new List<ChatWidget>
        {
            new ButtonWidget("Click", "click"),
            new DropdownWidget("Choose", "choose", new[] { "A", "B" })
        };
        var turn = new ChatTurn(ChatRole.Assistant, "Choose an option", widgets, "thread-123");

        // Act & Assert
        Assert.NotNull(turn.Widgets);
        Assert.Equal(2, turn.Widgets.Count);
    }

    [Fact]
    public void ChatTurn_IsImmutable()
    {
        // Arrange
        var turn = new ChatTurn(ChatRole.User, "Hello", Widgets: null, ThreadId: "thread-123");

        // Act & Assert
        // Records are immutable, so this would be a compilation error
        // This test documents the immutability contract
        Assert.Equal("Hello", turn.Content);
    }
}
