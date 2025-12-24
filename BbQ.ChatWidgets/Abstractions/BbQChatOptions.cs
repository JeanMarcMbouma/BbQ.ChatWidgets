using BbQ.ChatWidgets.Abstractions;
using Microsoft.Extensions.AI;

/// <summary>
/// Configuration options for BbQ ChatWidgets.
/// </summary>
/// <remarks>
/// This class holds all configuration settings for the BbQ ChatWidgets library.
/// It's registered as a singleton and passed to the <see cref="BbQ.ChatWidgets.Extensions.ServiceCollectionExtensions.AddBbQChatWidgets"/>
/// extension method via an optional configuration action.
/// </remarks>
public sealed class BbQChatOptions
{
    /// <summary>
    /// Gets or sets the route prefix for chat widget API endpoints.
    /// </summary>
    /// <remarks>
    /// The route prefix is prepended to all chat widget endpoints.
    /// Default: "/api/chat"
    /// 
    /// This creates the following endpoints:
    /// - POST {RoutePrefix}/message: Send user messages
    /// - POST {RoutePrefix}/action: Handle widget actions
    /// 
    /// Example: Setting to "/api/v2/chat" creates endpoints:
    /// - POST /api/v2/chat/message
    /// - POST /api/v2/chat/action
    /// </remarks>
    public string? RoutePrefix { get; set; } = "/api/chat";

    /// <summary>
    /// Gets or sets the factory function for creating <see cref="IChatClient"/> instances.
    /// </summary>
    /// <remarks>
    /// This factory is called to create the chat client used for generating AI responses.
    /// If not provided, no default chat client is registered, and <see cref="BbQ.ChatWidgets.Services.ChatWidgetService"/>
    /// will fail if <see cref="IChatClient"/> is not otherwise available.
    /// 
    /// The factory receives the <see cref="IServiceProvider"/> allowing access to other
    /// registered services during chat client creation.
    /// 
    /// Example:
    /// <code>
    /// options.ChatClientFactory = sp => new OllamaChatClient(
    ///     new Uri("http://localhost:11434"),
    ///     "neural-chat:7b",
    ///     null
    /// );
    /// </code>
    /// </remarks>
    public Func<IServiceProvider, IChatClient>? ChatClientFactory { get; set; }

    /// <summary>
    /// Gets or sets the factory function for creating custom tool providers.
    /// </summary>
    /// <remarks>
    /// This factory allows providing a custom provider for AI tools that extend the chat widget functionality.
    /// If not provided, no additional AI tools beyond the standard widget tools are registered.
    /// 
    /// The factory receives the <see cref="IServiceProvider"/> allowing access to dependencies
    /// needed by the tool provider (databases, external services, configuration, etc.).
    /// 
    /// Custom tool providers can:
    /// - Register additional AI-callable tools
    /// - Integrate with domain-specific functionality
    /// - Access application state and services
    /// - Extend the AI assistant's capabilities
    /// 
    /// Example:
    /// <code>
    /// options.ToolProviderFactory = sp => new MyCustomToolProvider(
    ///     sp.GetRequiredService&lt;IDatabase&gt;(),
    ///     sp.GetRequiredService&lt;IConfiguration&gt;()
    /// );
    /// </code>
    /// </remarks>
    public Func<IServiceProvider, IAIToolsProvider>? ToolProviderFactory { get; set; }

    /// <summary>
    /// Gets or sets the factory function for creating custom AI instruction providers.
    /// </summary>
    /// <remarks>
    /// This factory allows providing custom system instructions or prompts for the AI model.
    /// If not provided, the AI assistant uses only the default widget-related instructions.
    /// 
    /// The factory receives the <see cref="IServiceProvider"/> allowing access to dependencies
    /// needed by the instruction provider (configuration, domain logic, etc.).
    /// 
    /// Custom instruction providers can:
    /// - Supply domain-specific system prompts
    /// - Customize AI behavior and tone
    /// - Add context-specific instructions
    /// - Integrate domain knowledge into the AI responses
    /// 
    /// Example:
    /// <code>
    /// options.AIInstructionProviderFactory = sp => new MyCustomInstructionProvider(
    ///     sp.GetRequiredService&lt;IConfiguration&gt;(),
    ///     sp.GetRequiredService&lt;IDomainService&gt;()
    /// );
    /// </code>
    /// </remarks>
    public Func<IServiceProvider, IAIInstructionProvider>? AIInstructionProviderFactory { get; set; }

