namespace BbQ.ChatWidgets.Agents;

/// <summary>
/// Represents a chat request for agent processing.
/// </summary>
/// <remarks>
/// This record encapsulates the request context for chat operations, including
/// thread identification, service provider access, and optional metadata.
/// Used internally by the agent pipeline for request routing and handling.
/// </remarks>
public record ChatRequest(
    /// <summary>
    /// The conversation thread ID. Null if creating a new thread.
    /// </summary>
    string? ThreadId, 
    
    /// <summary>
    /// The service provider for accessing registered services and dependencies.
    /// </summary>
    IServiceProvider RequestServices
    )
{
    /// <summary>
    /// Optional metadata dictionary for passing additional context or configuration.
    /// </summary>
    public Dictionary<string, object> Metadata { get; init; } = [];
};
