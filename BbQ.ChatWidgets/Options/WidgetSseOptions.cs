namespace BbQ.ChatWidgets.Options;

/// <summary>Controls buffering, replay, and liveness for widget SSE streams.</summary>
public sealed class WidgetSseOptions
{
    /// <summary>Maximum queued events per connected client.</summary>
    public int SubscriberBufferCapacity { get; set; } = 64;

    /// <summary>Maximum number of events retained per stream for reconnect replay.</summary>
    public int ReplayCapacity { get; set; } = 256;

    /// <summary>Interval between stream-level heartbeat events.</summary>
    public TimeSpan HeartbeatInterval { get; set; } = TimeSpan.FromSeconds(20);

    internal void Validate()
    {
        if (SubscriberBufferCapacity <= 0) throw new InvalidOperationException("SubscriberBufferCapacity must be positive.");
        if (ReplayCapacity <= 0) throw new InvalidOperationException("ReplayCapacity must be positive.");
        if (HeartbeatInterval <= TimeSpan.Zero) throw new InvalidOperationException("HeartbeatInterval must be positive.");
    }
}
