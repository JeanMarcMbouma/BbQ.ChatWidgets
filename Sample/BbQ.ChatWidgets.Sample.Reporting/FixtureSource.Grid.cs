using System.Text.Json;
using BbQ.ChatWidgets.Reporting;

sealed partial class FixtureSource
{
    private static ReportColumn[] FulfilmentColumns(bool editable) =>
    [
        new("label", "Order"), new("placed", "Placed"), new("customer", "Customer"),
        new("warehouse", "Warehouse"), new("channel", "Channel"), new("status", "Status"),
        new("units", "Units"), new("value", "Order value"), new("review", "Review note", Editable: editable)
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
        var scale = ValueScale(request.Query);
        var rows = ordered.ThenBy(order => order.Index).Skip(request.Offset).Take(request.Limit)
            .Select(order => new ReportGridRow(order.Label, order.ToRow(scale))).ToArray();
        return ValueTask.FromResult(new ReportGridPage(matching.Length, rows));
    }

    private static IReadOnlyList<ReportRow> RunFulfilment(ReportScope scope, ReportQuery query, int limit)
    {
        var orders = FulfilmentOrders(scope, query);
        var scale = ValueScale(query);
        if (query.GroupBy is null)
            return [new("Total", orders.Sum(order => order.Value) / scale)];

        if (query.GroupBy is not ("order" or "paged-order"))
            return RunComparison(orders, query.GroupBy, scale).Take(limit).ToArray();

        return orders.OrderByDescending(order => order.Day).ThenBy(order => order.Index).Take(limit)
            .Select(order => order.ToRow(scale)).ToArray();
    }

    public ValueTask<IReadOnlyList<ReportInputOption>> GetInputOptionsAsync(
        ReportScope scope, ReportInputOptionsRequest request, int limit, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return ValueTask.FromResult<IReadOnlyList<ReportInputOption>>(WarehouseOptions(scope, request).Take(limit)
            .Select(warehouse => new ReportInputOption(ReportInputValue.FromText(warehouse), warehouse)).ToArray());
    }

    public ValueTask<bool> IsInputValueAvailableAsync(ReportScope scope, ReportInputOptionsRequest request,
        ReportInputValue value, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return ValueTask.FromResult(value.Text is { } warehouse && WarehouseOptions(scope, request).Contains(warehouse, StringComparer.Ordinal));
    }

    private static string[] WarehouseOptions(ReportScope scope, ReportInputOptionsRequest request) =>
        request.Dataset == "fulfilment" && request.Input == "warehouse" && request.To >= First && request.From <= Last
            ? AvailableWarehouses(scope) : [];

    private static string[] AvailableWarehouses(ReportScope scope) => scope.Tenant == "north" ? Warehouses : Warehouses[2..];

    private static IEnumerable<FulfilmentOrder> FulfilmentOrders(ReportScope scope, ReportQuery query)
    {
        var north = scope.Tenant == "north";
        var warehouse = query.Inputs?.FirstOrDefault(selection => selection.Id == "warehouse")?.Value.Text;
        var channel = query.Inputs?.FirstOrDefault(selection => selection.Id == "channel")?.Value.Text;
        var large = query.GroupBy is not (null or "order");
        var warehouses = AvailableWarehouses(scope);
        var count = large ? (north ? 2400 : 720) : (north ? 96 : 36);
        var prefix = north ? "N" : "S";
        return Enumerable.Range(0, count)
            .Select(index => CreateOrder(index, north, prefix, warehouses))
            .Where(order => order.Day >= query.From && order.Day <= query.To &&
                (warehouse is null || order.Warehouse == warehouse) &&
                (channel is null || order.Channel == channel));
    }

    private static FulfilmentOrder CreateOrder(int index, bool north, string prefix, string[] warehouses)
    {
        var warehouseIndex = north ? (index % 24) switch { < 9 => 0, < 15 => 1, < 19 => 2, _ => 3 }
            : (index / 3) % warehouses.Length;
        var dateOffset = index % 14;
        var statusWeight = (index * 7 + index / 8) % 16;
        var deliveredWeight = dateOffset % 7 < 5 ? 9 : 6;
        var statusIndex = statusWeight < deliveredWeight ? 0 : 1 + (statusWeight - deliveredWeight) % 3;
        var units = 1 + index * 7 % 16 + index / 16 * 11 % 17;
        var value = 18.50m + index * 137 % 1150 + index % 4 * .25m + warehouseIndex * 96m;

        return new(index, $"{prefix}-{1001 + index}", First.AddDays(dateOffset),
            $"Customer {1 + index * 13 % 38:00}", warehouses[warehouseIndex],
            Channels[index % Channels.Length], Statuses[statusIndex], units, value);
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

        public ReportRow ToRow(decimal scale) => new(Label, Value / scale, new Dictionary<string, JsonElement>
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
