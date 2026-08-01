using System.Collections.Concurrent;
using System.Globalization;
using System.Text.Json;
using System.Threading.Channels;
using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Options;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace BbQ.ChatWidgets.Services;

/// <summary>Bounded, replayable SSE transport for widget protocol events.</summary>
public sealed class WidgetSseService : IWidgetSseService
{
    private sealed record Frame(string Id, string EventName, string Json);
    private sealed class Subscriber(int capacity)
    {
        public Channel<Frame> Channel { get; } = System.Threading.Channels.Channel.CreateBounded<Frame>(
            new BoundedChannelOptions(capacity) { SingleReader = true, SingleWriter = false, FullMode = BoundedChannelFullMode.Wait });
        public volatile bool Overflowed;
    }
    private sealed class StreamState
    {
        public object Sync { get; } = new();
        public LinkedList<Frame> Replay { get; } = new();
        public HashSet<Subscriber> Subscribers { get; } = new();
        public long Sequence;
    }

    private readonly ConcurrentDictionary<string, StreamState> _streams = new();
    private readonly WidgetSseOptions _options;

    /// <summary>Initializes the SSE transport with validated buffering and liveness options.</summary>
    /// <param name="options">Optional configured SSE options.</param>
    public WidgetSseService(IOptions<WidgetSseOptions>? options = null)
    {
        _options = options?.Value ?? new WidgetSseOptions();
        _options.Validate();
    }

    /// <inheritdoc />
    public async Task SubscribeAsync(string streamId, HttpContext context, CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(streamId);
        context.Response.ContentType = "text/event-stream";
        context.Response.Headers["Cache-Control"] = "no-cache";
        context.Response.Headers["Connection"] = "keep-alive";

        var state = _streams.GetOrAdd(streamId, _ => new StreamState());
        var subscriber = new Subscriber(_options.SubscriberBufferCapacity);
        var lastEventId = context.Request.Headers["Last-Event-ID"].FirstOrDefault();

        lock (state.Sync)
        {
            foreach (var frame in ReplayAfter(state, streamId, lastEventId))
                if (!subscriber.Channel.Writer.TryWrite(frame)) subscriber.Overflowed = true;
            state.Subscribers.Add(subscriber);
        }

        try
        {
            while (!ct.IsCancellationRequested)
            {
                var read = subscriber.Channel.Reader.WaitToReadAsync(ct).AsTask();
                var tick = Task.Delay(_options.HeartbeatInterval, ct);
                var completed = await Task.WhenAny(read, tick);
                if (completed == tick)
                {
                    await tick;
                    await WriteFrameAsync(context, CreateHeartbeat(streamId, state), ct);
                    continue;
                }

                if (!await read) break;
                while (subscriber.Channel.Reader.TryRead(out var frame))
                    await WriteFrameAsync(context, frame, ct);

                if (subscriber.Overflowed)
                {
                    subscriber.Overflowed = false;
                    await WriteFrameAsync(context, CreateResync(streamId, state, "subscriber-buffer-overflow"), ct);
                }
            }
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { }
        catch (IOException) { }
        finally
        {
            lock (state.Sync) state.Subscribers.Remove(subscriber);
            subscriber.Channel.Writer.TryComplete();
        }
    }

    /// <inheritdoc />
    public Task PublishEventAsync(WidgetStreamEvent streamEvent, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(streamEvent);
        ct.ThrowIfCancellationRequested();
        PublishFrame(streamEvent.StreamId, new Frame(streamEvent.EventId, EventName(streamEvent.Kind), JsonSerializer.Serialize(streamEvent, Serialization.Default)), retain: true);
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public async Task PublishAsync(string streamId, object message, IStreamPayloadValidator validator, string? publisherId = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(streamId);
        ArgumentNullException.ThrowIfNull(message);
        ArgumentNullException.ThrowIfNull(validator);
        await validator.ValidateAsync(streamId, message);
        await validator.ValidatePublishFrequencyAsync(streamId, publisherId);
        if (message is WidgetStreamEvent streamEvent)
        {
            if (!StringComparer.Ordinal.Equals(streamId, streamEvent.StreamId))
                throw new ArgumentException("The route stream ID must match the event stream ID.", nameof(streamId));
            await PublishEventAsync(streamEvent);
            return;
        }

        var state = _streams.GetOrAdd(streamId, _ => new StreamState());
        string id;
        lock (state.Sync) id = (++state.Sequence).ToString(CultureInfo.InvariantCulture);
        PublishFrame(streamId, new Frame(id, "message", JsonSerializer.Serialize(message, Serialization.Default)), retain: true);
    }

    private void PublishFrame(string streamId, Frame frame, bool retain)
    {
        var state = _streams.GetOrAdd(streamId, _ => new StreamState());
        lock (state.Sync)
        {
            if (retain)
            {
                if (state.Replay.Any(item => StringComparer.Ordinal.Equals(item.Id, frame.Id))) return;
                state.Replay.AddLast(frame);
                while (state.Replay.Count > _options.ReplayCapacity) state.Replay.RemoveFirst();
            }
            foreach (var subscriber in state.Subscribers)
                if (!subscriber.Channel.Writer.TryWrite(frame)) subscriber.Overflowed = true;
        }
    }

    private IEnumerable<Frame> ReplayAfter(StreamState state, string streamId, string? lastEventId)
    {
        if (string.IsNullOrWhiteSpace(lastEventId)) yield break;
        var node = state.Replay.First;
        while (node is not null && !StringComparer.Ordinal.Equals(node.Value.Id, lastEventId)) node = node.Next;
        if (node is null)
        {
            yield return CreateResync(streamId, state, "replay-gap");
            yield break;
        }
        for (node = node.Next; node is not null; node = node.Next) yield return node.Value;
    }

    private static Frame CreateHeartbeat(string streamId, StreamState state)
    {
        long id;
        lock (state.Sync) id = ++state.Sequence;
        var json = JsonSerializer.Serialize(new { protocolVersion = WidgetStreamEvent.CurrentProtocolVersion, streamId, occurredAtUtc = DateTimeOffset.UtcNow }, Serialization.Default);
        return new Frame($"heartbeat-{id}", "stream.heartbeat", json);
    }

    private static Frame CreateResync(string streamId, StreamState state, string reason)
    {
        long revision;
        lock (state.Sync) revision = state.Sequence;
        var json = JsonSerializer.Serialize(new { protocolVersion = WidgetStreamEvent.CurrentProtocolVersion, streamId, reason, currentRevision = revision }, Serialization.Default);
        return new Frame($"resync-{revision}", "stream.resync-required", json);
    }

    private static async Task WriteFrameAsync(HttpContext context, Frame frame, CancellationToken ct)
    {
        await context.Response.WriteAsync($"event: {frame.EventName}\nid: {frame.Id}\ndata: {frame.Json}\n\n", ct);
        await context.Response.Body.FlushAsync(ct);
    }

    private static string EventName(WidgetStreamEventKind kind) => kind switch
    {
        WidgetStreamEventKind.Snapshot => "widget.snapshot",
        WidgetStreamEventKind.Upsert => "widget.upsert",
        WidgetStreamEventKind.Patch => "widget.patch",
        WidgetStreamEventKind.Remove => "widget.remove",
        WidgetStreamEventKind.Status => "widget.status",
        WidgetStreamEventKind.ActionResult => "widget.action-result",
        WidgetStreamEventKind.ResyncRequired => "stream.resync-required",
        WidgetStreamEventKind.Heartbeat => "stream.heartbeat",
        _ => throw new ArgumentOutOfRangeException(nameof(kind))
    };
}
