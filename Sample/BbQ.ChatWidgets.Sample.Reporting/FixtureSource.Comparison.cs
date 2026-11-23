using System.Globalization;
using System.Text.Json;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Reporting;

sealed partial class FixtureSource
{
    private const string ValueScaleInput = "value-scale";
    private const decimal WarehouseTarget = 350_000m;
    private const int UnitBandWidth = 4;

    private static ReportField[] ComparisonDimensions() =>
    [
        new("overview", "Overview"),
        new("day", "Business date") { DateField = "label" },
        new("day-status", "Business date and fulfilment stage",
            [new("stage", "Fulfilment stage"), new("orderCount", "Order count")]) { DateField = "label" },
        new("status", "Order status", [new("orderCount", "Order count")]),
        new("warehouse", "Warehouse",
            [new("orderCount", "Order count"), new("averageValue", "Average order value"), new("target", "Target order value"), new("deliveredValue", "Delivered order value")]),
        new("unit-band", "Number of items per order",
            [new("binStart", "Lower bin edge"), new("orderCount", "Order count")])
    ];

    private static ReportInput ValueScaleParameter() =>
        new(ValueScaleInput, "Display scale", ReportInputRole.Parameter, ReportInputType.Integer)
        {
            Options =
            [
                new(ReportInputValue.FromInteger(1), "Pounds"),
                new(ReportInputValue.FromInteger(1000), "Thousands of pounds")
            ],
            DefaultValue = ReportInputValue.FromInteger(1)
        };

    private static decimal ValueScale(ReportQuery query) =>
        query.Inputs?.FirstOrDefault(selection => selection.Id == ValueScaleInput)?.Value.Integer ?? 1;

    private static SavedReport OrderComparison()
    {
        ReportTile Tile(string id, string title, string view, string grouping) =>
            new(title, view, new("fulfilment", "revenue", grouping, First, Last)) { Id = id };

        return new("order-comparison", new("Order comparison", "dashboard",
        [
            Tile("value", "Total order value", "metric", "overview"),
            Tile("stages", "Delivered and open orders by date", "time-column", "day-status") with
            {
                Presentation = new()
                {
                    DateField = "label",
                    DateAxisLabel = "Business date",
                    ValueField = "orderCount",
                    SeriesField = "stage",
                    Colors = [new("Delivered", "#147c68") { DarkColor = "#65c4ad" }, new("Open", "#a45c16") { DarkColor = "#ffc478" }]
                }
            },
            Tile("status", "Share of orders by status", "pie", "status") with
            {
                Presentation = new() { ValueField = "orderCount", PieHole = .55 }
            },
            Tile("warehouse", "Warehouse order value against target", "column", "warehouse") with
            {
                Presentation = new()
                {
                    Series = [new("value", "Order value"), new("deliveredValue", "Delivered value")],
                    Colors = [new("value", "#154b91") { DarkColor = "#90bff3" }, new("deliveredValue", "#147c68") { DarkColor = "#65c4ad" }],
                    ReferenceLines = [new(ReportingAxis.Y, "Period target") { Field = "target" }]
                },
                InputBinding = new("warehouse", "label")
            },
            Tile("scatter", "Order count vs average value by warehouse", "scatter", "warehouse") with
            {
                Presentation = new() { XField = "averageValue", ValueField = "orderCount", SizeField = "value" },
                InputBinding = new("warehouse", "label")
            },
            Tile("items", "Items per order", "histogram", "unit-band") with
            {
                Presentation = new()
                {
                    XField = "binStart",
                    ValueField = "orderCount",
                    BinWidth = UnitBandWidth,
                    ReferenceLines = [new(ReportingAxis.X, "Bulk order threshold") { Value = 17 }]
                }
            },
            Tile("orders", "Order details", "grid", "paged-order"),
            Tile("trend", "Daily order value", "time-line", "day")
        ])
        {
            Filters = [new("warehouse")],
            Layout = new([
                new("overview", "Overview", [
                    new("summary") { Region = "summary", TileIds = ["value", "trend"] },
                    new("stages") { ColumnSpan = 8, TileIds = ["stages"] },
                    new("status") { ColumnSpan = 4, TileIds = ["status"] },
                    new("orders") { TileIds = ["orders"] },
                ]),
                new("warehouse", "Warehouse analysis", [
                    new("summary") { Region = "summary", TileIds = ["value", "trend"] },
                    new("comparison") { ColumnSpan = 8, DefaultVariantId = "value", Variants = [
                        new("value", "Orders by warehouse", ["warehouse"]),
                        new("items", "Items per order", ["items"]),
                    ] },
                    new("scatter") { ColumnSpan = 4, TileIds = ["scatter"] },
                    new("orders") { TileIds = ["orders"] },
                ]),
            ]) { DefaultModeId = "overview" },
        });
    }

    private static IEnumerable<ReportRow> RunComparison(IEnumerable<FulfilmentOrder> orders,
        string grouping, decimal scale) => grouping switch
    {
        "overview" => [new("Total", orders.Sum(order => order.Value) / scale)],
        "day" => orders.GroupBy(order => order.Day).OrderBy(group => group.Key)
            .Select(group => new ReportRow(group.Key.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture), group.Sum(order => order.Value) / scale)),
        "day-status" => orders
            .GroupBy(order => (order.Day, Stage: order.Status == "Delivered" ? "Delivered" : "Open"))
            .OrderBy(group => group.Key.Day)
            .ThenBy(group => group.Key.Stage, StringComparer.Ordinal)
            .Select(group => new ReportRow(group.Key.Day.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                group.Sum(order => order.Value) / scale, OrderCountFields(group, ("stage", group.Key.Stage)))),
        "status" => orders.GroupBy(order => order.Status)
            .OrderBy(group => group.Key, StringComparer.Ordinal)
            .Select(group => new ReportRow(group.Key, group.Sum(order => order.Value) / scale, OrderCountFields(group))),
        "warehouse" => orders.GroupBy(order => order.Warehouse)
            .OrderByDescending(group => group.Sum(order => order.Value))
            .ThenBy(group => group.Key, StringComparer.Ordinal)
            .Select(group => new ReportRow(group.Key, group.Sum(order => order.Value) / scale, OrderCountFields(group,
                ("averageValue", group.Average(order => order.Value) / scale), ("target", WarehouseTarget / scale),
                ("deliveredValue", group.Where(order => order.Status == "Delivered").Sum(order => order.Value) / scale)))),
        "unit-band" => orders.GroupBy(order => ((order.Units - 1) / UnitBandWidth) * UnitBandWidth + 1)
            .OrderBy(group => group.Key)
            .Select(group => new ReportRow($"{group.Key} to {group.Key + UnitBandWidth - 1}",
                group.Sum(order => order.Value) / scale, OrderCountFields(group, ("binStart", group.Key)))),
        _ => throw new ArgumentException("Unknown comparison grouping.", nameof(grouping))
    };

    private static Dictionary<string, JsonElement> OrderCountFields(IEnumerable<FulfilmentOrder> orders,
        params (string Field, object Value)[] extra)
    {
        var fields = new Dictionary<string, JsonElement> { ["orderCount"] = JsonSerializer.SerializeToElement(orders.Count()) };
        foreach (var (field, value) in extra)
            fields.Add(field, JsonSerializer.SerializeToElement(value));
        return fields;
    }
}
