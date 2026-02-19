namespace BbQ.ChatWidgets.Agents;

using BbQ.ChatWidgets.Agents.Abstractions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

/// <summary>
/// Default implementation of the agent registry backed by the dependency injection container.
/// </summary>
/// <remarks>
/// Agents are registered as keyed <see cref="IAgent"/> services via the
/// <see cref="AgentServiceCollectionExtensions.AddAgent{TAgent}"/> extension method.
/// This implementation resolves agents on demand from the DI container, fully
/// supporting all service lifetimes (singleton, scoped, transient) without requiring
/// manual instance management.
/// </remarks>
public sealed class AgentRegistry : IAgentRegistry
{
    private readonly IServiceProvider _serviceProvider;
    private readonly AgentRegistryOptions _options;

    /// <summary>
    /// Initializes a new instance of <see cref="AgentRegistry"/>.
    /// </summary>
    /// <param name="serviceProvider">The service provider used to resolve keyed agents.</param>
    /// <param name="options">The options containing registered agent names.</param>
    public AgentRegistry(IServiceProvider serviceProvider, IOptions<AgentRegistryOptions> options)
    {
        _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
    }

    /// <summary>
    /// <inheritdoc />
    /// </summary>
    public IAgent? GetAgent(string name) => _serviceProvider.GetKeyedService<IAgent>(name);

    /// <summary>
    /// <inheritdoc />
    /// </summary>
    public IEnumerable<string> GetRegisteredAgents() => _options.RegisteredAgentNames;

    /// <summary>
    /// <inheritdoc />
    /// </summary>
    public bool HasAgent(string name) => _options.RegisteredAgentNames.Contains(name);
}
