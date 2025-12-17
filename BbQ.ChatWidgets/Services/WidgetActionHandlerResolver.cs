using BbQ.ChatWidgets.Abstractions;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// Default implementation of <see cref="IWidgetActionHandlerResolver"/>.
/// </summary>
/// <remarks>
/// This resolver maintains a mapping from action names to handler types. When an action is triggered,
/// the resolver looks up the corresponding handler type and resolves an instance from the service provider.
/// 
/// The resolver:
/// - Stores action-to-handler type mappings
/// - Resolves handler instances from the service provider
/// - Handles resolution failures gracefully by returning null
/// </remarks>
public sealed class DefaultWidgetActionHandlerResolver : IWidgetActionHandlerResolver
{
    private readonly Dictionary<string, Type> _handlerMapping = [];

    /// <summary>
    /// Resolves a handler instance for a specific widget action.
    /// </summary>
    /// <remarks>
    /// This method:
    /// 1. Looks up the handler type for the action name
    /// 2. Uses the service provider to create an instance
    /// 3. Returns null if the action is not registered or resolution fails
    /// 
    /// Failures are handled gracefully, allowing the caller to handle missing handlers appropriately.
    /// </remarks>
    /// <param name="actionName">The name of the action.</param>
    /// <param name="serviceProvider">The dependency injection container for resolving the handler.</param>
    /// <returns>An instance of the handler, or null if not registered or resolution failed.</returns>
    public object? ResolveHandler(string actionName, IServiceProvider serviceProvider)
    {
        if (!_handlerMapping.TryGetValue(actionName, out var handlerType))
            return null;

        try
        {
            return serviceProvider.GetService(handlerType);
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Registers a handler type for a specific widget action.
    /// </summary>
    /// <remarks>
    /// Maps an action name to its corresponding handler type. The handler will be instantiated
    /// from the service provider when the action is triggered. Each action can have only one
    /// handler; subsequent registrations with the same action name will override the previous mapping.
    /// </remarks>
    /// <param name="actionName">The unique name of the action.</param>
    /// <param name="handlerType">The CLR type of the handler — typically implements <c>IActionWidgetActionHandler{TWidgetAction, T}</c>.</param>
    /// <exception cref="ArgumentException">Thrown if actionName is null, empty, or whitespace.</exception>
    /// <exception cref="ArgumentNullException">Thrown if handlerType is null.</exception>
    public void RegisterHandler(string actionName, Type handlerType)
    {
        if (string.IsNullOrWhiteSpace(actionName))
            throw new ArgumentException("Action name cannot be null or empty.", nameof(actionName));

        if (handlerType == null)
            throw new ArgumentNullException(nameof(handlerType));

        _handlerMapping[actionName] = handlerType;
    }
}

/// <summary>
/// Extension methods for registering typed action handlers.
/// </summary>
public static class WidgetActionHandlerExtensions
{
    extension(IWidgetActionRegistry registry)
    {
        /// <summary>
        /// Registers a typed action handler with both the action registry and handler resolver.
        /// </summary>
        /// <remarks>
        /// This extension method provides a convenient API for registering actions with their handlers in a type-safe manner.
        /// It:
        /// 1. Creates action metadata from the action instance
        /// 2. Registers the metadata with the action registry
        /// 3. Registers the handler type with the resolver
        ///
        /// Use this method when setting up custom widget actions:
        /// <code>
        /// registry.RegisterHandler&lt;MyAction, MyPayload, MyHandler&gt;(
        ///     resolver,
        ///     new MyAction("my_action", "Does something")
        /// );
        /// </code>
        /// </remarks>
        /// <typeparam name="TAction">The action type implementing <c>IWidgetAction{T}</c>.</typeparam>
        /// <typeparam name="TPayload">The payload type for this action.</typeparam>
        /// <typeparam name="THandler">The handler type implementing <c>IActionWidgetActionHandler{TWidgetAction, T}</c>.</typeparam>
        /// <param name="resolver">The handler resolver where the handler type will be registered.</param>
        public void RegisterHandler<TAction, TPayload, THandler>(
            IWidgetActionHandlerResolver resolver)
            where TAction : IWidgetAction<TPayload>, new()
            where THandler : IActionWidgetActionHandler<TAction, TPayload>
        {
            var action = new TAction();
            var metadata = new WidgetActionMetadata(
                action.Name,
                action.Description,
                action.PayloadSchema,
                typeof(TPayload)
            );

            registry.RegisterAction(metadata);
            resolver.RegisterHandler(action.Name, typeof(THandler));
        }
    }
}