    /// <summary>
    /// Gets or sets the factory function for creating custom widget tools providers.
    /// </summary>
    /// <remarks>
    /// This factory allows providing a custom provider for widget-specific AI tools.
    /// If not provided, the default widget tools (button, card, input, dropdown, slider, toggle, file upload)
    /// are automatically registered.
    /// 
    /// The factory receives the <see cref="IServiceProvider"/> allowing access to dependencies
    /// needed by the widget tools provider.
    /// 
    /// Custom widget tools providers can:
    /// - Override or extend the default widget tool definitions
    /// - Add validation or constraint logic for widget parameters
    /// - Customize the JSON schemas for widget tools
    /// - Register additional widget types beyond the standard set
    /// 
    /// Example:
    /// <code>
    /// options.WidgetToolsProviderFactory = sp => new MyCustomWidgetToolsProvider(
    ///     sp.GetRequiredService&lt;ILogger&lt;MyCustomWidgetToolsProvider&gt;&gt;()
    /// );
    /// </code>
    /// </remarks>
    public Func<IServiceProvider, IWidgetToolsProvider>? WidgetToolsProviderFactory { get; set; }


    /// <summary>
    /// Configures the widget registry for the chat options.
    /// </summary>
    /// <remarks>
    /// This action allows customizing the widget registry during the chat options configuration.
    /// </remarks>
    public Action<IWidgetRegistry>? WidgetRegistryConfigurator { get; set; }

    /// <summary>
    /// Configures the widget action registry for the chat options.
    /// </summary>
    /// <remarks>
    /// This action allows customizing the widget action registry during the chat options configuration.
    /// </remarks>
    public Action<IServiceProvider, IWidgetActionRegistry, IWidgetActionHandlerResolver>? WidgetActionRegistryFactory { get; set; }

    /// <summary>
    /// Gets or sets whether automatic chat history summarization is enabled.
    /// </summary>
    /// <remarks>
    /// When enabled, the system will automatically generate summaries of older
    /// conversation turns when the context window size is exceeded.
    /// Default: true
    /// 
    /// Summarization helps maintain relevant context while staying within
    /// token budget constraints for the AI model.
    /// </remarks>
    public bool EnableAutoSummarization { get; set; } = true;

    /// <summary>
    /// Gets or sets the threshold for triggering automatic summarization.
    /// </summary>
    /// <remarks>
    /// When the number of conversation turns exceeds this threshold,
    /// older turns will be summarized to reduce context size.
    /// Default: 15 turns
    /// 
    /// The system will keep the most recent turns and summarize older ones.
    /// This threshold should be set higher than the number of recent turns
    /// you want to keep in full detail.
    /// </remarks>
    public int SummarizationThreshold { get; set; } = 15;

    /// <summary>
    /// Gets or sets the number of recent turns to keep unsummarized.
    /// </summary>
    /// <remarks>
    /// The most recent N turns will always be sent in full to the AI,
    /// while older turns may be summarized.
    /// Default: 10 turns
    /// 
    /// This ensures the AI has immediate context from the recent conversation
    /// while older context is condensed into summaries.
    /// </remarks>
    public int RecentTurnsToKeep { get; set; } = 10;

    /// <summary>
    /// Validates the summarization configuration settings.
    /// </summary>
    /// <remarks>
    /// This method should be called after configuration to ensure that:
    /// - SummarizationThreshold is greater than RecentTurnsToKeep
    /// - Both values are positive
    /// 
    /// Invalid configuration can lead to incorrect summarization behavior.
    /// </remarks>
    /// <exception cref="InvalidOperationException">
    /// Thrown when the configuration is invalid.
    /// </exception>
    public void ValidateSummarizationSettings()
    {
        if (EnableAutoSummarization)
        {
            if (SummarizationThreshold <= 0)
            {
                throw new InvalidOperationException($"SummarizationThreshold must be positive. Current value: {SummarizationThreshold}");
            }

            if (RecentTurnsToKeep <= 0)
            {
                throw new InvalidOperationException($"RecentTurnsToKeep must be positive. Current value: {RecentTurnsToKeep}");
            }

            if (SummarizationThreshold <= RecentTurnsToKeep)
            {
                throw new InvalidOperationException(
                    $"SummarizationThreshold ({SummarizationThreshold}) must be greater than RecentTurnsToKeep ({RecentTurnsToKeep}). " +
                    "Otherwise, there would be no turns to summarize.");
            }
        }
    }
}