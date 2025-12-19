using Microsoft.AspNetCore.Http;
using System.Threading;
using System.Threading.Tasks;

namespace BbQ.ChatWidgets.Abstractions
{
    /// <summary>
    /// Service for managing Server-Sent Events (SSE) for widget updates.
    /// </summary>
    public interface IWidgetSseService
    {
        /// <summary>
        /// Subscribe the current HTTP context to a named stream; this method completes
        /// when the connection is closed.
        /// </summary>
        Task SubscribeAsync(string streamId, HttpContext context, CancellationToken ct = default);


        /// <summary>
        /// Publish a JSON-serializable message to a named stream with payload validation.
        /// </summary>
        /// <remarks>
        /// This method validates the payload against configured rules before publishing.
        /// Use this overload to protect against DoS attacks via:
        /// - Large payload attacks (size limits)
        /// - Rapid-fire publish attacks (rate limiting)
        /// - Custom content validation
        /// </remarks>
        /// <param name="streamId">The stream identifier.</param>
        /// <param name="message">The message object to publish.</param>
        /// <param name="validator">The payload validator to use for validation.</param>
        /// <param name="publisherId">Optional: Identifier for the publisher (used for rate limiting).</param>
        /// <exception cref="PayloadValidationException">Thrown if payload validation fails.</exception>
        /// <exception cref="PublishRateLimitExceededException">Thrown if publish rate limit is exceeded.</exception>
        Task PublishAsync(string streamId, object message, IStreamPayloadValidator validator, string? publisherId = null);
    }
}
