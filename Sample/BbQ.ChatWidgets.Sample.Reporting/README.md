# Reporting with Angular, .NET and ChatWidgets

Run a built-in report or dashboard over sample orders, then build your own from the same dataset. A report has one tile and a dashboard can combine up to eight. Choose a metric, grouping, date range, and table or chart for each tile. Save a custom definition, reopen it, and edit it. The built-in definitions can be used as starting points.

ChatWidgets renders each result as a registered Angular component. A tile can switch between a native SVG chart and a table, sort by value, and emit a row-selection action to its dashboard. The sample uses Angular, ASP.NET Core, and the existing ChatWidgets packages. It requires no chart library, reporting server, database, AI provider, or API key.

## Run the sample

From this directory, use the .NET 8 SDK and Node.js 22.12+ or 24.

```sh
npm --prefix ClientApp ci
npm --prefix ClientApp run build
ASPNETCORE_ENVIRONMENT=Development dotnet run --project Host/Sample.csproj --no-launch-profile -- --urls http://127.0.0.1:5097
```

On PowerShell, set `$env:ASPNETCORE_ENVIRONMENT = 'Development'` before starting the host. Then open [http://127.0.0.1:5097](http://127.0.0.1:5097).

The host stops on startup outside Development. It uses fixture identities and stores saved definitions in memory for the life of the process. The browser sample sends the demo account header automatically. The reporting module gets identities from the ASP.NET Core principal.

## Integrate with an existing app

1. Reference [Reporting.csproj](Reporting/Reporting.csproj) from your ASP.NET Core host. Implement [IReportingSource and IReportingStore](Reporting/Contracts.cs) against your application services. Register both with dependency injection and call `app.MapReporting(policy: "CanUseReporting")` with your application's authorization policy. Use your existing authentication, authorization, and request protection for the endpoints.
2. In your source, derive the tenant and user from the authenticated principal and the app's membership rules. Advertise only the datasets, metrics, groupings, and presets the caller may use. Apply the same authorization scope to every aggregate query at the data source. In your store, scope every operation by tenant **and** user. Persist definitions and stable IDs with your existing database. The sample defaults to private saved definitions and last-write-wins editing.
3. Copy [the reusable Angular reporting folder](ClientApp/src/reporting/) and route to `ReportingComponent`. Use the host's configured `HttpClient`, authentication interceptors, and ChatWidgets packages. Set `REPORTING_API` if your endpoint prefix differs. The sample's [main.ts](ClientApp/src/main.ts) is fixture bootstrap code. Supply your app's own theme and localization for UI strings and catalog labels.
4. The result widget is independent of the editor. In an existing widget surface, register it with `registerReportResultWidget(registry)`, construct a `ReportResultWidget` from an authorized report response, and bind it to `bbq-widget-renderer`. Handle `report-row-selected` to drive actions such as drill-through. The backend remains the source of report data and permissions.

Presets and saved definitions use the same query contract and execution endpoint. Definitions contain stable dataset, metric, and grouping IDs and inclusive dates. The backend validates these against the caller's catalog and caps requests at 366 days and results at 100 groups. Source implementations should aggregate in the database and use the provided lookahead limit to detect oversized results. Choose a reporting time zone in the source before mapping date filters to timestamps.

## Verify

With the sample running, run `node --test tests/api.test.mjs`. The checks cover built-in definitions, scoped results, private saved dashboards, custom reports, and invalid queries.

In the UI, open **Order overview**, select a chart bar, then switch to the table and sort by value. Create a custom dashboard with two tiles, save it, reload the page, and reopen the saved dashboard.
