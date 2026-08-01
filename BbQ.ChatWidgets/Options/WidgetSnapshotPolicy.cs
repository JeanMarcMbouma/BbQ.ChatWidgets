namespace BbQ.ChatWidgets.Options;

/// <summary>
/// Bounds patch-chain length and age by requiring periodic complete snapshots.
/// </summary>
public sealed record WidgetSnapshotPolicy
{
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

    public int MaximumPatchCount { get; }
    public TimeSpan MaximumSnapshotAge { get; }

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
