using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.AI;
using BbQ.ChatWidgets.Extensions;
using BbQ.ChatWidgets.Sample;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Services;
using BbQ.ChatWidgets.Sample.Actions;
using BbQ.ChatWidgets.Abstractions;

/// <summary>
/// BbQ.ChatWidgets Console Sample Application
/// 
/// This sample demonstrates:
/// - Using OpenAI chat client with BbQ.ChatWidgets
/// - Storing secrets securely using User Secrets
/// - Multi-turn conversation management
/// - Interactive widget handling
/// - Typed action handlers with IWidgetAction<T>
/// </summary>

internal class Program
{
    /// <summary>
    /// Main entry point for the BbQ.ChatWidgets Console Sample Application.
    /// </summary>
    /// <remarks>
    /// This method:
    /// 1. Builds the application configuration using User Secrets
    /// 2. Sets up the dependency injection container with logging
    /// 3. Creates and configures an OpenAI chat client
    /// 4. Registers BbQ.ChatWidgets services and custom services
    /// 5. Registers typed action handlers
    /// 6. Runs the interactive chat loop
    /// 
    /// The application demonstrates:
    /// - Using OpenAI chat client with BbQ.ChatWidgets
    /// - Storing secrets securely using User Secrets
    /// - Multi-turn conversation management
    /// - Interactive widget handling
    /// - Typed action handlers with IWidgetAction<T>
    /// </remarks>
    /// <param name="args">Command-line arguments (currently unused).</param>
    /// <returns>A task that represents the asynchronous main operation.</returns>
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
            // Register typed action handlers
            .AddScoped<GreetingHandler>()
            .AddScoped<FeedbackHandler>()
            .BuildServiceProvider();

        // Get logger
        var logger = serviceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Program");

        logger.LogInformation("=== BbQ.ChatWidgets Console Sample ===");
        logger.LogInformation("OpenAI Chat Application with Widget Support");
        logger.LogInformation("");

