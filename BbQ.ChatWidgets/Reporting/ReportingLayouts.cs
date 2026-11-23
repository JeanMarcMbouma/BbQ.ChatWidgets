namespace BbQ.ChatWidgets.Reporting;

/// <summary>A resolved placement and its positions in the source definition.</summary>
public sealed record ResolvedReportPlacement(ReportPlacement Placement, int[] TileIndices, string? VariantId);

/// <summary>The selected display mode and its resolved placements.</summary>
public sealed record ResolvedReportLayout(ReportMode Mode, ResolvedReportPlacement[] Placements);

/// <summary>Resolves the visible tiles of an authored report layout.</summary>
public static class ReportingLayouts
{
    /// <summary>Choose a mode and its variants, falling back to authored defaults.</summary>
    public static ResolvedReportLayout? Resolve(ReportDefinition definition, string? modeId = null,
        IReadOnlyDictionary<string, string>? variants = null)
    {
        if (definition.Layout is not { Modes.Length: > 0 } layout)
            return null;

        var mode = layout.Modes.FirstOrDefault(item => item.Id == modeId)
            ?? layout.Modes.FirstOrDefault(item => item.Id == layout.DefaultModeId)
            ?? layout.Modes[0];
        var indices = new Dictionary<string, int>(StringComparer.Ordinal);
        for (var index = 0; index < definition.Tiles.Length; index++)
        {
            if (definition.Tiles[index].Id is { } id)
                indices.TryAdd(id, index);
        }

        return new(mode, mode.Placements.Select(placement =>
        {
            var selected = modeId == mode.Id && variants?.TryGetValue(placement.Id, out var value) == true ? value : null;
            var variant = placement.Variants?.FirstOrDefault(item => item.Id == selected)
                ?? placement.Variants?.FirstOrDefault(item => item.Id == placement.DefaultVariantId)
                ?? placement.Variants?.FirstOrDefault();
            var tileIndices = (variant?.TileIds ?? placement.TileIds ?? [])
                .Where(indices.ContainsKey).Select(id => indices[id]).ToArray();
            return new ResolvedReportPlacement(placement, tileIndices, variant?.Id);
        }).ToArray());
    }
}
