using System.Text;
using System.Text.Json;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Options;
using BbQ.ChatWidgets.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Xunit;

namespace BbQ.ChatWidgets.Tests.Services;

public sealed class WidgetSseServiceTests
{
    [Fact]
    public async Task SubscribeAsync_ReplaysOnlyEventsAfterLastEventId()
    {
        var service = Create(replay: 8);
        await service.PublishEventAsync(Event("one", 1));
        await service.PublishEventAsync(Event("two", 2));
        await service.PublishEventAsync(Event("three", 3));
        var (context, body) = Context("one");

        await SubscribeBriefly(service, context);
        var text = Encoding.UTF8.GetString(body.ToArray());

        Assert.DoesNotContain("id: one", text);
        Assert.Contains("id: two", text);
        Assert.Contains("id: three", text);
    }

    [Fact]
    public async Task SubscribeAsync_RequestsResyncWhenReplayIdWasNotRetained()
    {
        var service = Create(replay: 2);
        await service.PublishEventAsync(Event("one", 1));
        await service.PublishEventAsync(Event("two", 2));
        await service.PublishEventAsync(Event("three", 3));
        var (context, body) = Context("one");

        await SubscribeBriefly(service, context);
        var text = Encoding.UTF8.GetString(body.ToArray());

        Assert.Contains("event: stream.resync-required", text);
        Assert.Contains("replay-gap", text);
    }

    [Fact]
    public async Task SubscribeAsync_CancellationCompletesAndRemovesSubscriber()
    {
        var service = Create(heartbeat: TimeSpan.FromHours(1));
        var (context, _) = Context();
        using var cancellation = new CancellationTokenSource();
        var subscription = service.SubscribeAsync("stream", context, cancellation.Token);
        cancellation.Cancel();

        await subscription.WaitAsync(TimeSpan.FromSeconds(2));
        await service.PublishEventAsync(Event("after-cancel", 1));
    }

    [Fact]
    public async Task IdleSubscription_EmitsHeartbeatWithoutWidgetRevision()
    {
        var service = Create(heartbeat: TimeSpan.FromMilliseconds(10));
        var (context, body) = Context();

        await SubscribeBriefly(service, context);
        var text = Encoding.UTF8.GetString(body.ToArray());

        Assert.Contains("event: stream.heartbeat", text);
        Assert.Contains("\"protocolVersion\":\"1.0\"", text);
        Assert.DoesNotContain("\"revision\"", text);
    }

    [Fact]
    public async Task PublishEventAsync_IsSafeForConcurrentPublishersAndReplay()
    {
        const int count = 32;
        var service = Create(buffer: count, replay: count);
        var (context, body) = Context();
        using var cancellation = new CancellationTokenSource();
        var subscription = service.SubscribeAsync("stream", context, cancellation.Token);
        await Task.Delay(25);
        await Task.WhenAll(Enumerable.Range(1, count).Select(i => service.PublishEventAsync(Event($"event-{i}", i))));
        await Task.Delay(75);
        cancellation.Cancel();
        await subscription;
        var text = Encoding.UTF8.GetString(body.ToArray());

        Assert.Equal(count, text.Split("event: widget.snapshot", StringSplitOptions.None).Length - 1);
    }

    [Fact]
    public async Task SlowSubscriberOverflow_EmitsResyncWithoutUnboundedBuffering()
    {
        var service = Create(buffer: 1, replay: 16, heartbeat: TimeSpan.FromHours(1));
        var gate = new BlockingWriteStream();
        var context = new DefaultHttpContext();
        context.Response.Body = gate;
        using var cancellation = new CancellationTokenSource();
        var subscription = service.SubscribeAsync("stream", context, cancellation.Token);
        await Task.Delay(25);

        for (var i = 1; i <= 8; i++) await service.PublishEventAsync(Event($"event-{i}", i));
        gate.Release();
        await gate.WaitForTextAsync("subscriber-buffer-overflow", TimeSpan.FromSeconds(2));
        cancellation.Cancel();
        await subscription;

        Assert.Contains("event: stream.resync-required", gate.Text);
    }

    private static WidgetSseService Create(int buffer = 8, int replay = 8, TimeSpan? heartbeat = null) =>
        new(Microsoft.Extensions.Options.Options.Create(new WidgetSseOptions
        {
            SubscriberBufferCapacity = buffer,
            ReplayCapacity = replay,
            HeartbeatInterval = heartbeat ?? TimeSpan.FromMilliseconds(20)
        }));

    private static WidgetStreamEvent Event(string id, long revision) => new(
        WidgetStreamEvent.CurrentProtocolVersion,
        id,
        "stream",
        Guid.Parse("11111111-1111-1111-1111-111111111111"),
        null,
        revision,
        WidgetStreamEventKind.Snapshot,
        DateTimeOffset.UtcNow,
        JsonSerializer.SerializeToElement(new { type = "card", title = id }));

    private static (DefaultHttpContext Context, MemoryStream Body) Context(string? lastEventId = null)
    {
        var context = new DefaultHttpContext();
        var body = new MemoryStream();
        context.Response.Body = body;
        if (lastEventId is not null) context.Request.Headers["Last-Event-ID"] = lastEventId;
        return (context, body);
    }

    private static async Task SubscribeBriefly(WidgetSseService service, DefaultHttpContext context)
    {
        using var cancellation = new CancellationTokenSource(TimeSpan.FromMilliseconds(75));
        await service.SubscribeAsync("stream", context, cancellation.Token);
    }

    private sealed class BlockingWriteStream : MemoryStream
    {
        private readonly TaskCompletionSource _gate = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public string Text => Encoding.UTF8.GetString(ToArray());
        public void Release() => _gate.TrySetResult();
        public async Task WaitForTextAsync(string value, TimeSpan timeout)
        {
            var deadline = DateTime.UtcNow + timeout;
            while (!Text.Contains(value, StringComparison.Ordinal) && DateTime.UtcNow < deadline) await Task.Delay(10);
            Assert.Contains(value, Text);
        }
        public override async ValueTask WriteAsync(ReadOnlyMemory<byte> buffer, CancellationToken cancellationToken = default)
        {
            await _gate.Task.WaitAsync(cancellationToken);
            await base.WriteAsync(buffer, cancellationToken);
        }
    }
}
