using System.Collections.Concurrent;
using BbQ.ChatWidgets.Abstractions;

namespace BbQ.ChatWidgets.Sample.WebApp.Services;

/// <summary>
/// Simple background publisher used by the sample WebApp to publish periodic
/// clock updates to a named SSE stream. Intended for demo/testing purposes.
/// </summary>
public class ClockPublisher
{
    private readonly IWidgetSseService _sse;
    private readonly IStreamPayloadValidator _validator;
    private readonly ConcurrentDictionary<string, CancellationTokenSource> _running = new();

    /// <summary>
    /// Creates a new <see cref="ClockPublisher"/>.
    /// </summary>
    /// <param name="sse">The <see cref="IWidgetSseService"/> used to publish events.</param>
    public ClockPublisher(IWidgetSseService sse, IStreamPayloadValidator validator)
    {
        _sse = sse;
        _validator = validator; 
    }

    /// <summary>
    /// Starts publishing clock updates to the specified <paramref name="streamId"/> at
    /// the specified interval. If a publisher is already running for the stream this
    /// method is a no-op.
    /// </summary>
    /// <param name="streamId">The logical stream id to publish clock updates on.</param>
    /// <param name="intervalMs">Interval between updates in milliseconds (default: 1000).</param>
    /// <returns>A completed <see cref="Task"/>; the publisher runs in the background.</returns>
    public Task StartAsync(string streamId, int intervalMs = 1000)
    {
        if (_running.ContainsKey(streamId)) return Task.CompletedTask;

        var cts = new CancellationTokenSource();
        if (!_running.TryAdd(streamId, cts)) return Task.CompletedTask;

        _ = Task.Run(async () =>
        {
            try
            {
                while (!cts.Token.IsCancellationRequested)
                {
                    var now = DateTime.UtcNow;
                    var timeIso = now.ToString("O");
                    var timeLocal = now.ToLocalTime().ToString("HH:mm:ss");
                    var payload = new { widgetId = "clock", time = timeIso, timeLocal };
                    try
                    {
                        await _sse.PublishAsync(streamId, payload, _validator);
                    }
                    catch
                    {
                        // best-effort
                    }

                    await Task.Delay(intervalMs, cts.Token);
                }
            }
            catch (TaskCanceledException) { }
            finally
            {
                _running.TryRemove(streamId, out _);
            }
        });

        return Task.CompletedTask;
    }

    /// <summary>
    /// Stops the background publisher for the specified <paramref name="streamId"/>,
    /// if one is running.
    /// </summary>
    /// <param name="streamId">The logical stream id to stop publishing for.</param>
    /// <returns>A completed <see cref="Task"/>.</returns>
    public Task StopAsync(string streamId)
    {
        if (_running.TryRemove(streamId, out var cts))
        {
            try { cts.Cancel(); } catch { }
            cts.Dispose();
        }
        return Task.CompletedTask;
    }
}
