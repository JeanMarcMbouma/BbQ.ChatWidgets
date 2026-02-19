namespace BbQ.ChatWidgets.Agents.Abstractions;

/// <summary>
/// Registry for managing and routing to specialized agents.
/// </summary>
/// <remarks>
/// The agent registry resolves named agents from the dependency injection container.
/// Agents are registered by type using <see cref="AgentServiceCollectionExtensions.AddAgent{TAgent}"/>,
/// which stores them as keyed <see cref="IAgent"/> services. This enables modular agent
/// composition, DI-managed lifetimes, and dynamic agent selection without requiring
/// manual instance management.
/// </remarks>
public interface IAgentRegistry
{
    /// <summary>
    /// Retrieves an agent by name.
    /// </summary>
    /// <param name="name">The agent name to retrieve.</param>
    /// <returns>The agent instance, or null if not found.</returns>
    IAgent? GetAgent(string name);

    /// <summary>
    /// Gets all registered agent names.
    /// </summary>
    /// <returns>A collection of registered agent names.</returns>
    IEnumerable<string> GetRegisteredAgents();

    /// <summary>
    /// Checks if an agent is registered.
    /// </summary>
    /// <param name="name">The agent name to check.</param>
    /// <returns>True if the agent is registered; otherwise, false.</returns>
    bool HasAgent(string name);
}
