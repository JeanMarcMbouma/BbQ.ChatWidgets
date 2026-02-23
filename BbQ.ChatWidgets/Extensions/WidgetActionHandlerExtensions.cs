using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Options;
using BbQ.ChatWidgets.Services;
using Microsoft.Extensions.DependencyInjection;

namespace BbQ.ChatWidgets.Extensions;

/// <summary>
/// Extension methods for registering typed action handlers.
/// </summary>
public static partial class WidgetActionHandlerExtensions
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

    extension(IServiceCollection services)
    {
        /// <summary>
        /// Registers a widget action handler and its associated action metadata
        /// into the service collection and the <see cref="ActionHandlerOptions"/> registry.
        /// </summary>
        /// <typeparam name="TAction">
        /// The concrete action type implementing <see cref="IWidgetAction{TPayload}"/>.
        /// A new instance is created to extract name, description, and payload schema.
        /// </typeparam>
        /// <typeparam name="TPayload">
        /// The payload type associated with the action. This type is recorded in the
        /// generated <see cref="WidgetActionMetadata"/>.
        /// </typeparam>
        /// <typeparam name="THandler">
        /// The handler type implementing <see cref="IActionWidgetActionHandler{TAction, TPayload}"/>.
        /// This type is registered in DI and linked to the action during metadata registration.
        /// </typeparam>
        /// <param name="lifetime">
        /// The service lifetime to use when registering <typeparamref name="THandler"/>.
        /// Defaults to <see cref="ServiceLifetime.Scoped"/>.
        /// </param>
        /// <returns>
        /// The same <see cref="IServiceCollection"/> instance, enabling fluent configuration.
        /// </returns>
        public IServiceCollection AddWidgetActionHandler<TAction, TPayload, THandler>(ServiceLifetime lifetime = ServiceLifetime.Scoped)
            where TAction : IWidgetAction<TPayload>, new()
            where THandler : IActionWidgetActionHandler<TAction, TPayload>
        {
            services.Add(new ServiceDescriptor(typeof(THandler), typeof(THandler), lifetime));
            services.Configure<ActionHandlerOptions>(options => options.Handlers.Add((s, registry) =>
            {
                var action = new TAction();
                var metadata = new WidgetActionMetadata(
                    action.Name,
                    action.Description,
                    action.PayloadSchema,
                    typeof(TPayload)
                );
                registry.RegisterAction(metadata);
                return new ActionRegistrationMetadata(action.Name, typeof(THandler));
            }
            ));
            return services; 
        }

    }
}
