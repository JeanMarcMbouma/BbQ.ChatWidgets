using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Extensions;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Services;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using Xunit.Abstractions;

namespace BbQ.ChatWidgets.Tests.Demonstrations;

/// <summary>
/// Demonstration test showing chat history summarization in action.
/// </summary>
public class SummarizationDemonstrationTest
{
    private readonly ITestOutputHelper _output;

    public SummarizationDemonstrationTest(ITestOutputHelper output)
    {
        _output = output;
    }

    [Fact]
    public async Task Demonstrate_ChatHistorySummarization_WithLongConversation()
    {
        // Arrange
        _output.WriteLine("=== Chat History Summarization Demonstration ===\n");
        
        var services = new ServiceCollection();
        var mockChatClient = new DemoChatClient();
        
        services.AddBbQChatWidgets(options =>
        {
            options.ChatClientFactory = _ => mockChatClient;
            options.EnableAutoSummarization = true;
            options.SummarizationThreshold = 8;  // Trigger after 8 turns
            options.RecentTurnsToKeep = 4;        // Keep last 4 turns
        });
        
        var serviceProvider = services.BuildServiceProvider();
        var chatService = serviceProvider.GetRequiredService<ChatWidgetService>();
        var threadService = serviceProvider.GetRequiredService<IThreadService>();
        
        _output.WriteLine("Configuration:");
        _output.WriteLine("  - Summarization Threshold: 8 turns");
        _output.WriteLine("  - Recent Turns to Keep: 4 turns");
        _output.WriteLine("");
        
        // Act - Simulate a long conversation
        _output.WriteLine("Starting conversation...\n");
        
        string? threadId = null;
        var messages = new[]
        {
            "Hello, I need help with my account",
            "Can you help me reset my password?",
            "My email is user@example.com",
            "I also want to update my profile",
            "What information do I need to provide?",
            "How long will it take?",
            "Can I do it right now?",
            "Great, let's proceed"
        };
        
        for (int i = 0; i < messages.Length; i++)
        {
            var response = await chatService.RespondAsync(messages[i], threadId);
            threadId = response.ThreadId;
            
            _output.WriteLine($"Turn {i + 1}:");
            _output.WriteLine($"  User: {messages[i]}");
            _output.WriteLine($"  Assistant: {response.Content}");
            _output.WriteLine("");
        }
        
        // Check summaries
        var summaries = threadService.GetSummaries(threadId!);
        
        _output.WriteLine($"Conversation exceeded threshold of 8 turns!");
        _output.WriteLine($"Total summaries created: {summaries.Count}");
        _output.WriteLine("");
        
        if (summaries.Count > 0)
        {
            _output.WriteLine("Summary Details:");
            foreach (var summary in summaries)
            {
                _output.WriteLine($"  Turns {summary.StartTurnIndex}-{summary.EndTurnIndex}:");
                _output.WriteLine($"    \"{summary.SummaryText}\"");
                _output.WriteLine("");
            }
        }
        
        // Add one more message to show it uses the summary
        _output.WriteLine("Adding one more message to demonstrate summary usage...\n");
        var finalResponse = await chatService.RespondAsync("Thank you for your help!", threadId);
        
        _output.WriteLine($"Turn {messages.Length + 1}:");
        _output.WriteLine($"  User: Thank you for your help!");
        _output.WriteLine($"  Assistant: {finalResponse.Content}");
        _output.WriteLine("");
        
        // Get the full conversation history
        var fullHistory = threadService.GetMessage(threadId!);
        _output.WriteLine($"Total conversation turns: {fullHistory.Turns.Count}");
        
        // Demonstrate what gets sent to AI
        var aiMessages = fullHistory.ToAIMessages(4, summaries);
        _output.WriteLine($"Messages sent to AI (with summaries): {aiMessages.Count}");
        _output.WriteLine("  - 1 system message (summaries)");
        _output.WriteLine("  - 4 recent turns (full detail)");
        
        // Assert
        Assert.NotEmpty(summaries);
        Assert.True(fullHistory.Turns.Count > 8);
        
        _output.WriteLine("\n=== Demonstration Complete ===");
    }
}

/// <summary>
/// Demo chat client that provides realistic responses.
/// </summary>
internal class DemoChatClient : IChatClient
{
    private int _callCount = 0;
    private readonly string[] _responses = new[]
    {
        "Hello! I'd be happy to help you with your account.",
        "Of course! I can help you reset your password. Let me guide you through the process.",
        "Thank you for providing your email. I'll send a password reset link shortly.",
        "Great! Updating your profile is easy. What would you like to change?",
        "You'll need to provide your current contact information and any changes you'd like to make.",
        "The profile update typically takes just a few minutes once submitted.",
        "Absolutely! We can start the process right now if you're ready.",
        "Perfect! Let's get started with the update process.",
        "You're very welcome! Is there anything else I can help you with today?",
        // Summarization response
        "The user requested account help, specifically password reset for user@example.com and profile updates. They confirmed readiness to proceed with the update process."
    };

    public ChatClientMetadata Metadata => new("demo-client");

    public void Dispose() { }

    public Task<ChatResponse> GetResponseAsync(
        IEnumerable<ChatMessage> messages,
        ChatOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        var response = _callCount < _responses.Length 
            ? _responses[_callCount] 
            : "Thank you!";
        
        _callCount++;
        
        return Task.FromResult(new ChatResponse([new ChatMessage(ChatRole.Assistant, response)]));
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
