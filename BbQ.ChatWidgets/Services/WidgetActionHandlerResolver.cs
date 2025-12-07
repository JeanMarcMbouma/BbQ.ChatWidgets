using BbQ.ChatWidgets.Abstractions;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// Default implementation of <see cref="IWidgetActionHandlerResolver"/>.
/// </summary>
internal class DefaultWidgetActionHandlerResolver : IWidgetActionHandlerResolver
{
    private readonly Dictionary<string, Type> _handlerMapping = [];

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
        /// Registers a typed action handler in the registry.
        /// </summary>
        /// <typeparam name="TAction">The action type implementing <see cref="IWidgetAction{T}"/>.</typeparam>
        /// <typeparam name="TPayload">The payload type.</typeparam>
        /// <typeparam name="THandler">The handler type implementing <see cref="IActionWidgetActionHandler{TWidgetAction, T}"/>.</typeparam>
        /// <param name="registry">The action registry.</param>
        /// <param name="resolver">The handler resolver.</param>
        /// <param name="action">An instance of the action to extract metadata.</param>
        public void RegisterHandler<TAction, TPayload, THandler>(
            IWidgetActionHandlerResolver resolver,
            TAction action)
            where TAction : IWidgetAction<TPayload>
            where THandler : IActionWidgetActionHandler<TAction, TPayload>
        {
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