        try
        {
            // Register typed actions with the registry
            var actionRegistry = serviceProvider.GetRequiredService<IWidgetActionRegistry>();
            var handlerResolver = serviceProvider.GetRequiredService<IWidgetActionHandlerResolver>();

            // Register greeting action
            var greetingAction = new GreetingAction();
            actionRegistry.RegisterHandler<GreetingAction, GreetingPayload, GreetingHandler>(handlerResolver, greetingAction);

            // Register feedback action
            var feedbackAction = new FeedbackAction();
            actionRegistry.RegisterHandler<FeedbackAction, FeedbackPayload, FeedbackHandler>(handlerResolver, feedbackAction);

            logger.LogInformation("Registered typed action handlers:");
            logger.LogInformation($"  - {greetingAction.Name}: {greetingAction.Description}");
            logger.LogInformation($"  - {feedbackAction.Name}: {feedbackAction.Description}");
            logger.LogInformation("");

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
        /// Runs the interactive chat loop for the console application.
        /// </summary>
        /// <remarks>
        /// This method manages the main conversation loop, allowing users to:
        /// - Send messages and receive AI responses with interactive widgets
        /// - View conversation history with the "history" command
        /// - Clear the conversation with the "clear" command
        /// - Exit the application with the "exit" command
        /// 
        /// The method continuously prompts for user input and displays:
        /// - AI responses with formatted text
        /// - Available widgets in the response
        /// - Error messages if communication with OpenAI fails
        /// </remarks>
        /// <param name="chatService">The chat service for processing user messages.</param>
        /// <param name="conversationManager">The conversation manager for maintaining history.</param>
        /// <param name="logger">The logger for logging operations and errors.</param>
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
    /// Service for handling chat interactions with AI integration.
    /// </summary>
    /// <remarks>
    /// This service acts as a bridge between the console application and the ChatWidgetService,
    /// managing the current conversation thread and delegating message processing to the
    /// ChatWidgetService for AI response generation with widget support.
    /// </remarks>
    public class ChatService
    {
        private readonly ChatWidgetService _widgetService;
        private readonly ConversationManager _conversationManager;
        private readonly ILogger _logger;
        private string? _currentThreadId;

        /// <summary>
        /// Initializes a new instance of the <see cref="ChatService"/> class.
        /// </summary>
        /// <param name="widgetService">The chat widget service for processing messages.</param>
        /// <param name="conversationManager">The conversation manager for maintaining message history.</param>
        /// <param name="loggerFactory">The logger factory for creating a logger instance.</param>
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
        /// Sends a message to the AI and returns the response with parsed widgets.
        /// </summary>
        /// <remarks>
        /// This method:
        /// 1. Initializes a conversation thread on the first call
        /// 2. Adds the user message to local history
        /// 3. Calls ChatWidgetService to process the message and get AI response
        /// 4. Returns the response which may contain embedded widgets
        /// 
        /// The ChatWidgetService handles:
        /// - Providing widget tools to the AI model
        /// - Parsing widget markers from the response
        /// - Managing conversation threading
        /// </remarks>
        /// <param name="userMessage">The user's message to send to the AI.</param>
        /// <returns>
        /// A task that completes with a <see cref="ChatTurn"/> containing the AI response
        /// and any parsed widgets.
        /// </returns>
        /// <exception cref="HttpRequestException">
        /// Thrown if the request to the OpenAI API fails.
        /// </exception>
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
    /// Manages multi-turn conversations and message history.
    /// </summary>
    /// <remarks>
    /// This class maintains a thread-safe collection of conversation turns (messages and responses)
    /// and provides methods for adding turns, clearing history, and retrieving messages in various formats.
    /// </remarks>
    public class ConversationManager
    {
        private readonly List<ChatTurn> _turns = [];

        /// <summary>
        /// Gets the unique identifier for the current conversation thread.
        /// </summary>
        public string CurrentThreadId { get; } = Guid.NewGuid().ToString();

        /// <summary>
        /// Adds a user message to the conversation.
        /// </summary>
        /// <remarks>
        /// Creates a new ChatTurn with the user's message and adds it to the conversation history.
        /// </remarks>
        /// <param name="message">The user's message text.</param>
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
        /// Adds an assistant response (turn) to the conversation.
        /// </summary>
        /// <remarks>
        /// Appends a ChatTurn (typically containing an assistant response and optional widgets)
        /// to the conversation history.
        /// </remarks>
        /// <param name="turn">The chat turn to add to the conversation.</param>
        public void AddTurn(ChatTurn turn)
        {
            _turns.Add(turn);
        }

        /// <summary>
        /// Gets all messages in the current conversation as AI message format.
        /// </summary>
        /// <remarks>
        /// Converts all conversation turns to the Microsoft.Extensions.AI.ChatMessage format,
        /// suitable for passing to the chat client.
        /// </remarks>
        /// <returns>
        /// An enumerable of <see cref="Microsoft.Extensions.AI.ChatMessage"/> representing
        /// all conversation turns.
        /// </returns>
        public IEnumerable<Microsoft.Extensions.AI.ChatMessage> GetMessages()
        {
            return _turns.Select(turn => new Microsoft.Extensions.AI.ChatMessage(turn.Role, turn.Content));
        }

        /// <summary>
        /// Clears the conversation history.
        /// </summary>
        /// <remarks>
        /// Removes all stored conversation turns, resetting the conversation to empty state.
        /// Note: The <see cref="CurrentThreadId"/> remains the same.
        /// </remarks>
        public void ClearHistory()
        {
            _turns.Clear();
        }

        /// <summary>
        /// Prints the conversation history to the console.
        /// </summary>
        /// <remarks>
        /// Displays the complete conversation history in a formatted manner, showing each turn
        /// with the speaker role and content, plus any widgets associated with each turn.
        /// Does nothing if no turns exist in the history.
        /// </remarks>
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
