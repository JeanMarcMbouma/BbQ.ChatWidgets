namespace BbQ.ChatWidgets.Abstractions;

/// <summary>
/// Handler registry for managing action handler resolution.
/// </summary>
/// <remarks>
/// This service resolves the appropriate handler for a given action based on
/// registered handler types in the dependency injection container.
/// </remarks>
public interface IWidgetActionHandlerResolver
{
    /// <summary>
    /// Resolves a handler for the specified action name.
    /// </summary>
    /// <param name="actionName">The action name to resolve.</param>
    /// <param name="serviceProvider">The service provider for DI.</param>
    /// <returns>The handler, or null if no handler is registered.</returns>
    object? ResolveHandler(string actionName, IServiceProvider serviceProvider);

    /// <summary>
    /// Registers a handler type for an action.
    /// </summary>
    /// <param name="actionName">The action name.</param>
    /// <param name="handlerType">The handler type.</param>
    void RegisterHandler(string actionName, Type handlerType);
}
