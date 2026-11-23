# Reporting with Angular, .NET and ChatWidgets

Run a built-in report or dashboard over sample orders, then build your own from the same dataset. A report has one tile and a dashboard can combine up to eight. Choose the widget, metric, grouping, and date range for each tile. Reorder the tiles before saving. Save a custom definition, reopen it, and edit it. The built-in definitions can be used as starting points.

ChatWidgets renders the dashboard, shared filters, charts, timelines, tables, metrics, and grids. Open **Reporting widget gallery** for examples. Tiles with the same query share one data source and can be filtered together. The sample scatter plot uses result position as its X coordinate. The timeline uses the dates from the day grouping. The sample uses Angular, ASP.NET Core, and the existing ChatWidgets packages. It requires no chart library, reporting server, database, AI provider, or API key.

## Run the sample

Open **Order value analysis** to see how the same daily order values look as a running total, a ranked contribution chart, and a frequency distribution. All three chart types are also available in the editor.

Open **Order value over time** to compare the same daily values as a time-series line, area, step, and column chart. Select a point or column to inspect its source row.

The sample opens **Order comparison** over the same 2,400 orders as the paged Warehouse operations grid. It includes clustered daily columns, a status doughnut, a warehouse target line, a bubble plot sized by order value, and an item-count histogram built from weighted bins.

Choose a warehouse, set the business date range, or change the value display scale to rerun the dashboard. Click or use Enter on a warehouse bar or bubble to filter the charts and order details together. The value scale leaves order counts and item-count bands unchanged. Use **Clear all filters** to restore the sample defaults.

Open **Edit dashboard** and add **Channel** under **Report filters**. Give it a display label, move it above or below Warehouse, and save a copy. Open the saved dashboard to see the same filters in that order. Choose a channel to update the charts and grid.

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

### Add typed inputs to a dataset

The sample catalog advertises a Boolean `pending` filter and an integer `scale` parameter for Orders. It advertises a text `warehouse` filter and a business calendar for Order fulfilment. Define these with `ReportDataset.Inputs` and `ReportDataset.Calendar`. A query's optional `Inputs` array contains input IDs and typed scalar values. The source receives the validated selections and any advertised defaults when executing a query or page.

Use fixed options for values such as a display scale. Implement `IReportingInputSource` to resolve choices from the authenticated scope and date interval. The JavaScript and Angular reporting clients expose `inputOptions` for the scoped options endpoint. The workspace should show the option label and submit the value with its original type. Apply the effective filters when querying the data and apply display parameters when computing result values.

The backend supports up to 16 inputs per dataset and validates the submitted IDs, types and values. The options endpoint returns at most 200 choices. Use a date period that exposes a manageable number of choices. Implement `IReportingInputValidationSource` to check an exact scoped selection without enumerating the list during query execution. `ReportCalendar` can set a smaller inclusive date range and supply the source's current day for relative date presets.

### Compose a custom workspace

Use `ReportingClient` with a host-authenticated transport, or use the Angular `ReportingApi` with the host's HTTP interceptors. Keep the active view, shared inputs and dates in host state. Apply that state to the selected definition and compose widgets from the API calls.

```ts
import {
  ReportingClient, applyReportingState, composeReportingSnapshot,
  reportingDatePreset, setReportingInput,
} from '@bbq-chat/widgets';

const client = new ReportingClient();
const catalog = await client.catalog();
const dataset = catalog.datasets.find(item => item.id === 'fulfilment');
const warehouse = dataset?.inputs?.find(input => input.id === 'warehouse');
const preset = catalog.presets.find(item => item.id === 'fulfilment-grid');

if (!preset || !dataset?.calendar || !warehouse) {
  throw new Error('The order fulfilment report is unavailable.');
}

const dates = reportingDatePreset(dataset.calendar, 7);
if (!dates) throw new Error('Choose a report date range.');

const choices = await client.inputOptions({ dataset: dataset.id, input: warehouse.id, ...dates });
const state = setReportingInput({ dates }, warehouse, choices[0]?.value);
const definition = applyReportingState(preset.definition, catalog, state);
const snapshot = await composeReportingSnapshot(definition, catalog, query => client.run(query));
```

Render the snapshot using the widget host for your framework. For a server-paged grid, pass the effective tile query to the paged grid component and exclude that tile from snapshot composition. `applyReportingAction` can map a chart or grid action to a declared filter using its result field. Recompose from the original preset after the shared state changes so clearing a choice restores the authored selection. Custom layouts, view navigation and URL synchronization belong to the host.

Angular exports `ReportingControlsComponent` for a custom filter rail. Mount it with the catalog inputs, calendar and current state, then handle `stateChange`. The packaged workspace exposes `reportingState` and `selectedReport` inputs, with `reportingStateChange` and `selectionChange` outputs. A router host can restore these inputs from its route and write updated state back to the URL.

### Configure a tile's presentation

Set `ReportTile.Presentation` on the server, or `presentation` on the TypeScript definition, to bind the renderer to named result fields. Declare additional result fields in the selected metric or grouping's columns and return their scalar values in `ReportRow.Fields`. The standard `label`, `value`, `x` and `date` bindings are available by default.

| Visual | Presentation settings |
| --- | --- |
| Clustered bars or time columns | Use `seriesField` for one series value per result row, or use `series` to bind separate numeric fields with legend labels. |
| Date chart | Use `dateField` for the date coordinate and `dateAxisLabel` for a caption such as Business date. |
| Bubble plot | Use a scatter tile and bind `xField`, `valueField` and a nonnegative `sizeField`. |
| Doughnut | Use a pie tile with `pieHole` between 0.2 and 0.8. |
| Pre-aggregated distribution | Use a histogram with `xField` for the lower bin edge, `binWidth` for the uniform width and `valueField` for the observation count. |

Set `referenceLines` on a quantitative axis with a label and either a numeric `value` or a `field` that supplies the same numeric value across the plotted rows. A field-bound guide can reflect the caller's query parameters. The renderer also exposes chart data in text.

For example, a status share tile can be displayed as a doughnut without changing its query.

```ts
import type { ReportingTile } from '@bbq-chat/widgets';

const share: ReportingTile = {
  title: 'Order status share',
  view: 'pie',
  query: { dataset: 'orders', metric: 'count', groupBy: 'status', from: '2026-11-01', to: '2026-11-14' },
  presentation: { pieHole: 0.52 },
};
```

An optional `InputBinding` or `inputBinding` names an advertised filter and the result field that provides its typed value. A custom workspace can pass that binding and the emitted action to `applyReportingAction`.

## Verify

With the sample running, run `node --test tests/api.test.mjs`. The checks cover built-in definitions, scoped results, private saved dashboards, custom reports, and invalid queries.

Open **Reporting widget gallery**, filter orders by status, and check that the bar and pie update together. Search, sort, and page through the data grid. Create a custom dashboard with a filter and chart using the same query, reorder the tiles, save it, and reopen it.
