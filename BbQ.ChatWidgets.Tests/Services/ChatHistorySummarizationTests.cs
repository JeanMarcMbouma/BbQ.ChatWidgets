using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Exceptions;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Services;
using Microsoft.Extensions.AI;
using Xunit;

namespace BbQ.ChatWidgets.Tests.Services;

/// <summary>
/// Tests for chat history summarization functionality.
/// </summary>
public class ChatHistorySummarizationTests
{
    [Fact]
    public void DefaultThreadService_StoreSummary_Success()
    {
        // Arrange
        var threadService = new DefaultThreadService();
        var threadId = threadService.CreateThread();
        var summary = new ChatSummary("Test summary", 0, 4);

        // Act
        threadService.StoreSummary(threadId, summary);
        var summaries = threadService.GetSummaries(threadId);

        // Assert
        Assert.Single(summaries);
        Assert.Equal("Test summary", summaries[0].SummaryText);
        Assert.Equal(0, summaries[0].StartTurnIndex);
        Assert.Equal(4, summaries[0].EndTurnIndex);
    }

    [Fact]
    public void DefaultThreadService_StoreSummary_MultipleSuccessive()
    {
        // Arrange
        var threadService = new DefaultThreadService();
        var threadId = threadService.CreateThread();
        var summary1 = new ChatSummary("First summary", 0, 4);
        var summary2 = new ChatSummary("Second summary", 5, 9);

        // Act
        threadService.StoreSummary(threadId, summary1);
        threadService.StoreSummary(threadId, summary2);
        var summaries = threadService.GetSummaries(threadId);

        // Assert
        Assert.Equal(2, summaries.Count);
        Assert.Equal("First summary", summaries[0].SummaryText);
        Assert.Equal("Second summary", summaries[1].SummaryText);
    }

    [Fact]
    public void DefaultThreadService_GetSummaries_EmptyWhenNoneStored()
    {
        // Arrange
        var threadService = new DefaultThreadService();
        var threadId = threadService.CreateThread();

        // Act
        var summaries = threadService.GetSummaries(threadId);

        // Assert
        Assert.Empty(summaries);
    }

    [Fact]
    public void DefaultThreadService_DeleteThread_RemovesSummaries()
    {
        // Arrange
        var threadService = new DefaultThreadService();
        var threadId = threadService.CreateThread();
        var summary = new ChatSummary("Test summary", 0, 4);
        threadService.StoreSummary(threadId, summary);

        // Act
        threadService.DeleteThread(threadId);
        var newThreadId = threadService.CreateThread();

        // Assert
        Assert.NotEqual(threadId, newThreadId);
        var summaries = threadService.GetSummaries(newThreadId);
        Assert.Empty(summaries);
    }

    [Fact]
    public void DefaultThreadService_StoreSummary_ThrowsOnNonExistentThread()
    {
        // Arrange
        var threadService = new DefaultThreadService();
        var summary = new ChatSummary("Test summary", 0, 4);
        var nonExistentThreadId = "non-existent-thread";

        // Act & Assert
        var exception = Assert.Throws<ThreadNotFoundException>(() =>
            threadService.StoreSummary(nonExistentThreadId, summary));
        Assert.Equal(nonExistentThreadId, exception.ThreadId);
    }

    [Fact]
    public void DefaultThreadService_GetSummaries_ThrowsOnNonExistentThread()
    {
        // Arrange
        var threadService = new DefaultThreadService();
        var nonExistentThreadId = "non-existent-thread";

        // Act & Assert
        var exception = Assert.Throws<ThreadNotFoundException>(() =>
            threadService.GetSummaries(nonExistentThreadId));
        Assert.Equal(nonExistentThreadId, exception.ThreadId);
    }

    [Fact]
    public void ChatMessages_ToAIMessages_WithSummaries_IncludesSummaryMessage()
    {
        // Arrange
        var turns = new List<ChatTurn>
        {
            new(ChatRole.User, "Turn 1"),
            new(ChatRole.Assistant, "Response 1"),
            new(ChatRole.User, "Turn 2"),
            new(ChatRole.Assistant, "Response 2"),
            new(ChatRole.User, "Turn 3"),
            new(ChatRole.Assistant, "Response 3"),
        };
        var messages = new ChatMessages(turns);
        var summaries = new List<ChatSummary>
        {
            new ChatSummary("Summary of turns 0-3", 0, 3)
        };

        // Act
        var aiMessages = messages.ToAIMessages(2, summaries);

        // Assert
        // Should have: 1 system message (summary) + 2 recent turns = 3 messages
        Assert.Equal(3, aiMessages.Count);
        Assert.Equal(ChatRole.System, aiMessages[0].Role);
        Assert.Contains("Summary of turns 0-3", aiMessages[0].Text);
        Assert.Equal("Turn 3", aiMessages[1].Text);
        Assert.Equal("Response 3", aiMessages[2].Text);
    }

    [Fact]
    public void ChatMessages_ToAIMessages_WithMultipleSummaries_CombinesThem()
    {
        // Arrange
        var turns = new List<ChatTurn>
        {
            new(ChatRole.User, "Turn 1"),
            new(ChatRole.Assistant, "Response 1"),
            new(ChatRole.User, "Turn 2"),
            new(ChatRole.Assistant, "Response 2"),
        };
        var messages = new ChatMessages(turns);
        var summaries = new List<ChatSummary>
        {
            new ChatSummary("First summary", 0, 1),
            new ChatSummary("Second summary", 2, 3)
        };

        // Act
        var aiMessages = messages.ToAIMessages(2, summaries);

        // Assert
        Assert.Equal(3, aiMessages.Count);
        Assert.Equal(ChatRole.System, aiMessages[0].Role);
        Assert.Contains("First summary", aiMessages[0].Text);
        Assert.Contains("Second summary", aiMessages[0].Text);
    }

    [Fact]
    public void ChatMessages_ToAIMessages_WithEmptySummaries_WorksNormally()
    {
        // Arrange
        var turns = new List<ChatTurn>
        {
            new(ChatRole.User, "Turn 1"),
            new(ChatRole.Assistant, "Response 1"),
        };
        var messages = new ChatMessages(turns);
        var summaries = new List<ChatSummary>();

        // Act
        var aiMessages = messages.ToAIMessages(2, summaries);

        // Assert
        Assert.Equal(2, aiMessages.Count);
        Assert.Equal("Turn 1", aiMessages[0].Text);
        Assert.Equal("Response 1", aiMessages[1].Text);
    }

    [Fact]
    public void ChatMessages_ToAIMessages_WithSummaries_ThrowsOnNullSummaries()
    {
        // Arrange
        var turns = new List<ChatTurn>
        {
            new(ChatRole.User, "Turn 1"),
        };
        var messages = new ChatMessages(turns);

        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => messages.ToAIMessages(1, null!));
    }

    [Fact]
    public void ChatMessages_ToAIMessages_WithSummaries_ThrowsOnInvalidMaxTurns()
    {
        // Arrange
        var turns = new List<ChatTurn>
        {
            new(ChatRole.User, "Turn 1"),
        };
        var messages = new ChatMessages(turns);
        var summaries = new List<ChatSummary>();

        // Act & Assert
        Assert.Throws<ArgumentOutOfRangeException>(() => messages.ToAIMessages(0, summaries));
    }
}
