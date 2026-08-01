namespace BbQ.ChatWidgets.Options;

/// <summary>
/// Bounds patch-chain length and age by requiring periodic complete snapshots.
/// </summary>
public sealed record WidgetSnapshotPolicy
{
    /// <summary>Initializes a periodic snapshot policy.</summary>
    /// <param name="maximumPatchCount">Maximum patches allowed after a snapshot.</param>
    /// <param name="maximumSnapshotAge">Maximum age of the most recent snapshot.</param>
    public WidgetSnapshotPolicy(int maximumPatchCount = 20, TimeSpan? maximumSnapshotAge = null)
    {
        if (maximumPatchCount <= 0)
            throw new ArgumentOutOfRangeException(nameof(maximumPatchCount));
        var age = maximumSnapshotAge ?? TimeSpan.FromMinutes(2);
        if (age <= TimeSpan.Zero)
            throw new ArgumentOutOfRangeException(nameof(maximumSnapshotAge));

        MaximumPatchCount = maximumPatchCount;
        MaximumSnapshotAge = age;
    }

    /// <summary>Gets the maximum patches allowed after a snapshot.</summary>
    public int MaximumPatchCount { get; }
    /// <summary>Gets the maximum age of the most recent snapshot.</summary>
    public TimeSpan MaximumSnapshotAge { get; }

    /// <summary>Determines whether patch count or elapsed time requires a complete snapshot.</summary>
    /// <param name="patchesSinceSnapshot">Number of patches emitted since the last snapshot.</param>
    /// <param name="lastSnapshotAtUtc">Time of the last snapshot.</param>
    /// <param name="nowUtc">Current time.</param>
    /// <returns><see langword="true"/> when a snapshot should be emitted.</returns>
    public bool ShouldEmitSnapshot(
        int patchesSinceSnapshot,
        DateTimeOffset lastSnapshotAtUtc,
        DateTimeOffset nowUtc)
    {
        if (patchesSinceSnapshot < 0)
            throw new ArgumentOutOfRangeException(nameof(patchesSinceSnapshot));
        return patchesSinceSnapshot >= MaximumPatchCount ||
               nowUtc.ToUniversalTime() - lastSnapshotAtUtc.ToUniversalTime() >= MaximumSnapshotAge;
    }
}
