namespace BbQ.ChatWidgets.Agents.Abstractions;

/// <summary>
/// Registry for managing and routing to specialized agents.
/// </summary>
/// <remarks>
/// The agent registry maintains a collection of named agents that can be
/// invoked based on routing decisions from the triage agent or classifier.
/// This enables modular agent composition and dynamic agent selection.
/// </remarks>
public interface IAgentRegistry
{
    /// <summary>
    /// Registers an agent with a given name.
    /// </summary>
    /// <param name="name">The unique identifier for the agent.</param>
    /// <param name="agent">The agent instance to register.</param>
    void Register(string name, IAgent agent);

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
