using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Extensions;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Services;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace BbQ.ChatWidgets.Tests.Integration;

/// <summary>
/// Integration tests for chat history summarization with ChatWidgetService.
/// </summary>
public class SummarizationIntegrationTests
{
    [Fact]
    public async Task ChatWidgetService_AutoSummarization_CreatesAndUsesSummaries()
    {
        // Arrange
        var services = new ServiceCollection();
        
        var mockChatClient = new TestChatClient("Summary response");
        
        services.AddBbQChatWidgets(options =>
        {
            options.ChatClientFactory = _ => mockChatClient;
            options.EnableAutoSummarization = true;
            options.SummarizationThreshold = 5; // Trigger after 5 turns
            options.RecentTurnsToKeep = 2; // Keep only 2 recent turns
        });
        
        var serviceProvider = services.BuildServiceProvider();
        var chatService = serviceProvider.GetRequiredService<ChatWidgetService>();
        var threadService = serviceProvider.GetRequiredService<IThreadService>();
        
        // Act - Create conversation with more than threshold turns
        string? threadId = null;
        
        // Add 6 messages (3 exchanges) to exceed threshold of 5
        threadId = (await chatService.RespondAsync("Message 1", threadId)).ThreadId;
        threadId = (await chatService.RespondAsync("Message 2", threadId)).ThreadId;
        threadId = (await chatService.RespondAsync("Message 3", threadId)).ThreadId;
        threadId = (await chatService.RespondAsync("Message 4", threadId)).ThreadId;
        threadId = (await chatService.RespondAsync("Message 5", threadId)).ThreadId;
        
        // This should trigger summarization
        var finalResponse = await chatService.RespondAsync("Message 6", threadId);
        
        // Assert
        Assert.NotNull(finalResponse.ThreadId);
        var summaries = threadService.GetSummaries(finalResponse.ThreadId);
        
        // Should have created at least one summary
        Assert.NotEmpty(summaries);
        
        // Verify summary covers appropriate range
        var summary = summaries[0];
        Assert.True(summary.EndTurnIndex >= 0);
        Assert.True(summary.StartTurnIndex <= summary.EndTurnIndex);
    }

    [Fact]
    public async Task ChatWidgetService_DisabledSummarization_DoesNotCreateSummaries()
    {
        // Arrange
        var services = new ServiceCollection();
        
        var mockChatClient = new TestChatClient("Response");
        
        services.AddBbQChatWidgets(options =>
        {
            options.ChatClientFactory = _ => mockChatClient;
            options.EnableAutoSummarization = false; // Disable summarization
            options.SummarizationThreshold = 3;
        });
        
        var serviceProvider = services.BuildServiceProvider();
        var chatService = serviceProvider.GetRequiredService<ChatWidgetService>();
        var threadService = serviceProvider.GetRequiredService<IThreadService>();
        
        // Act - Create conversation with more than threshold turns
        string? threadId = null;
        threadId = (await chatService.RespondAsync("Message 1", threadId)).ThreadId;
        threadId = (await chatService.RespondAsync("Message 2", threadId)).ThreadId;
        threadId = (await chatService.RespondAsync("Message 3", threadId)).ThreadId;
        threadId = (await chatService.RespondAsync("Message 4", threadId)).ThreadId;
        
        // Assert
        var summaries = threadService.GetSummaries(threadId);
        Assert.Empty(summaries); // No summaries should be created when disabled
    }

    [Fact]
    public async Task ChatWidgetService_BelowThreshold_DoesNotCreateSummaries()
    {
        // Arrange
        var services = new ServiceCollection();
        
        var mockChatClient = new TestChatClient("Response");
        
        services.AddBbQChatWidgets(options =>
        {
            options.ChatClientFactory = _ => mockChatClient;
            options.EnableAutoSummarization = true;
            options.SummarizationThreshold = 20; // High threshold
            options.RecentTurnsToKeep = 10;
        });
        
        var serviceProvider = services.BuildServiceProvider();
        var chatService = serviceProvider.GetRequiredService<ChatWidgetService>();
        var threadService = serviceProvider.GetRequiredService<IThreadService>();
        
        // Act - Create conversation below threshold
        string? threadId = null;
        threadId = (await chatService.RespondAsync("Message 1", threadId)).ThreadId;
        threadId = (await chatService.RespondAsync("Message 2", threadId)).ThreadId;
        
        // Assert
        var summaries = threadService.GetSummaries(threadId);
        Assert.Empty(summaries); // No summaries when below threshold
    }

    [Fact]
    public async Task DefaultChatHistorySummarizer_GeneratesSummary()
    {
        // Arrange
        var mockChatClient = new TestChatClient("This is a summary of the conversation about testing and integration.");
        
        var summarizer = new DefaultChatHistorySummarizer(mockChatClient);
        
        var turns = new List<ChatTurn>
        {
            new(ChatRole.User, "What is integration testing?"),
            new(ChatRole.Assistant, "Integration testing is testing how different parts of a system work together."),
            new(ChatRole.User, "Can you give an example?"),
            new(ChatRole.Assistant, "Sure, testing a database connection with your application is integration testing."),
        };
        
        // Act
        var summary = await summarizer.SummarizeAsync(turns);
        
        // Assert
        Assert.NotEmpty(summary);
        Assert.Contains("summary", summary.ToLower());
    }

    [Fact]
    public async Task DefaultChatHistorySummarizer_EmptyTurns_ReturnsEmptyString()
    {
        // Arrange
        var mockChatClient = new TestChatClient("");
        var summarizer = new DefaultChatHistorySummarizer(mockChatClient);
        var turns = new List<ChatTurn>();
        
        // Act
        var summary = await summarizer.SummarizeAsync(turns);
        
        // Assert
        Assert.Empty(summary);
    }
}

/// <summary>
/// Simple test implementation of IChatClient for integration tests.
/// </summary>
internal class TestChatClient : IChatClient
{
    private readonly string _response;

    public TestChatClient(string response)
    {
        _response = response;
    }

    public ChatClientMetadata Metadata => new("test-client");

    public void Dispose() { }

    public Task<ChatResponse> GetResponseAsync(
        IEnumerable<ChatMessage> messages,
        ChatOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new ChatResponse([new ChatMessage(ChatRole.Assistant, _response)]));
    }

    public object? GetService(Type serviceType, object? serviceKey = null)
    {
        return null;
    }

    public IAsyncEnumerable<ChatResponseUpdate> GetStreamingResponseAsync(
        IEnumerable<ChatMessage> messages,
        ChatOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }

    public TService? GetService<TService>(object? key = null) where TService : class
    {
        return null;
    }
}
