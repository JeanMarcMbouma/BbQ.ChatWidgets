# Reporting with Angular, .NET and ChatWidgets

Run a built-in report or dashboard over sample orders, then build your own from the same dataset. A report has one tile and a dashboard can combine up to eight. Choose the widget, metric, grouping, and date range for each tile. Reorder the tiles before saving. Save a custom definition, reopen it, and edit it. The built-in definitions can be used as starting points.

ChatWidgets renders the dashboard, shared filters, charts, timelines, tables, metrics, and grids. Open **Reporting widget gallery** for examples. Tiles with the same query share one data source and can be filtered together. The sample scatter plot uses result position as its X coordinate. The timeline uses the dates from the day grouping. The sample uses Angular, ASP.NET Core, and the existing ChatWidgets packages. It requires no chart library, reporting server, database, AI provider, or API key.

## Run the sample

Open **Order value analysis** to see how the same daily order values look as a running total, a ranked contribution chart, and a frequency distribution. All three chart types are also available in the editor.

Open **Order value over time** to compare the same daily values as a time-series line, area, step, and column chart. Select a point or column to inspect its source row.

Open **Order fulfilment grid** for a 96-order register. Search by customer or order, group by warehouse or status, sort numerically by units or value, choose visible columns, select across pages, and export the matching rows. Review notes are editable for the current preview. The fixture resets those edits when the report runs again.

Open **Warehouse operations** for the server-paged variation. It has 2,400 orders in the default demo tenant. Search, sort, or filter by warehouse, channel, or status and page through the full result without loading all rows into the browser. Row selections follow stable order keys across pages.

Click a chart mark or click a grid row to open the host application's details dialog. The **View** button on the row offers the same action by keyboard. Row checkboxes still control selection.

Use the .NET 8 SDK and Node.js 22.12+ or 24. Build the workspace packages from the repository root.

```sh
npm --prefix js ci
npm --prefix js run build
npm --prefix js-angular ci
npm --prefix js-angular run build
```

From this sample directory, build the client and run the host.

```sh
npm --prefix ClientApp ci
npm --prefix ClientApp run build
dotnet run
```

The project in this directory serves the Angular build from `wwwroot` and uses the reporting API from `BbQ.ChatWidgets` and the workspace from `@bbq-chat/widgets-angular`. The launch profile sets the Development environment and binds to loopback over HTTP. Open [http://127.0.0.1:5107](http://127.0.0.1:5107). If you override the URL with `dotnet run -- --urls`, set `REPORTING_SAMPLE_URL` to the same URL when running the API tests.

The host stops on startup outside Development. It uses fixture identities and stores saved definitions in memory for the life of the process. The browser sample sends the demo account header automatically. The reporting module gets identities from the ASP.NET Core principal.

## Integrate with an existing app

See the [reporting integration guide](../../docs_src/widgets/REPORTING.md) for service registration, mounting the packaged Angular workspace, and building a custom viewer. The sample's [Program.cs](Program.cs) and [main.ts](ClientApp/src/main.ts) show the application-specific data, persistence, and authentication setup.

Presets and saved definitions use the same query contract. Definitions contain stable dataset, metric, and grouping IDs and inclusive dates. The backend validates these against the caller's catalog. Snapshot execution caps requests at 366 days and results at 100 rows. Paged grids request bounded slices from the source.

## Verify

With the sample running, run `node --test tests/api.test.mjs`. The checks cover built-in definitions, scoped results, private saved dashboards, custom reports, and invalid queries.

Open **Reporting widget gallery**, filter orders by status, and check that the bar and pie update together. Search, sort, and page through the data grid. Create a custom dashboard with a filter and chart using the same query, reorder the tiles, save it, and reopen it.
