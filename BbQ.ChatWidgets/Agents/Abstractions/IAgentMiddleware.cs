using BbQ.ChatWidgets.Models;
using BbQ.Outcome;

namespace BbQ.ChatWidgets.Agents.Abstractions;

/// <summary>
/// Interface for middleware components in the agent pipeline.
/// </summary>
/// <remarks>
/// Middleware components are responsible for intercepting, modifying, and processing
/// chat requests as they flow through the agent pipeline. They form a chain where each
/// middleware can:
/// - Pre-process the request before passing to the next middleware
/// - Post-process the outcome after the next middleware completes
/// - Short-circuit the pipeline by not calling the next delegate
/// - Handle exceptions and errors
///
/// Middleware is invoked in the order it was registered, creating a chain pattern.
///
/// Example implementation:
/// <code>
/// public class LoggingMiddleware : IAgentMiddleware
/// {
///     private readonly ILogger&lt;LoggingMiddleware&gt; _logger;
///
///     public async Task&lt;Outcome&lt;ChatTurn&gt;&gt; InvokeAsync(
///         ChatRequest request, 
///         AgentDelegate next, 
///         CancellationToken cancellationToken)
///     {
///         _logger.LogInformation("Processing request for thread: {ThreadId}", request.ThreadId);
///         try
///         {
///             var outcome = await next(request, cancellationToken);
///             _logger.LogInformation("Request completed successfully");
///             return outcome;
///         }
///         catch (Exception ex)
///         {
///             _logger.LogError(ex, "Request failed");
///             throw;
///         }
///     }
/// }
/// </code>
/// </remarks>
public interface IAgentMiddleware
{
    /// <summary>
    /// Invokes the middleware for the given chat request.
    /// </summary>
    /// <remarks>
    /// Middleware implementations should:
    /// 1. Perform pre-processing on the request if needed
    /// 2. Call the next delegate to continue the pipeline
    /// 3. Perform post-processing on the outcome if needed
    /// 4. Return the outcome (modified or unmodified)
    ///
    /// The middleware can also choose not to call next, effectively short-circuiting
    /// the pipeline, but should return an appropriate Outcome.
    /// </remarks>
    /// <param name="request">The chat request being processed.</param>
    /// <param name="next">The next middleware in the pipeline. Call this to continue processing.</param>
    /// <param name="cancellationToken">Token to cancel the async operation.</param>
    /// <returns>An Outcome containing either a ChatTurn result or error information.</returns>
    Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, AgentDelegate next, CancellationToken cancellationToken);
}
