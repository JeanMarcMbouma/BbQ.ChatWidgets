using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Services;

namespace BbQ.ChatWidgets.Extensions;

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
