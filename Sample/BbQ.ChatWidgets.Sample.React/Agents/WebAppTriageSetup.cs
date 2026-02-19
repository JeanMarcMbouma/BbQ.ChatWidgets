using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Agents;
using BbQ.ChatWidgets.Agents.Abstractions;

namespace BbQ.ChatWidgets.Sample.WebApp.Agents;

/// <summary>
/// Triage agent system setup for the Web API sample.
/// Enables automatic intent classification and agent routing for the React frontend.
/// </summary>
public static class WebAppTriageSetup
{
    /// <summary>
    /// Adds the triage agent system to the DI container with specialized agents.
    /// </summary>
    /// <remarks>
    /// This extension method registers:
    /// - UserIntentClassifier for AI-based classification
    /// - Specialized agents via AddAgent&lt;TAgent&gt;() (keyed DI services)
    /// - TriageAgent&lt;UserIntent&gt; for routing
    /// 
    /// The system enables the React frontend to send messages through the triage agent
    /// for automatic classification and specialized handling.
    /// 
    /// Usage:
    /// <code>
    /// services.AddWebAppTriageAgents();
    /// </code>
    /// </remarks>
    public static IServiceCollection AddWebAppTriageAgents(this IServiceCollection services)
    {
        // Register classifier
        services.AddScoped<IClassifier<UserIntent>, UserIntentClassifier>();

        // Register specialized agents by type with DI-managed lifetimes
        services.AddAgent<HelpAgent>("help-agent");
        services.AddAgent<DataQueryAgent>("data-query-agent");
        services.AddAgent<ActionAgent>("action-agent");
        services.AddAgent<FeedbackAgent>("feedback-agent");

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
