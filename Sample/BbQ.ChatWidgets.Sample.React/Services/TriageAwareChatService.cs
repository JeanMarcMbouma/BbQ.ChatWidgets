using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Agents;

namespace BbQ.ChatWidgets.Sample.WebApp.Services;

/// <summary>
/// Chat service for the Web API that supports triage agent routing.
/// Bridges requests from the React frontend to specialized agents based on intent classification.
/// </summary>
public class TriageAwareChatService
{
    private readonly TriageAgent<Agents.UserIntent> _triageAgent;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<TriageAwareChatService> _logger;

    /// <summary>
    /// Initializes a new instance of the TriageAwareChatService.
    /// </summary>
    /// <param name="triageAgent">The triage agent for classification and routing.</param>
    /// <param name="serviceProvider">The service provider for accessing dependencies.</param>
    /// <param name="logger">The logger for diagnostic information.</param>
    public TriageAwareChatService(
        TriageAgent<Agents.UserIntent> triageAgent,
        IServiceProvider serviceProvider,
        ILogger<TriageAwareChatService> logger)
    {
        _triageAgent = triageAgent ?? throw new ArgumentNullException(nameof(triageAgent));
        _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Processes a user message through the triage agent system.
    /// </summary>
    /// <remarks>
    /// This method:
    /// 1. Creates a ChatRequest with the user message in metadata
    /// 2. Invokes the triage agent for classification and routing
    /// 3. Returns the response from the appropriate specialized agent
    /// 
    /// The triage agent will:
    /// - Classify the user's intent
    /// - Route to the appropriate specialized agent
    /// - Share classification context via metadata
    /// - Return an agent-specific response
    /// 
    /// If triage fails, an exception is thrown with diagnostic information.
    /// </remarks>
    /// <param name="userMessage">The user's message to classify and process.</param>
    /// <param name="threadId">Optional conversation thread ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>A ChatTurn with the agent's response.</returns>
    /// <exception cref="InvalidOperationException">
    /// Thrown if triage routing fails or no appropriate agent is found.
    /// </exception>
    public async Task<ChatTurn> ProcessMessageWithTriageAsync(
        string userMessage,
        string? threadId = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Processing message through triage agent: {Message}", 
                userMessage.Length > 50 ? userMessage.Substring(0, 50) + "..." : userMessage);

            // Create request with user message in metadata
            var request = new ChatRequest(
                ThreadId: threadId,
                RequestServices: _serviceProvider
            )
            {
                Metadata = new Dictionary<string, object> 
                { 
                    { "UserMessage", userMessage }
                }
            };

            // Invoke triage agent
            var outcome = await _triageAgent.InvokeAsync(request, cancellationToken);

            // Extract classification info
            var classification = InterAgentCommunicationContext.GetClassification<Agents.UserIntent>(request);
            var routedAgent = InterAgentCommunicationContext.GetRoutedAgent(request);

            _logger.LogInformation(
                "Message processed. Classification: {Classification}, Agent: {Agent}",
                classification,
                routedAgent);

            return outcome.Value;
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Message processing cancelled");
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing message through triage agent");
            throw;
        }
    }
}
