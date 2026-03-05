using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Agents;
using BbQ.ChatWidgets.Agents.Abstractions;
using Microsoft.Extensions.DependencyInjection;

namespace BbQ.ChatWidgets.Sample.Shared.Agents;

/// <summary>
/// Demonstrates combining a <see cref="BbQ.ChatWidgets.Agents.TriageAgent{TCategory}"/>
/// with a <see cref="BbQ.ChatWidgets.Agents.MultiTurnAgentOrchestrator"/>.
/// </summary>
/// <remarks>
/// <para>
/// When registered, the <c>/api/chat/agent</c> endpoint behaves as follows:
/// </para>
/// <list type="number">
///   <item>
///     <description>
///       A <see cref="TriageAgent{TCategory}"/> classifies the user's message into a
///       <see cref="UserIntent"/> category using <see cref="UserIntentClassifier"/>.
///     </description>
///   </item>
///   <item>
///     <description>
///       For <see cref="UserIntent.DataQuery"/> the triage routes to the
///       <c>"data-pipeline"</c> named agent, which is a
///       <see cref="MultiTurnAgentOrchestrator"/> containing three steps:
///       <strong>Researcher → Analyst → Summarizer</strong>.
///     </description>
///   </item>
///   <item>
///     <description>
///       All other intents are routed to the matching single-turn agent (Help, Action,
///       Feedback) or fall back to <c>"help-agent"</c>.
///     </description>
///   </item>
/// </list>
/// <para>
/// The HTTP response includes an <c>agentPipeline</c> field when the
/// multi-turn orchestrator is invoked, so the client can display the step-by-step trace.
/// </para>
/// </remarks>
public static class ClassifiedMultiTurnSetup
{
    /// <summary>
    /// Registers the combined triage + multi-turn orchestration agent system.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <returns>The service collection for method chaining.</returns>
    public static IServiceCollection AddClassifiedMultiTurnAgents(this IServiceCollection services)
    {
        // --- Step agents for the multi-turn DataQuery pipeline ---
        services.AddAgent<ResearcherAgent>("researcher");
        services.AddAgent<AnalystAgent>("analyst");
        services.AddAgent<SummarizerAgent>("summarizer");

        // --- Register the multi-turn pipeline as a named keyed agent ---
        // The TriageAgent routes DataQuery to this orchestrator.
        services.AddMultiTurnAgentOrchestrator(
            name: "data-pipeline",
            pipeline:
            [
                ("researcher", new AgentConversationOptions
                {
                    Persona = "You are a thorough research analyst. Gather facts first.",
                    MaxRoundsOverride = 1
                }),
                ("analyst", new AgentConversationOptions
                {
                    Persona = "You are a data analyst. Review the research and draw conclusions.",
                    MaxRoundsOverride = 1
                }),
                ("summarizer", new AgentConversationOptions
                {
                    Persona = "You are a clear communicator. Summarise findings for the user.",
                    MaxRoundsOverride = 1
                })
            ],
            orchestratorOptions: new MultiTurnAgentOrchestratorOptions
            {
                MaxRoundsPerAgent = 1,
                MaxTotalRounds = 3
            }
        );

        // --- Single-turn agents for other intent categories ---
        services.AddAgent<HelpAgent>("help-agent");
        services.AddAgent<ActionAgent>("action-agent");
        services.AddAgent<FeedbackAgent>("feedback-agent");

        // --- Register classifier ---
        services.AddScoped<IClassifier<UserIntent>, UserIntentClassifier>();

        // --- Register TriageAgent as the primary IAgent ---
        // Routes classifications to the appropriate (possibly multi-turn) agent.
        services.AddScoped(sp =>
        {
            var classifier  = sp.GetRequiredService<IClassifier<UserIntent>>();
            var registry    = sp.GetRequiredService<IAgentRegistry>();
            var threadService = sp.GetService<IThreadService>();

            Func<UserIntent, string?> routing = intent => intent switch
            {
                UserIntent.DataQuery     => "data-pipeline",   // ← multi-turn orchestrator
                UserIntent.HelpRequest   => "help-agent",
                UserIntent.ActionRequest => "action-agent",
                UserIntent.Feedback      => "feedback-agent",
                _                        => null               // falls back to help-agent
            };

            return new TriageAgent<UserIntent>(
                classifier,
                registry,
                routing,
                fallbackAgentName: "help-agent",
                threadService: threadService
            ) as IAgent;
        });

        return services;
    }
}
