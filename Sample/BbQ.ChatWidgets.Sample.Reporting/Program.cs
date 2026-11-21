using System.Collections.Concurrent;
using System.Security.Claims;
using System.Text.Encodings.Web;
using BbQ.ChatWidgets.Reporting;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);
if (!builder.Environment.IsDevelopment())
    throw new InvalidOperationException("The sample uses fixture identities and can only run in Development.");

builder.Services.AddAuthentication("Fixture").AddScheme<AuthenticationSchemeOptions, FixtureAuthentication>(
    "Fixture", _ => { });
builder.Services.AddAuthorization();
builder.Services.AddSingleton<IReportingStore, MemoryStore>();
builder.Services.AddBbQReporting<FixtureSource, MemoryStore>();
var app = builder.Build();
if (!app.Environment.WebRootFileProvider.GetFileInfo("index.html").Exists)
    app.Logger.LogWarning("Reporting client is missing. Run npm --prefix ClientApp ci and npm --prefix ClientApp run build from the sample directory.");

app.UseAuthentication();
app.UseAuthorization();
app.MapBbQReporting();
app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = context =>
    {
        if (context.Context.Request.Path == "/index.html")
            context.Context.Response.Headers.CacheControl = "no-cache";
    }
});
app.Run();

sealed class FixtureAuthentication(IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger, UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var account = Request.Headers["X-Demo-Account"].ToString();
        Claim[] claims = account switch
        {
            "demo" => [new(ClaimTypes.NameIdentifier, "demo"), new("tenant", "north")],
            "colleague" => [new(ClaimTypes.NameIdentifier, "colleague"), new("tenant", "north")],
            "other" => [new(ClaimTypes.NameIdentifier, "demo"), new("tenant", "south")],
            _ => []
        };
        return Task.FromResult(claims.Length == 0 ? AuthenticateResult.NoResult() :
            AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(new ClaimsIdentity(claims, Scheme.Name)), Scheme.Name)));
    }
}

sealed partial class FixtureSource : IReportingGridSource
{
    private static readonly ReportDataset[] Datasets =
    [
        new("orders", "Orders", [new("count", "Order count"), new("revenue", "Order value")],
            [new("status", "Status"), new("day", "Day") { DateField = "label" }]),
        new("fulfilment", "Order fulfilment", [new("revenue", "Order value")],
        [
            new("order", "Individual orders", FulfilmentColumns(editable: true)),
            new("paged-order", "Warehouse orders", FulfilmentColumns(editable: false), FulfilmentCapabilities())
        ])
    ];

    private static readonly DateOnly First = new(2026, 11, 1);
    private static readonly DateOnly Last = new(2026, 11, 14);

    private static readonly ReportTile Volume = new("Orders by status", "bar", new("orders", "count", "status", First, Last));
    private static readonly ReportTile Value = new("Order value by day", "table", new("orders", "revenue", "day", First, Last));
    private static readonly string[] Warehouses = ["Bristol", "Leeds", "London", "Manchester"];
    private static readonly string[] Channels = ["Retail", "Trade", "Online"];
    private static readonly string[] Statuses = ["Delivered", "Dispatched", "Picking", "On hold"];
    private static readonly SavedReport[] Presets =
    [
        new("orders-by-status", new("Orders by status", "report", [Volume])),
        new("order-overview", new("Order overview", "dashboard", [Volume, Value with { View = "grid" }])),
        new("fulfilment-grid", new("Order fulfilment grid", "report",
        [
            new("Order register", "grid", new("fulfilment", "revenue", "order", First, Last))
        ])),
        new("warehouse-grid", new("Warehouse operations", "report",
        [
            new("Warehouse orders", "grid", new("fulfilment", "revenue", "paged-order", First, Last))
        ])),
        new("order-analysis", new("Order value analysis", "dashboard",
        [
            Value with { Title = "Daily contribution to total value", View = "waterfall" },
            Value with { Title = "Largest daily contributions", View = "pareto" },
            Value with { Title = "Distribution of daily order value", View = "histogram" }
        ])),
        new("order-time-series", new("Order value over time", "dashboard",
        [
            Value with { Title = "Daily trend", View = "time-line" },
            Value with { Title = "Daily value area", View = "area" },
            Value with { Title = "Daily value steps", View = "step" },
            Value with { Title = "Daily value columns", View = "time-column" }
        ])),
        new("reporting-widgets", new("Reporting widget gallery", "dashboard",
        [
            Volume,
            Volume with { Title = "Status share", View = "pie" },
            Value with { Title = "Daily order value", View = "line" },
            Value with { Title = "Daily position and value", View = "scatter" },
            Value with { Title = "Reporting dates", View = "timeline" },
            Value with { Title = "Daily data grid", View = "grid" },
            Value,
            Value with { Title = "Total order value", View = "metric" }
        ]))
    ];

