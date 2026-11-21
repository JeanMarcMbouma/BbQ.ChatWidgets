using System.Text.Json;
using BbQ.ChatWidgets.Reporting;

sealed partial class FixtureSource
{
    private static ReportColumn[] FulfilmentColumns(bool editable) =>
    [
        new("label", "Order"), new("placed", "Placed"), new("customer", "Customer"),
        new("warehouse", "Warehouse"), new("channel", "Channel"), new("status", "Status"),
        new("units", "Units"), new("value", "Value (GBP)"), new("review", "Review note", Editable: editable)
    ];

    private static ReportGridCapabilities FulfilmentCapabilities() => new(
        ["label", "customer", "warehouse", "channel", "status"],
        ["label", "placed", "customer", "warehouse", "channel", "status", "units", "value"],
        ["warehouse", "channel", "status"]);

    public ValueTask<ReportGridPage> GetPageAsync(
        ReportScope scope, ReportGridPageRequest request, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var orders = FulfilmentOrders(scope, request.Query);
        if (request.Search?.Trim() is { Length: > 0 } search)
            orders = orders.Where(order => order.Matches(search));
        foreach (var filter in request.Filters ?? [])
            orders = orders.Where(order => string.Equals(order.Field(filter.Field), filter.Value, StringComparison.OrdinalIgnoreCase));

        var matching = orders.ToArray();
        var ordered = request.SortField is null
            ? matching.OrderByDescending(order => order.Day)
            : request.Descending
                ? matching.OrderByDescending(order => order.SortValue(request.SortField))
                : matching.OrderBy(order => order.SortValue(request.SortField));
        var rows = ordered.ThenBy(order => order.Index).Skip(request.Offset).Take(request.Limit)
            .Select(order => new ReportGridRow(order.Label, order.ToRow())).ToArray();
        return ValueTask.FromResult(new ReportGridPage(matching.Length, rows));
    }

    private static IReadOnlyList<ReportRow> RunFulfilment(ReportScope scope, ReportQuery query, int limit)
    {
        var orders = FulfilmentOrders(scope, query);
        if (query.GroupBy is null)
            return [new("Total", orders.Sum(order => order.Value))];

        return orders.OrderByDescending(order => order.Day).ThenBy(order => order.Index).Take(limit)
            .Select(order => order.ToRow()).ToArray();
    }

    private static IEnumerable<FulfilmentOrder> FulfilmentOrders(ReportScope scope, ReportQuery query)
    {
        var north = scope.Tenant == "north";
        var large = query.GroupBy == "paged-order";
        var count = large ? (north ? 2400 : 720) : (north ? 96 : 36);
        var prefix = north ? "N" : "S";
        return Enumerable.Range(0, count)
            .Select(index => new FulfilmentOrder(index, $"{prefix}-{1001 + index}", First.AddDays(index % 14),
                $"Customer {1 + index * 13 % 38:00}", Warehouses[(index / 3) % Warehouses.Length],
                Channels[index % Channels.Length], Statuses[(index + index / 8) % Statuses.Length],
                1 + index * 7 % 32, 18.50m + index * 137 % 1150 + index % 4 * .25m))
            .Where(order => order.Day >= query.From && order.Day <= query.To);
    }

    private sealed record FulfilmentOrder(int Index, string Label, DateOnly Day, string Customer, string Warehouse,
        string Channel, string Status, int Units, decimal Value)
    {
        public string Field(string field) => field switch
        {
            "label" => Label,
            "customer" => Customer,
            "warehouse" => Warehouse,
            "channel" => Channel,
            "status" => Status,
            _ => throw new ArgumentException("Unknown fulfilment field.", nameof(field))
        };

        public IComparable SortValue(string field) => field switch
        {
            "label" => Index,
            "placed" => Day,
            "units" => Units,
            "value" => Value,
            _ => Field(field)
        };

        public bool Matches(string search) =>
            Label.Contains(search, StringComparison.OrdinalIgnoreCase) ||
            Customer.Contains(search, StringComparison.OrdinalIgnoreCase) ||
            Warehouse.Contains(search, StringComparison.OrdinalIgnoreCase) ||
            Channel.Contains(search, StringComparison.OrdinalIgnoreCase) ||
            Status.Contains(search, StringComparison.OrdinalIgnoreCase);

        public ReportRow ToRow() => new(Label, Value, new Dictionary<string, JsonElement>
        {
            ["placed"] = JsonSerializer.SerializeToElement(Day),
            ["customer"] = JsonSerializer.SerializeToElement(Customer),
            ["warehouse"] = JsonSerializer.SerializeToElement(Warehouse),
            ["channel"] = JsonSerializer.SerializeToElement(Channel),
            ["status"] = JsonSerializer.SerializeToElement(Status),
            ["units"] = JsonSerializer.SerializeToElement(Units),
            ["review"] = JsonSerializer.SerializeToElement(Status == "On hold" ? "Check allocation" : "")
        });
    }
}
