using BbQ.ChatWidgets.Abstractions;
using Microsoft.AspNetCore.Http;
using System.Collections.Concurrent;
using System.Text.Json;
using System.Threading.Channels;
using BbQ.ChatWidgets.Models;
using System.Linq;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// Service that manages Server-Sent Events (SSE) subscriptions and publishing
/// for named widget streams. Each connected client receives JSON payloads as
/// SSE `data:` messages.
/// </summary>
public sealed class WidgetSseService : IWidgetSseService
{
    // streamId -> list of writers (one per connected client)
    private readonly ConcurrentDictionary<string, ConcurrentBag<ChannelWriter<string>>> _streams = new();
    
    // Lock for coordinating bag removals to prevent race conditions
    private readonly ReaderWriterLockSlim _streamsLock = new();

    /// <summary>
    /// Subscribes the current HTTP context to the specified <paramref name="streamId"/>.
    /// The response is configured for SSE and this method writes events until the
    /// connection is closed or the provided <paramref name="ct"/> is cancelled.
    /// </summary>
    /// <param name="streamId">Logical identifier for the event stream.</param>
    /// <param name="context">The current <see cref="HttpContext"/> for the request.</param>
    /// <param name="ct">Cancellation token used to terminate the subscription.</param>
    public async Task SubscribeAsync(string streamId, HttpContext context, CancellationToken ct = default)
    {
        context.Response.ContentType = "text/event-stream";
        context.Response.Headers.Add("Cache-Control", "no-cache");
        context.Response.Headers.Add("Connection", "keep-alive");

        var channel = Channel.CreateUnbounded<string>(new UnboundedChannelOptions { SingleReader = true, SingleWriter = false });
        var writer = channel.Writer;
        var reader = channel.Reader;

        var bag = _streams.GetOrAdd(streamId, _ => new ConcurrentBag<ChannelWriter<string>>());
        bag.Add(writer);

        try
        {
            await foreach (var message in reader.ReadAllAsync(ct))
            {
                var payload = message;
                try
                {
                    await context.Response.WriteAsync($"data: {payload}\n\n", ct);
                    await context.Response.Body.FlushAsync(ct);
                }
                catch
                {
                    // writing failed - likely disconnected; break to cleanup
                    break;
                }
            }
        }
        finally
        {
            // Atomically remove the writer from the bag
            _streamsLock.EnterWriteLock();
            try
            {
                if (_streams.TryGetValue(streamId, out var existing))
                {
                    var newBag = new ConcurrentBag<ChannelWriter<string>>(existing.Where(w => w != writer));
                    
                    // Clean up empty streams to prevent memory leaks
                    if (newBag.Count == 0)
                    {
                        _streams.TryRemove(streamId, out _);
                    }
                    else
                    {
                        _streams[streamId] = newBag;
                    }
                }
            }
            finally
            {
                _streamsLock.ExitWriteLock();
            }
            
            try { writer.TryComplete(); } catch { }
        }
    }

    /// <summary>
    /// Publishes a JSON-serializable <paramref name="message"/> to the named stream.
    /// The message will be serialized and written to all current subscribers in a
    /// best-effort fashion.
    /// </summary>
    /// <param name="streamId">Logical identifier for the event stream.</param>
    /// <param name="message">The message payload to publish (will be serialized to JSON).</param>
    /// <returns>A completed <see cref="Task"/> when the publish requests have been queued.</returns>
    private Task PublishAsync(string streamId, object message)
    {
        var json = JsonSerializer.Serialize(message, Serialization.Default);

        _streamsLock.EnterReadLock();
        try
        {
            if (!_streams.TryGetValue(streamId, out var bag))
            {
                return Task.CompletedTask;
            }

            // Take a snapshot to avoid issues if bag is modified
            var writers = bag.ToList();
            
            // Attempt synchronous write on all writers and collect those that fail.
            // Note: TryWrite has side effects - it actually writes when successful.
            // Writers where TryWrite succeeds are excluded; only failed writers are collected.
            var failedWriters = writers.Where(w => !w.TryWrite(json)).ToList();
            
            // Handle failed writes asynchronously as fallback
            foreach (var w in failedWriters)
            {
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await w.WriteAsync(json);
                    }
                    catch
                    {
                        // ignore - subscriber is unresponsive
                    }
                });
            }
        }
        finally
        {
            _streamsLock.ExitReadLock();
        }

        return Task.CompletedTask;
    }

    /// <summary>
    /// Publishes a JSON-serializable <paramref name="message"/> to the named stream with payload validation.
    /// The message will be validated against configured rules before being sent to subscribers.
    /// </summary>
    /// <param name="streamId">Logical identifier for the event stream.</param>
    /// <param name="message">The message payload to publish (will be serialized to JSON).</param>
    /// <param name="validator">The payload validator to use for validation.</param>
    /// <param name="publisherId">Optional: Identifier for the publisher (used for rate limiting).</param>
    /// <returns>A completed <see cref="Task"/> when the publish requests have been queued.</returns>
    /// <exception cref="PayloadValidationException">Thrown if payload validation fails.</exception>
    /// <exception cref="PublishRateLimitExceededException">Thrown if publish rate limit is exceeded.</exception>
    public async Task PublishAsync(string streamId, object message, IStreamPayloadValidator validator, string? publisherId = null)
    {
        ArgumentNullException.ThrowIfNull(validator);
        
        // Validate payload before publishing
        await validator.ValidateAsync(streamId, message);
        
        // Check publish frequency limits
        await validator.ValidatePublishFrequencyAsync(streamId, publisherId);

        // Publish after validation passes
        await PublishAsync(streamId, message);
    }
}
