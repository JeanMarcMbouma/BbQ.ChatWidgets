using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Agents.Abstractions;
using BbQ.Outcome;

namespace BbQ.ChatWidgets.Agents;

/// <summary>
/// Triage agent that classifies requests and routes to appropriate handlers.
/// </summary>
/// <remarks>
/// The triage agent acts as a router in the agent pipeline. It:
/// 1. Classifies incoming requests using an IClassifier
/// 2. Routes to specialized agents based on classification
/// 3. Ensures agent-to-agent communication through shared context
/// 4. Provides fallback handling for unclassified requests
/// 
/// The triage agent maintains the request in metadata for agent-to-agent interaction,
/// allowing subsequent agents to access classification results and routing context.
/// </remarks>
/// <typeparam name="TCategory">The enum type for request categories.</typeparam>
public sealed class TriageAgent<TCategory> : IAgent
    where TCategory : Enum
{
    private readonly IClassifier<TCategory> _classifier;
    private readonly IAgentRegistry _agentRegistry;
    private readonly Func<TCategory, string?> _routingMapping;
    private readonly string? _fallbackAgentName;
    private readonly IAgent? _fallbackAgent;

    /// <summary>
    /// Initializes a new instance of the TriageAgent.
    /// </summary>
    /// <param name="classifier">The classifier for categorizing requests.</param>
    /// <param name="agentRegistry">Registry containing specialized agents.</param>
    /// <param name="routingMapping">Function to map category to agent name.</param>
    /// <param name="fallbackAgentName">Optional name of the fallback agent if routing fails.</param>
    /// <param name="fallbackAgent">Optional fallback agent if routing fails.</param>
    public TriageAgent(
        IClassifier<TCategory> classifier,
        IAgentRegistry agentRegistry,
        Func<TCategory, string?> routingMapping,
        string? fallbackAgentName = null,
        IAgent? fallbackAgent = null)
    {
        _classifier = classifier ?? throw new ArgumentNullException(nameof(classifier));
        _agentRegistry = agentRegistry ?? throw new ArgumentNullException(nameof(agentRegistry));
        _routingMapping = routingMapping ?? throw new ArgumentNullException(nameof(routingMapping));
        _fallbackAgentName = fallbackAgentName;
        _fallbackAgent = fallbackAgent;
    }

    public async Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken cancellationToken)
    {
        try
        {
            // Extract user message from metadata or request context
            var userMessage = InterAgentCommunicationContext.GetUserMessage(request);
            if (string.IsNullOrWhiteSpace(userMessage))
            {
                return Outcome<ChatTurn>.FromError("NoMessage", "No user message found in request context");
            }

            // Classify the request
            var category = await _classifier.ClassifyAsync(userMessage, cancellationToken);

            // Store classification result in metadata for agent-to-agent communication
            InterAgentCommunicationContext.SetClassification(request, category);
            InterAgentCommunicationContext.SetUserMessage(request, userMessage);

            // Route to appropriate agent
            var agentName = _routingMapping(category);
            var targetAgent = GetTargetAgent(agentName);

            if (targetAgent == null)
            {
                return Outcome<ChatTurn>.FromError("NoAgent", $"No agent found for routing key: {agentName}");
            }

            // Store routing information for diagnostics
            InterAgentCommunicationContext.SetRoutedAgent(request, agentName ?? "unknown");

            // Invoke the routed agent
            return await targetAgent.InvokeAsync(request, cancellationToken);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            return Outcome<ChatTurn>.FromError("TriageFailed", $"Triage routing failed: {ex.Message}");
        }
    }

    private IAgent? GetTargetAgent(string? agentName)
    {
        if (!string.IsNullOrEmpty(agentName))
        {
            var agent = _agentRegistry.GetAgent(agentName);
            if (agent != null)
                return agent;
        }

        // Use fallback agent if available
        if (!string.IsNullOrEmpty(_fallbackAgentName))
        {
            return _agentRegistry.GetAgent(_fallbackAgentName);
        }

        return _fallbackAgent;
    }
}
