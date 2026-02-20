namespace BbQ.ChatWidgets.Agents;

/// <summary>
/// Context for facilitating communication between agents in the pipeline.
/// </summary>
/// <remarks>
/// This class provides a structured way for agents to share information
/// through the ChatRequest metadata. It encapsulates the classification
/// results, routing decisions, and previous agent outputs.
/// </remarks>
public sealed class InterAgentCommunicationContext
{
    private const string ClassificationKey = "Classification";
    private const string UserMessageKey = "UserMessage";
    private const string PersonaKey = "Persona";
    private const string RoutedAgentKey = "RoutedAgent";
    private const string PreviousResultKey = "PreviousResult";

    /// <summary>
    /// Sets the classification result in the request metadata.
    /// </summary>
    /// <typeparam name="TCategory">The enum type of the classification.</typeparam>
    /// <param name="request">The chat request.</param>
    /// <param name="category">The classification category.</param>
    public static void SetClassification<TCategory>(ChatRequest request, TCategory category)
        where TCategory : Enum
    {
        request.Metadata[ClassificationKey] = category;
    }

    /// <summary>
    /// Gets the classification result from the request metadata.
    /// </summary>
    /// <typeparam name="TCategory">The enum type of the classification.</typeparam>
    /// <param name="request">The chat request.</param>
    /// <returns>The classification category, or null if not set.</returns>
    public static TCategory? GetClassification<TCategory>(ChatRequest request)
        where TCategory : Enum
    {
        if (request.Metadata?.TryGetValue(ClassificationKey, out var value) == true)
        {
            return (TCategory?)value;
        }

        return default;
    }

    /// <summary>
    /// Sets the user message in the request metadata.
    /// </summary>
    /// <param name="request">The chat request.</param>
    /// <param name="message">The user message.</param>
    public static void SetUserMessage(ChatRequest request, string message)
    {
        request.Metadata[UserMessageKey] = message;
    }

    /// <summary>
    /// Gets the user message from the request metadata.
    /// </summary>
    /// <param name="request">The chat request.</param>
    /// <returns>The user message, or null if not set.</returns>
    public static string? GetUserMessage(ChatRequest request)
    {
        if (request.Metadata?.TryGetValue(UserMessageKey, out var value) == true)
        {
            return value?.ToString();
        }

        return null;
    }

    /// <summary>
    /// Sets the persona override in the request metadata.
    /// </summary>
    /// <param name="request">The chat request.</param>
    /// <param name="persona">The persona text. Use empty string to clear persona.</param>
    public static void SetPersona(ChatRequest request, string persona)
    {
        request.Metadata[PersonaKey] = persona;
    }

    /// <summary>
    /// Gets the persona override from the request metadata.
    /// </summary>
    /// <param name="request">The chat request.</param>
    /// <returns>The persona override, or null if not set.</returns>
    public static string? GetPersona(ChatRequest request)
    {
        if (request.Metadata?.TryGetValue(PersonaKey, out var value) == true)
        {
            return value?.ToString();
        }

        return null;
    }

    /// <summary>
    /// Sets the routed agent name in the request metadata.
    /// </summary>
    /// <param name="request">The chat request.</param>
    /// <param name="agentName">The name of the routed agent.</param>
    public static void SetRoutedAgent(ChatRequest request, string agentName)
    {
        request.Metadata[RoutedAgentKey] = agentName;
    }

    /// <summary>
    /// Gets the routed agent name from the request metadata.
    /// </summary>
    /// <param name="request">The chat request.</param>
    /// <returns>The routed agent name, or null if not set.</returns>
    public static string? GetRoutedAgent(ChatRequest request)
    {
        if (request.Metadata?.TryGetValue(RoutedAgentKey, out var value) == true)
        {
            return value?.ToString();
        }

        return null;
    }

    /// <summary>
    /// Sets the previous agent's result for inter-agent communication.
    /// </summary>
    /// <param name="request">The chat request.</param>
    /// <param name="result">The result from a previous agent.</param>
    public static void SetPreviousResult(ChatRequest request, object result)
    {
        request.Metadata[PreviousResultKey] = result;
    }

    /// <summary>
    /// Gets the previous agent's result from the request metadata.
    /// </summary>
    /// <param name="request">The chat request.</param>
    /// <returns>The previous agent result, or null if not set.</returns>
    public static object? GetPreviousResult(ChatRequest request)
    {
        if (request.Metadata?.TryGetValue(PreviousResultKey, out var value) == true)
        {
            return value;
        }

        return null;
    }
}