    public ValueTask<ReportScope?> ResolveScopeAsync(ClaimsPrincipal user, CancellationToken cancellation)
    {
        var tenant = user.FindFirstValue("tenant");
        var id = user.FindFirstValue(ClaimTypes.NameIdentifier);
        return ValueTask.FromResult<ReportScope?>(tenant is null || id is null ? null : new(tenant, id));
    }

    public ValueTask<IReadOnlyList<ReportDataset>> GetDatasetsAsync(ReportScope scope, CancellationToken cancellation) =>
        ValueTask.FromResult<IReadOnlyList<ReportDataset>>(Datasets);

    public ValueTask<IReadOnlyList<SavedReport>> GetPresetsAsync(ReportScope scope, CancellationToken cancellation) =>
        ValueTask.FromResult<IReadOnlyList<SavedReport>>(Presets);

    public ValueTask<IReadOnlyList<ReportRow>> RunAsync(
        ReportScope scope, ReportQuery query, int limit, CancellationToken cancellation)
    {
        cancellation.ThrowIfCancellationRequested();
        if (query.Dataset == "fulfilment")
            return ValueTask.FromResult(RunFulfilment(scope, query, limit));

        var count = scope.Tenant == "north" ? 24 : 8;
        var rows = Enumerable.Range(0, count)
            .Select(i => (Day: First.AddDays(i % 14), Status: i % 4 == 0 ? "Pending" : "Complete", Value: 20m + i * 5m))
            .Where(row => row.Day >= query.From && row.Day <= query.To)
            .GroupBy(row => query.GroupBy switch
            {
                "status" => row.Status,
                "day" => row.Day.ToString("yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture),
                _ => "Total"
            }, StringComparer.Ordinal)
            .OrderBy(group => group.Key, StringComparer.Ordinal)
            .Take(limit)
            .Select(group => new ReportRow(group.Key, query.Metric == "count" ? group.Count() : group.Sum(row => row.Value)))
            .ToArray();

        return ValueTask.FromResult<IReadOnlyList<ReportRow>>(rows);
    }

}

sealed class MemoryStore : IReportingStore
{
    private readonly ConcurrentDictionary<(ReportScope Scope, string Id), SavedReport> reports = new();

    public ValueTask<IReadOnlyList<SavedReport>> ListAsync(ReportScope scope, CancellationToken cancellation) =>
        ValueTask.FromResult<IReadOnlyList<SavedReport>>(reports.Where(item => item.Key.Scope == scope)
            .Select(item => item.Value).OrderBy(report => report.Definition.Title, StringComparer.Ordinal).ToArray());

    public ValueTask<SavedReport> CreateAsync(ReportScope scope, ReportDefinition definition, CancellationToken cancellation)
    {
        var report = new SavedReport(Guid.NewGuid().ToString("N"), definition);
        if (!reports.TryAdd((scope, report.Id), report))
            throw new InvalidOperationException("Could not allocate a report ID.");
        return ValueTask.FromResult(report);
    }

    public ValueTask<bool> UpdateAsync(ReportScope scope, string id, ReportDefinition definition, CancellationToken cancellation)
    {
        var key = (scope, id);
        while (reports.TryGetValue(key, out var current))
        {
            if (reports.TryUpdate(key, new(id, definition), current))
                return ValueTask.FromResult(true);
        }
        return ValueTask.FromResult(false);
    }

    public ValueTask<bool> DeleteAsync(ReportScope scope, string id, CancellationToken cancellation) =>
        ValueTask.FromResult(reports.TryRemove((scope, id), out _));
}
