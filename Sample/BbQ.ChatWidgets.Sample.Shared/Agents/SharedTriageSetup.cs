using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Agents;
using BbQ.ChatWidgets.Agents.Abstractions;
using Microsoft.Extensions.DependencyInjection;

namespace BbQ.ChatWidgets.Sample.Shared.Agents;

/// <summary>
/// Triage agent system setup for shared sample functionality.
/// Enables automatic intent classification and agent routing for all samples.
/// </summary>
public static class SharedTriageSetup
{
    /// <summary>
    /// Adds the triage agent system to the DI container with specialized agents.
    /// </summary>
    /// <remarks>
    /// This extension method registers:
    /// - UserIntentClassifier for AI-based classification
    /// - AgentRegistry with 4 specialized agents
    /// - TriageAgent<UserIntent> for routing
    /// 
    /// Usage:
    /// <code>
    /// services.AddSharedTriageAgents();
    /// </code>
    /// </remarks>
    public static IServiceCollection AddSharedTriageAgents(this IServiceCollection services)
    {
        // Register classifier
        services.AddScoped<IClassifier<UserIntent>, UserIntentClassifier>();

        // Register agent registry and populate with agents
        services.AddSingleton<IAgentRegistry>(sp =>
        {
            var registry = new AgentRegistry();
            
            // Register specialized agents
            registry.Register("help-agent", new HelpAgent());
            registry.Register("data-query-agent", new DataQueryAgent());
            registry.Register("action-agent", new ActionAgent());
            registry.Register("feedback-agent", new FeedbackAgent());
            
            return registry;
        });

        // Register triage agent with routing mapping
        services.AddScoped(sp =>
        {
            var classifier = sp.GetRequiredService<IClassifier<UserIntent>>();
            var registry = sp.GetRequiredService<IAgentRegistry>();
            var threadService = sp.GetService<IThreadService>();

            // Define routing mapping from classification to agent name
            Func<UserIntent, string?> routingMapping = classification => classification switch
            {
                UserIntent.HelpRequest => "help-agent",
                UserIntent.DataQuery => "data-query-agent",
                UserIntent.ActionRequest => "action-agent",
                UserIntent.Feedback => "feedback-agent",
                UserIntent.Unknown => null,  // Use fallback
                _ => null
            };

            return new TriageAgent<UserIntent>(
                classifier,
                registry,
                routingMapping,
                fallbackAgentName: "help-agent",
                threadService: threadService
            ) as IAgent;
        });

        return services;
    }
}
