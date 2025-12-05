using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.AI;
using BbQ.ChatWidgets.Extensions;
using BbQ.ChatWidgets.Sample;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Services;
using OpenAI;
using OpenAI.Chat;

/// <summary>
/// BbQ.ChatWidgets Console Sample Application
/// 
/// This sample demonstrates:
/// - Using OpenAI chat client with BbQ.ChatWidgets
/// - Storing secrets securely using User Secrets
/// - Multi-turn conversation management
/// - Interactive widget handling
/// </summary>

internal class Program
{
    private static async Task Main(string[] args)
    {
        // Build configuration with User Secrets support
        var configuration = new ConfigurationBuilder()
            .AddUserSecrets<Program>()
            .Build();

        // Build dependency injection container
        var services = new ServiceCollection()
            .AddLogging(builder =>
            {
                builder.AddConsole();
                builder.SetMinimumLevel(LogLevel.Information);
            })
            .AddSingleton(configuration);

        IChatClient openaiClient =
            new OpenAI.Chat.ChatClient(configuration["OpenAI:ModelId"] ?? "gpt-4o-mini", configuration["OpenAI:ApiKey"])
            .AsIChatClient();
        IChatClient client = new ChatClientBuilder(openaiClient)
            .UseFunctionInvocation()
            .Build();
        
        // Register BbQ.ChatWidgets services
        var serviceProvider = services
            .AddBbQChatWidgets(bbqOptions =>
            {
                bbqOptions.RoutePrefix = "/api/chat";
                bbqOptions.ChatClientFactory = sp => client;
            })
            // Register custom services
            .AddSingleton<ChatService>()
            .AddSingleton<ConversationManager>()
            .BuildServiceProvider();

        // Get logger
        var logger = serviceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Program");

        logger.LogInformation("=== BbQ.ChatWidgets Console Sample ===");
        logger.LogInformation("OpenAI Chat Application with Widget Support");
        logger.LogInformation("");

        try
        {
            // Get services
            var chatService = serviceProvider.GetRequiredService<ChatService>();
            var conversationManager = serviceProvider.GetRequiredService<ConversationManager>();

            logger.LogInformation("Chat application started. Type 'exit' to quit.");
            logger.LogInformation("");

            // Main chat loop
            await RunInteractiveChat(chatService, conversationManager, logger);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred");
            Environment.Exit(1);
        }

        /// <summary>
        /// Runs the interactive chat loop
        /// </summary>
        static async Task RunInteractiveChat(
            ChatService chatService,
            ConversationManager conversationManager,
            ILogger logger)
        {
            while (true)
            {
                Console.Write("\nYou: ");
                var userInput = Console.ReadLine();

                if (string.IsNullOrWhiteSpace(userInput))
                    continue;

                if (userInput.Equals("exit", StringComparison.OrdinalIgnoreCase))
                {
                    logger.LogInformation("Goodbye!");
                    break;
                }

                if (userInput.Equals("clear", StringComparison.OrdinalIgnoreCase))
                {
                    conversationManager.ClearHistory();
                    logger.LogInformation("Conversation history cleared.");
                    continue;
                }

                if (userInput.Equals("history", StringComparison.OrdinalIgnoreCase))
                {
                    conversationManager.PrintHistory();
                    continue;
                }

                try
                {
                    // Send message to chat service
                    logger.LogInformation("Assistant: Processing...");
                    var response = await chatService.SendMessageAsync(userInput);

                    // Display response
                    Console.WriteLine($"Assistant: {response.Content}");

                    // Display any widgets
                    if (response.Widgets?.Count > 0)
                    {
                        Console.WriteLine($"[{response.Widgets.Count} widget(s) available]");
                        for (int i = 0; i < response.Widgets.Count; i++)
                        {
                            var widget = response.Widgets[i];
                            Console.WriteLine($"  {i + 1}. {widget.Type}: {widget.Label}");
                        }
                    }

                    // Add to history
                    conversationManager.AddTurn(response);
                }
                catch (HttpRequestException ex)
                {
                    logger.LogError($"OpenAI API error: {ex.Message}");
                    Console.WriteLine("Error communicating with OpenAI API.");
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "An unexpected error occurred");
                    Console.WriteLine($"Error: {ex.Message}");
                }
            }
        }
    }
}

namespace BbQ.ChatWidgets.Sample
{
    /// <summary>
    /// Main chat service that handles communication with OpenAI and widget parsing
    /// </summary>
    public class ChatService
    {
        private readonly ChatWidgetService _widgetService;
        private readonly ConversationManager _conversationManager;
        private readonly ILogger _logger;
        private string? _currentThreadId;

        public ChatService(
            ChatWidgetService widgetService,
            ConversationManager conversationManager,
            ILoggerFactory loggerFactory)
        {
            _widgetService = widgetService;
            _conversationManager = conversationManager;
            _logger = loggerFactory.CreateLogger<ChatService>();
        }

        /// <summary>
        /// Sends a message to OpenAI and returns the response with parsed widgets
        /// </summary>
        public async Task<ChatTurn> SendMessageAsync(string userMessage)
        {
            // Initialize thread on first message
            _currentThreadId ??= Guid.NewGuid().ToString();

            // Add user message to local history
            _conversationManager.AddUserMessage(userMessage);

            // Call ChatWidgetService which handles:
            // - Providing widget tools to the AI model
            // - Parsing widget markers from the response
            // - Managing conversation threading
            _logger.LogDebug($"Sending message to OpenAI with widget support");
            var response = await _widgetService.RespondAsync(userMessage, _currentThreadId);

            return response;
        }
    }

    /// <summary>
    /// Manages multi-turn conversations and message history
    /// </summary>
    public class ConversationManager
    {
        private readonly List<ChatTurn> _turns = new();
        public string CurrentThreadId { get; } = Guid.NewGuid().ToString();

        /// <summary>
        /// Adds a user message to the conversation
        /// </summary>
        public void AddUserMessage(string message)
        {
            _turns.Add(new ChatTurn(
                Role: ChatRole.User,
                Content: message,
                Widgets: null,
                ThreadId: CurrentThreadId
            ));
        }

        /// <summary>
        /// Adds an assistant response to the conversation
        /// </summary>
        public void AddTurn(ChatTurn turn)
        {
            _turns.Add(turn);
        }

        /// <summary>
        /// Gets all messages in the current conversation as AI message format
        /// </summary>
        public IEnumerable<Microsoft.Extensions.AI.ChatMessage> GetMessages()
        {
            return _turns.Select(turn => new Microsoft.Extensions.AI.ChatMessage(turn.Role, turn.Content));
        }

        /// <summary>
        /// Clears the conversation history
        /// </summary>
        public void ClearHistory()
        {
            _turns.Clear();
        }

        /// <summary>
        /// Prints the conversation history to console
        /// </summary>
        public void PrintHistory()
        {
            if (_turns.Count == 0)
            {
                Console.WriteLine("No conversation history.");
                return;
            }

            Console.WriteLine("\n=== Conversation History ===");
            foreach (var turn in _turns)
            {
                var role = turn.Role == ChatRole.User ? "You" : "Assistant";
                Console.WriteLine($"\n{role}: {turn.Content}");
                if (turn.Widgets?.Count > 0)
                {
                    Console.WriteLine($"  [{turn.Widgets.Count} widget(s)]");
                }
            }
            Console.WriteLine("\n===========================\n");
        }
    }
}
