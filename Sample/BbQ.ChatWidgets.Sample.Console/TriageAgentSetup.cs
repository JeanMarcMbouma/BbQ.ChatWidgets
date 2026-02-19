using BbQ.ChatWidgets.Agents;
using BbQ.ChatWidgets.Agents.Abstractions;
using BbQ.ChatWidgets.Sample.Agents;
using Microsoft.Extensions.DependencyInjection;

namespace BbQ.ChatWidgets.Sample;

/// <summary>
/// Extension methods for setting up the triage agent system.
/// </summary>
/// <remarks>
/// These extensions simplify the configuration and registration of the triage agent
/// system with specialized routing agents and a classifier.
/// </remarks>
public static class TriageAgentSetup
{
    /// <summary>
    /// Adds the triage agent system to the dependency injection container.
    /// </summary>
    /// <remarks>
    /// This registers:
    /// - The UserIntentClassifier for intent classification
    /// - Specialized agents via AddAgent&lt;TAgent&gt;() (keyed DI services): Help, DataQuery, Action, and Feedback
    /// - The TriageAgent that routes requests based on classification
    /// 
    /// Usage:
    /// <code>
    /// services.AddTriageAgentSystem();
    /// </code>
    /// </remarks>
    /// <param name="services">The service collection.</param>
    /// <returns>The service collection for chaining.</returns>
    public static IServiceCollection AddTriageAgentSystem(this IServiceCollection services)
    {
        // Register classifier
        services.AddScoped<IClassifier<UserIntent>, UserIntentClassifier>();

        // Register specialized agents by type with DI-managed lifetimes
        services.AddAgent<HelpAgent>("""help-agent""");
        services.AddAgent<DataQueryAgent>("""data-query-agent""");
        services.AddAgent<ActionAgent>("""action-agent""");
        services.AddAgent<FeedbackAgent>("""feedback-agent""");

        // Register the triage agent
        services.AddScoped(provider =>
        {
            var classifier = provider.GetRequiredService<IClassifier<UserIntent>>();
            var registry = provider.GetRequiredService<IAgentRegistry>();

            return new TriageAgent<UserIntent>(
                classifier,
                registry,
                // Routing mapping from intent to agent name
                category => category switch
                {
                    UserIntent.HelpRequest => """help-agent""",
                    UserIntent.DataQuery => """data-query-agent""",
                    UserIntent.ActionRequest => """action-agent""",
                    UserIntent.Feedback => """feedback-agent""",
                    _ => null // Falls back to fallback agent
                },
                fallbackAgentName: """help-agent"""
            );
        });

        return services;
    }
}
