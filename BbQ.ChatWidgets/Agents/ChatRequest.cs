namespace BbQ.ChatWidgets.Agents;

/// <summary>
/// Represents a chat request for agent processing.
/// </summary>
/// <paramref name="ThreadId"/> is null when creating a new thread.
/// <paramref name="RequestServices"/> provides access to registered services.
/// <remarks>
/// This record encapsulates the request context for chat operations, including
/// thread identification, service provider access, and optional metadata.
/// Used internally by the agent pipeline for request routing and handling.
/// </remarks>
public record ChatRequest(
    string? ThreadId, 
    IServiceProvider RequestServices
    )
{
    /// <summary>
    /// Optional metadata dictionary for passing additional context or configuration.
    /// </summary>
    public Dictionary<string, object> Metadata { get; init; } = [];
};
