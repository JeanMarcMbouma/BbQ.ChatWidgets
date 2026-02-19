using BbQ.ChatWidgets.Agents.Abstractions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace BbQ.ChatWidgets.Agents;

/// <summary>
/// Extension methods for registering agents in the service collection.
/// </summary>
public static class AgentServiceCollectionExtensions
{
    /// <summary>
    /// Registers an agent type as a named keyed service in the dependency injection container.
    /// </summary>
    /// <typeparam name="TAgent">The agent implementation type.</typeparam>
    /// <param name="services">The service collection.</param>
    /// <param name="name">The unique name used to identify the agent in the registry.</param>
    /// <param name="lifetime">
    /// The service lifetime for the agent. Defaults to <see cref="ServiceLifetime.Scoped"/>.
    /// </param>
    /// <returns>The service collection for method chaining.</returns>
    /// <remarks>
    /// Agents registered with this method can be retrieved via <see cref="IAgentRegistry.GetAgent"/>
    /// and are resolved directly from the DI container, respecting the specified lifetime.
    /// 
    /// This method also ensures <see cref="IAgentRegistry"/> is registered (as scoped) if it has
    /// not already been added to the container.
    /// 
    /// Usage:
    /// <code>
    /// services.AddAgent&lt;HelpAgent&gt;("help-agent");
    /// services.AddAgent&lt;DataQueryAgent&gt;("data-query-agent", ServiceLifetime.Singleton);
    /// </code>
    /// </remarks>
    /// <exception cref="ArgumentException">Thrown when <paramref name="name"/> is null or whitespace.</exception>
    public static IServiceCollection AddAgent<TAgent>(
        this IServiceCollection services,
        string name,
        ServiceLifetime lifetime = ServiceLifetime.Scoped)
        where TAgent : class, IAgent
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);

        // Track the agent name for enumeration via IAgentRegistry.GetRegisteredAgents()
        services.Configure<AgentRegistryOptions>(opts => opts.RegisteredAgentNames.Add(name));

        // Register TAgent as a keyed IAgent service with the specified lifetime
        services.Add(new ServiceDescriptor(typeof(IAgent), name, typeof(TAgent), lifetime));

        // Ensure IAgentRegistry is available (only registered once)
        services.TryAddScoped<IAgentRegistry, AgentRegistry>();

        return services;
    }
}
