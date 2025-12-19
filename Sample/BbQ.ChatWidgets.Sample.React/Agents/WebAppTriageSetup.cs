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
    /// - AgentRegistry with 4 specialized agents
    /// - TriageAgent<UserIntent> for routing
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
