using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Models;
using System.Collections.Concurrent;
using System.Text.Json;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// Default implementation of <see cref="IStreamPayloadValidator"/> that enforces payload size
/// and publish rate limits to prevent Denial-of-Service attacks.
/// </summary>
/// <remarks>
/// This validator provides:
/// - Configurable maximum payload sizes per stream
/// - Per-publisher rate limiting with sliding window tracking
/// - Concurrent subscriber count limiting
/// - Optional custom content validation
/// - Thread-safe operation
/// </remarks>
public sealed class DefaultStreamPayloadValidator : IStreamPayloadValidator
{
    private readonly ConcurrentDictionary<string, StreamValidationRules> _rulesPerStream;
    private readonly StreamValidationRules _defaultRules;
    
    // Track publish timestamps per (streamId, publisherId) for rate limiting
    private readonly ConcurrentDictionary<string, Queue<DateTime>> _publishHistory = new();
    
    // Track concurrent subscriber counts per stream
    private readonly ConcurrentDictionary<string, int> _subscriberCounts = new();
    
    private readonly ReaderWriterLockSlim _publishHistoryLock = new();

    /// <summary>
    /// Initializes a new instance of the <see cref="DefaultStreamPayloadValidator"/> class.
    /// </summary>
    /// <param name="defaultRules">The default validation rules to apply to all streams. If null, uses <see cref="StreamValidationRules"/> defaults.</param>
    /// <param name="streamRules">Optional: A dictionary mapping stream IDs to their specific validation rules.</param>
    public DefaultStreamPayloadValidator(
        StreamValidationRules? defaultRules = null,
        IDictionary<string, StreamValidationRules>? streamRules = null)
    {
        _defaultRules = defaultRules ?? new StreamValidationRules();
        _rulesPerStream = new ConcurrentDictionary<string, StreamValidationRules>(
            streamRules ?? new Dictionary<string, StreamValidationRules>());
    }

    /// <summary>
    /// Sets custom validation rules for a specific stream.
    /// </summary>
    /// <param name="streamId">The stream identifier.</param>
    /// <param name="rules">The validation rules for this stream.</param>
    public void SetStreamRules(string streamId, StreamValidationRules rules)
    {
        ArgumentNullException.ThrowIfNull(streamId);
        ArgumentNullException.ThrowIfNull(rules);
        
        _rulesPerStream[streamId] = rules;
    }

    /// <inheritdoc />
    public StreamValidationRules GetRules(string streamId)
    {
        return _rulesPerStream.TryGetValue(streamId, out var rules)
            ? rules
            : _defaultRules;
    }

    /// <inheritdoc />
    public async Task ValidateAsync(string streamId, object message)
    {
        ArgumentNullException.ThrowIfNull(streamId);
        ArgumentNullException.ThrowIfNull(message);

        var rules = GetRules(streamId);

        // Validate payload serialization and size
        try
        {
            var json = JsonSerializer.Serialize(message, Serialization.Default);
            var payloadSize = System.Text.Encoding.UTF8.GetByteCount(json);

            if (payloadSize > rules.MaxPayloadSizeBytes)
            {
                throw new PayloadValidationException(
                    $"Payload exceeds maximum size of {rules.MaxPayloadSizeBytes} bytes. " +
                    $"Actual size: {payloadSize} bytes.",
                    PayloadValidationReason.PayloadTooLarge);
            }
        }
        catch (JsonException ex)
        {
            throw new PayloadValidationException(
                $"Payload cannot be serialized to JSON: {ex.Message}",
                PayloadValidationReason.Invalid);
        }
        catch (PayloadValidationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new PayloadValidationException(
                $"Unexpected error during payload validation: {ex.Message}",
                PayloadValidationReason.Invalid);
        }

        // Run custom content validation if enabled
        if (rules.EnableContentValidation && rules.CustomValidator != null)
        {
            try
            {
                var isValid = await rules.CustomValidator(message);
                if (!isValid)
                {
                    throw new PayloadValidationException(
                        "Payload failed custom content validation.",
                        PayloadValidationReason.ContentValidationFailed);
                }
            }
            catch (PayloadValidationException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw new PayloadValidationException(
                    $"Error during custom content validation: {ex.Message}",
                    PayloadValidationReason.Invalid);
            }
        }
    }

    /// <inheritdoc />
    public Task ValidatePublishFrequencyAsync(string streamId, string? publisherId = null)
    {
        ArgumentNullException.ThrowIfNull(streamId);

        var rules = GetRules(streamId);
        var key = $"{streamId}:{publisherId ?? "anonymous"}";

        _publishHistoryLock.EnterWriteLock();
        try
        {
            var queue = _publishHistory.GetOrAdd(key, _ => new Queue<DateTime>());
            var now = DateTime.UtcNow;
            var oneMinuteAgo = now.AddMinutes(-1);

            // Remove entries older than 1 minute
            while (queue.Count > 0 && queue.Peek() < oneMinuteAgo)
            {
                queue.Dequeue();
            }

            // Check if rate limit exceeded
            if (queue.Count >= rules.MaxPublishesPerMinute)
            {
                var oldestTimestamp = queue.Peek();
                var retryAfterSeconds = (int)Math.Ceiling((oldestTimestamp.AddMinutes(1) - now).TotalSeconds);

                throw new PublishRateLimitExceededException(
                    $"Publish rate limit exceeded for stream '{streamId}'. " +
                    $"Maximum {rules.MaxPublishesPerMinute} publishes per minute allowed.",
                    retryAfterSeconds);
            }

            // Record this publish
            queue.Enqueue(now);
        }
        finally
        {
            _publishHistoryLock.ExitWriteLock();
        }

        return Task.CompletedTask;
    }

    /// <summary>
    /// Records a new subscriber connection for tracking concurrent subscriber limits.
    /// </summary>
    /// <param name="streamId">The stream identifier.</param>
    /// <returns>True if the subscriber was added; false if the concurrent limit would be exceeded.</returns>
    public bool TryAddSubscriber(string streamId)
    {
        ArgumentNullException.ThrowIfNull(streamId);

        var rules = GetRules(streamId);

        return _subscriberCounts.AddOrUpdate(streamId,
            1,
            (_, current) =>
            {
                if (current >= rules.MaxConcurrentSubscribers)
                {
                    return current;
                }
                return current + 1;
            }) <= rules.MaxConcurrentSubscribers;
    }

    /// <summary>
    /// Records a subscriber disconnection.
    /// </summary>
    /// <param name="streamId">The stream identifier.</param>
    public void RemoveSubscriber(string streamId)
    {
        ArgumentNullException.ThrowIfNull(streamId);

        _subscriberCounts.AddOrUpdate(streamId,
            0,
            (_, current) => Math.Max(0, current - 1));
    }

    /// <summary>
    /// Gets the current number of active subscribers on a stream.
    /// </summary>
    /// <param name="streamId">The stream identifier.</param>
    /// <returns>The number of active subscribers.</returns>
    public int GetActiveSubscriberCount(string streamId)
    {
        return _subscriberCounts.TryGetValue(streamId, out var count) ? count : 0;
    }

    /// <summary>
    /// Clears all tracked data (for testing purposes).
    /// </summary>
    internal void ClearTrackedData()
    {
        _publishHistoryLock.EnterWriteLock();
        try
        {
            _publishHistory.Clear();
        }
        finally
        {
            _publishHistoryLock.ExitWriteLock();
        }

        _subscriberCounts.Clear();
    }
}
