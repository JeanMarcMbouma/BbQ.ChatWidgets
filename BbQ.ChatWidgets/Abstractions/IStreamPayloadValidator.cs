namespace BbQ.ChatWidgets.Abstractions;

/// <summary>
/// Defines validation criteria for SSE stream payloads to prevent Denial-of-Service (DoS) attacks.
/// Implementations must validate payload size, frequency, and content to ensure fair resource usage.
/// </summary>
public interface IStreamPayloadValidator
{
    /// <summary>
    /// Gets the validation rules for the specified stream.
    /// </summary>
    /// <param name="streamId">The identifier of the stream being published to.</param>
    /// <returns>A <see cref="StreamValidationRules"/> containing the validation constraints for this stream.</returns>
    StreamValidationRules GetRules(string streamId);

    /// <summary>
    /// Validates a payload before publishing to an SSE stream.
    /// </summary>
    /// <remarks>
    /// This method should check:
    /// - Maximum payload size (prevents large payload attacks)
    /// - Payload serialization validity (prevents malformed data)
    /// - Custom content validation (e.g., format, allowed fields)
    /// 
    /// Throw <see cref="PayloadValidationException"/> to reject invalid payloads.
    /// </remarks>
    /// <param name="streamId">The identifier of the stream being published to.</param>
    /// <param name="message">The message object to validate (will be serialized to JSON).</param>
    /// <exception cref="PayloadValidationException">Thrown when the payload fails validation.</exception>
    Task ValidateAsync(string streamId, object message);

    /// <summary>
    /// Validates publish frequency to prevent rapid-fire attacks.
    /// </summary>
    /// <remarks>
    /// This method should track and enforce rate limiting rules for publishers.
    /// It may use throttling, backoff strategies, or quota-based limiting.
    /// 
    /// Throw <see cref="PublishRateLimitExceededException"/> when rate limit is exceeded.
    /// </remarks>
    /// <param name="streamId">The identifier of the stream being published to.</param>
    /// <param name="publisherId">Optional identifier for the publisher (e.g., user ID, client ID).</param>
    /// <exception cref="PublishRateLimitExceededException">Thrown when the publish rate exceeds configured limits.</exception>
    Task ValidatePublishFrequencyAsync(string streamId, string? publisherId = null);
}

/// <summary>
/// Defines validation rules for a specific stream to prevent DoS attacks.
/// </summary>
public sealed class StreamValidationRules
{
    /// <summary>
    /// Gets or sets the maximum allowed size of a serialized JSON payload in bytes.
    /// Default: 1 MB (1,048,576 bytes).
    /// </summary>
    /// <remarks>
    /// Prevents large payload attacks that could exhaust server memory.
    /// </remarks>
    public long MaxPayloadSizeBytes { get; set; } = 1024 * 1024;

    /// <summary>
    /// Gets or sets the maximum number of publishes allowed per minute per publisher.
    /// Default: 600 (10 publishes per second).
    /// </summary>
    /// <remarks>
    /// Prevents rapid-fire publish attacks that could overwhelm subscribers or the server.
    /// </remarks>
    public int MaxPublishesPerMinute { get; set; } = 600;

    /// <summary>
    /// Gets or sets the maximum number of concurrent subscribers allowed on this stream.
    /// Default: 1000.
    /// </summary>
    /// <remarks>
    /// Prevents resource exhaustion from too many simultaneous connections.
    /// </remarks>
    public int MaxConcurrentSubscribers { get; set; } = 1000;

    /// <summary>
    /// Gets or sets whether to enable strict payload content validation.
    /// Default: false.
    /// </summary>
    /// <remarks>
    /// When enabled, custom validators can inspect payload contents.
    /// </remarks>
    public bool EnableContentValidation { get; set; } = false;

    /// <summary>
    /// Gets or sets an optional custom validator function for payload content.
    /// </summary>
    /// <remarks>
    /// This function is called if <see cref="EnableContentValidation"/> is true.
    /// It allows developers to implement custom validation logic (e.g., checking for suspicious patterns).
    /// </remarks>
    public Func<object, Task<bool>>? CustomValidator { get; set; }
}

/// <summary>
/// Exception thrown when a payload fails validation.
/// </summary>
public sealed class PayloadValidationException : InvalidOperationException
{
    /// <summary>
    /// Initializes a new instance of the <see cref="PayloadValidationException"/> class.
    /// </summary>
    /// <param name="message">The validation error message.</param>
    /// <param name="reason">The specific reason for validation failure.</param>
    public PayloadValidationException(string message, PayloadValidationReason reason = PayloadValidationReason.Invalid)
        : base(message)
    {
        Reason = reason;
    }

    /// <summary>
    /// Gets the specific reason for the validation failure.
    /// </summary>
    public PayloadValidationReason Reason { get; }
}

/// <summary>
/// Specifies the reason a payload failed validation.
/// </summary>
public enum PayloadValidationReason
{
    /// <summary>The payload exceeds the maximum allowed size.</summary>
    PayloadTooLarge,

    /// <summary>The payload is invalid or cannot be serialized.</summary>
    Invalid,

    /// <summary>The payload content failed custom validation rules.</summary>
    ContentValidationFailed,

    /// <summary>The payload type is not allowed for this stream.</summary>
    InvalidType,
}

/// <summary>
/// Exception thrown when a publisher exceeds the allowed publish rate.
/// </summary>
public sealed class PublishRateLimitExceededException : InvalidOperationException
{
    /// <summary>
    /// Initializes a new instance of the <see cref="PublishRateLimitExceededException"/> class.
    /// </summary>
    /// <param name="message">The rate limit error message.</param>
    /// <param name="retryAfterSeconds">Optional: Suggested number of seconds to wait before retrying.</param>
    public PublishRateLimitExceededException(string message, int? retryAfterSeconds = null)
        : base(message)
    {
        RetryAfterSeconds = retryAfterSeconds;
    }

    /// <summary>
    /// Gets the suggested number of seconds to wait before retrying.
    /// May be null if the retry wait time is unknown.
    /// </summary>
    public int? RetryAfterSeconds { get; }
}
