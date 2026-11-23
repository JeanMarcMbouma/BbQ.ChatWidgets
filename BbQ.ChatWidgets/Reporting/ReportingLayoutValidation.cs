namespace BbQ.ChatWidgets.Reporting;

public static partial class ReportingEndpoints
{
    private const int LayoutTileLimit = 32;

    private static string? LayoutError(ReportDefinition definition, ReportLayout layout)
    {
        var tileIds = new HashSet<string>(StringComparer.Ordinal);
        if (definition.Tiles.Any(tile => tile?.Id is not { } id || !ValidInputId(id) || !tileIds.Add(id)))
            return "Choose a distinct ID for each tile in the layout.";

        if (layout.Modes is not { Length: >= 1 and <= 8 })
            return "Choose between one and eight display modes.";

        bool ValidTiles(string[]? ids) => ids is { Length: >= 1 and <= 4 }
            && ids.All(tileIds.Contains) && ids.Distinct(StringComparer.Ordinal).Count() == ids.Length;

        var modes = new HashSet<string>(StringComparer.Ordinal);
        foreach (var mode in layout.Modes)
        {
            if (mode is null || !ValidInputId(mode.Id) || !modes.Add(mode.Id) || !ValidTitle(mode.Label) ||
                mode.Placements is not { Length: >= 1 and <= 16 })
                return "Choose distinct display modes with a label and between one and sixteen cards.";

            var cards = new HashSet<string>(StringComparer.Ordinal);
            foreach (var card in mode.Placements)
            {
                if (card is null || !ValidInputId(card.Id) || !cards.Add(card.Id) ||
                    (card.Region is { } region && !ValidInputId(region)) ||
                    card.ColumnSpan is < 1 or > 12 || card.RowSpan is < 1 or > 4)
                    return "Choose distinct cards with valid regions and spans.";

                if (card.Variants is null)
                {
                    if (card.DefaultVariantId is not null || !ValidTiles(card.TileIds))
                        return "Each card needs between one and four distinct tiles from this report.";
                    continue;
                }

                var variants = new HashSet<string>(StringComparer.Ordinal);
                if (card.TileIds is not null || card.Variants.Length is < 2 or > 8 ||
                    card.Variants.Any(variant => variant is null || !ValidInputId(variant.Id) ||
                        !variants.Add(variant.Id) || !ValidTitle(variant.Label) || !ValidTiles(variant.TileIds)) ||
                    (card.DefaultVariantId is { } defaultVariant && !variants.Contains(defaultVariant)))
                    return "Choose between two and eight distinct card variants with valid tiles and an available default.";
            }
        }

        return layout.DefaultModeId is { } defaultMode && !modes.Contains(defaultMode)
            ? "Choose a default mode from this report." : null;
    }
}
