using BbQ.ChatWidgets.Abstractions;
using Microsoft.Extensions.AI;

/// <summary>
/// Configuration options for BbQ ChatWidgets.
/// </summary>
/// <remarks>
/// This class holds all configuration settings for the BbQ ChatWidgets library.
/// It's registered as a singleton and passed to the <see cref="ServiceCollectionExtensions.AddBbQChatWidgets"/>
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
    /// If not provided, no default chat client is registered, and <see cref="ChatWidgetService"/>
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
    /// Gets or sets the factory function for creating custom <see cref="IWidgetActionHandler"/> instances.
    /// </summary>
    /// <remarks>
    /// This factory allows providing a custom action handler for processing widget actions.
    /// If not provided, the default <see cref="DefaultWidgetActionHandler"/> is used.
    /// 
    /// The factory receives the <see cref="IServiceProvider"/> allowing access to dependencies
    /// needed by the action handler (database, external services, etc.).
    /// 
    /// Custom action handlers can:
    /// - Access application state and databases
    /// - Perform domain-specific operations
    /// - Call external APIs
    /// - Generate custom responses based on widget actions
    /// 
    /// Example:
    /// <code>
    /// options.ActionHandlerFactory = sp => new MyCustomActionHandler(
    ///     sp.GetRequiredService&lt;IDatabase&gt;(),
    ///     sp.GetRequiredService&lt;IExternalService&gt;()
    /// );
    /// </code>
    /// </remarks>
    public Func<IServiceProvider, IWidgetActionHandler>? ActionHandlerFactory { get; set; }
}