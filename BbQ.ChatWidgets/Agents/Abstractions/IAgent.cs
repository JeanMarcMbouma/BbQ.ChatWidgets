using BbQ.ChatWidgets.Models;
using BbQ.Outcome;
using Microsoft.AspNetCore.Http;

namespace BbQ.ChatWidgets.Agents.Abstractions;

/// <summary>
/// Represents an agent that processes chat requests and returns outcomes.
/// </summary>
/// <remarks>
/// An agent is a component that handles chat operations in the agent pipeline.
/// Agents are chained together to process requests through multiple stages,
/// allowing for modular, composable request handling.
///
/// Implementers should:
/// - Process the chat request
/// - Return an Outcome indicating success or failure
/// - Propagate cancellation requests
/// </remarks>
public interface IAgent
{
    /// <summary>
    /// Invokes the agent to process a chat request.
    /// </summary>
    /// <remarks>
    /// This method processes the request through the agent pipeline and returns
    /// an Outcome that indicates success (with ChatTurn result) or failure (with errors).
    /// </remarks>
    /// <param name="request">The chat request to process.</param>
    /// <param name="cancellationToken">Token to cancel the async operation.</param>
    /// <returns>An Outcome containing either a ChatTurn result or error information.</returns>
    Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken cancellationToken);
}

/// <summary>
/// Delegate for handling chat requests in the agent pipeline.
/// </summary>
/// <remarks>
/// This delegate type is used for middleware and agent components that process
/// chat requests and return outcomes. It provides a functional approach to
/// request handling compatible with pipeline middleware patterns.
/// </remarks>
/// <param name="request">The chat request to process.</param>
/// <param name="ct">Cancellation token.</param>
/// <returns>An Outcome with the ChatTurn result or error information.</returns>
public delegate Task<Outcome<ChatTurn>> AgentDelegate(ChatRequest request, CancellationToken ct);