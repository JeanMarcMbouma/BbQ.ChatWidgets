namespace BbQ.ChatWidgets.Agents;

using BbQ.ChatWidgets.Agents.Abstractions;

/// <summary>
/// Default implementation of the agent registry.
/// </summary>
/// <remarks>
/// This implementation uses a dictionary to store named agents for simple
/// lookup and retrieval. Agents are registered at startup or dynamically
/// during application lifecycle.
/// </remarks>
public sealed class AgentRegistry : IAgentRegistry
{
    private readonly Dictionary<string, IAgent> _agents = [];

    /// <summary>
    /// <inheritdoc />
    /// </summary>
    public void Register(string name, IAgent agent)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Agent name cannot be null or empty.", nameof(name));

        if (agent == null)
            throw new ArgumentNullException(nameof(agent));

        _agents[name] = agent;
    }


    /// <summary>
    /// <inheritdoc />
    /// </summary>
    public IAgent? GetAgent(string name)
    {
        _agents.TryGetValue(name, out var agent);
        return agent;
    }


    /// <summary>
    /// <inheritdoc />
    /// </summary>
    public IEnumerable<string> GetRegisteredAgents()
    {
        return _agents.Keys.AsEnumerable();
    }


    /// <summary>
    /// <inheritdoc />
    /// </summary>
    public bool HasAgent(string name)
    {
        return _agents.ContainsKey(name);
    }
}
