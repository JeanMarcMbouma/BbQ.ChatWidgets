namespace BbQ.ChatWidgets.Agents;

/// <summary>
/// Options for configuring the agent registry.
/// </summary>
/// <remarks>
/// Use <see cref="AgentServiceCollectionExtensions.AddAgent{TAgent}"/> to populate
/// these options by registering agents as keyed <see cref="Abstractions.IAgent"/> services.
/// </remarks>
public sealed class AgentRegistryOptions
{
    /// <summary>
    /// Gets the set of registered agent names.
    /// </summary>
    public HashSet<string> RegisteredAgentNames { get; } = [];
}
