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

    /// <summary>
    /// Registers a <see cref="MultiTurnAgentOrchestrator"/> as a <strong>named keyed agent</strong>
    /// so that a <see cref="TriageAgent{TCategory}"/> (or any other routing agent) can delegate to it
    /// by name.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="name">
    /// The unique name used to look up this orchestrator via <see cref="IAgentRegistry.GetAgent"/>.
    /// </param>
    /// <param name="pipeline">
    /// Ordered sequence of <c>(agentName, options)</c> pairs.  Each agent must already be
    /// registered via <see cref="AddAgent{TAgent}"/>.
    /// </param>
    /// <param name="orchestratorOptions">
    /// Optional global max-rounds configuration.  Defaults to
    /// <see cref="MultiTurnAgentOrchestratorOptions"/> defaults if <c>null</c>.
    /// </param>
    /// <returns>The service collection for method chaining.</returns>
    /// <example>
    /// <code>
    /// // Register individual step agents
    /// services.AddAgent&lt;ResearchAgent&gt;("researcher");
    /// services.AddAgent&lt;AnalystAgent&gt;("analyst");
    ///
    /// // Register the pipeline as a named agent the triage can route to
    /// services.AddMultiTurnAgentOrchestrator(
    ///     "data-pipeline",
    ///     pipeline: [
    ///         ("researcher", new AgentConversationOptions { Persona = "You are a research analyst." }),
    ///         ("analyst",    new AgentConversationOptions { Persona = "You are a data analyst." })
    ///     ]
    /// );
    ///
    /// // Route DataQuery intent to the multi-turn pipeline
    /// Func&lt;UserIntent, string?&gt; routing = intent => intent switch {
    ///     UserIntent.DataQuery => "data-pipeline",
    ///     _                    => "help-agent"
    /// };
    /// </code>
    /// </example>
    public static IServiceCollection AddMultiTurnAgentOrchestrator(
        this IServiceCollection services,
        string name,
        IEnumerable<(string AgentName, AgentConversationOptions Options)> pipeline,
        MultiTurnAgentOrchestratorOptions? orchestratorOptions = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentNullException.ThrowIfNull(pipeline);

        // Track the agent name for enumeration via IAgentRegistry.GetRegisteredAgents()
        services.Configure<AgentRegistryOptions>(opts => opts.RegisteredAgentNames.Add(name));

        // Ensure IAgentRegistry is available
        services.TryAddScoped<IAgentRegistry, AgentRegistry>();

        var frozenPipeline = pipeline.ToList();

        // Register as a keyed scoped service so IAgentRegistry can resolve it by name
        services.AddKeyedScoped<IAgent>(name, (sp, _) =>
        {
            var registry = sp.GetRequiredService<IAgentRegistry>();
            var dispatcher = sp.GetService<IAgentEventDispatcher>();
            return new MultiTurnAgentOrchestrator(registry, frozenPipeline, orchestratorOptions, dispatcher);
        });

        return services;
    }

    /// <summary>
    /// Registers a <see cref="MultiTurnAgentOrchestrator"/> as the primary <see cref="IAgent"/>
    /// (scoped) that will be resolved by the <c>/api/chat/agent</c> endpoint.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="pipeline">
    /// Ordered sequence of <c>(agentName, options)</c> pairs.  Agents are queried in order;
    /// each must have been registered via <see cref="AddAgent{TAgent}"/>.
    /// </param>
    /// <param name="orchestratorOptions">
    /// Optional global max-rounds configuration.  Pass <c>null</c> to use defaults
    /// (<see cref="MultiTurnAgentOrchestratorOptions"/>).
    /// </param>
    /// <returns>The service collection for method chaining.</returns>
    /// <example>
    /// <code>
    /// services.AddAgent&lt;ResearchAgent&gt;("research");
    /// services.AddAgent&lt;SummaryAgent&gt;("summary");
    ///
    /// services.AddMultiTurnAgentOrchestrator(
    ///     pipeline: [
    ///         ("research", new AgentConversationOptions { Persona = "You are a research assistant." }),
    ///         ("summary",  new AgentConversationOptions { Persona = "You are a concise summariser." })
    ///     ],
    ///     orchestratorOptions: new MultiTurnAgentOrchestratorOptions { MaxRoundsPerAgent = 3, MaxTotalRounds = 10 }
    /// );
    /// </code>
    /// </example>
    public static IServiceCollection AddMultiTurnAgentOrchestrator(
        this IServiceCollection services,
        IEnumerable<(string AgentName, AgentConversationOptions Options)> pipeline,
        MultiTurnAgentOrchestratorOptions? orchestratorOptions = null)
    {
        ArgumentNullException.ThrowIfNull(pipeline);

        // Ensure IAgentRegistry is available
        services.TryAddScoped<IAgentRegistry, AgentRegistry>();

        var frozenPipeline = pipeline.ToList();
        services.AddScoped<IAgent>(sp =>
        {
            var registry = sp.GetRequiredService<IAgentRegistry>();
            var dispatcher = sp.GetService<IAgentEventDispatcher>();
            return new MultiTurnAgentOrchestrator(registry, frozenPipeline, orchestratorOptions, dispatcher);
        });

        return services;
    }
}
