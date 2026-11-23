# Reports and dashboards

ChatWidgets supports both inline reporting widgets and a reporting workspace backed by your application. The same renderer handles either entry point. A saved report definition contains queries and tile settings. Execution resolves the current caller's authorized results into a separate widget snapshot.

## Connect an ASP.NET Core host

Reference `BbQ.ChatWidgets` and implement `IReportingSource` and `IReportingStore` in your application. Use your existing authentication and authorization setup.

```csharp
using BbQ.ChatWidgets.Reporting;

builder.Services.AddBbQReporting<OrdersReportingSource, DatabaseReportStore>();

// Map this alongside your application's other authenticated endpoints.
app.MapBbQReporting(policy: "CanUseReporting");
```

The source resolves scope from the authenticated principal, lists the datasets and presets that scope can use, and executes validated queries over application data. Apply the resolved scope again in the data query. The store scopes saved-definition reads and writes by both tenant and user. Use the host's request protection for write operations. Registration is opt-in and requires no chat services or AI configuration. The route prefix defaults to `/api/reporting`.

## Mount a reporting workspace

The Angular, React, and Blazor packages include a workspace for running presets, editing and saving definitions, and viewing report results. Mount it in your application's reporting route and use the same authorized ASP.NET Core API for all three.

| Platform | Workspace | API configuration |
| --- | --- | --- |
| Angular | Import `ReportingComponent` from `@bbq-chat/widgets-angular` and mount `<bbq-reporting />`. | Supply the host's `HttpClient` and interceptors. Set `REPORTING_API` to override the route and `REPORTING_INITIAL_PRESET` to select a preset. |
| React | Import `ReportingWorkspace` from `@bbq-chat/widgets-react`. | By default it uses a same-origin `ReportingClient`. Supply a `client` to use a different route or transport and `initialPresetId` to select a preset. |
| Blazor | Import `BbQ.ChatWidgets.Blazor.Components` and mount `<ReportingWorkspace>` in an interactive render mode. | Supply an `IReportingWorkspaceClient`. Use `ReportingHttpClient` with a host-configured `HttpClient`, or implement the interface against your application's reporting services. Use `InitialPreset` to select a preset. |

Set the Blazor render mode on the host page or app so the workspace receives its client and callbacks inside the interactive boundary. A Blazor Server circuit's outbound HTTP requests use the credentials of the supplied client. Configure that transport to authenticate as the current caller, or use an in-process adapter that derives the caller's scope from the circuit principal and applies the reporting authorization policy. If you prerender the workspace, the client must also be available in the prerendering host.

Custom frontends can import `ReportingClient` and `composeReportingSnapshot` from `@bbq-chat/widgets`. The client uses Fetch and accepts a host-supplied Fetch implementation. The composer resolves each distinct query once per render and preserves tile actions. Pass its result to a ChatWidgets renderer.

```ts
import { ReportingClient, WidgetManager, composeReportingSnapshot } from '@bbq-chat/widgets';

const reporting = new ReportingClient();
const catalog = await reporting.catalog();
const preset = catalog.presets[0];
const container = document.querySelector('#report');
if (preset && container) {
  const widget = await composeReportingSnapshot(preset.definition, catalog, query => reporting.run(query));
  new WidgetManager().renderInto(container, widget);
}
```

## Author report filters

In **Edit report** or **Edit dashboard**, use **Report filters** to add a filter supplied by one of the report's datasets. Change the display label, move the filter, or remove it. The same controls are available in Angular, React, and Blazor.

**Save as new** and **Save changes** store the filter list in the report definition. You can move that definition between compatible hosts because it stores catalog IDs and labels. Each host resolves choices in the current caller's scope.

```json
{
  "filters": [
    { "input": "channel", "label": "Sales channel" },
    { "input": "warehouse" }
  ]
}
```

An omitted `filters` property inherits the dataset filters. An empty array defines a report with no shared filter controls. An authored list also replaces the automatic same-query preview filters. Filter tiles you add explicitly remain part of the report. Running a saved definition still uses any saved query values. Removing a filter in the editor also clears values saved for that filter. The existing API validates each query and saves definitions under the current user's scope.

## Use server-paged grids

Implement `IReportingGridSource` on the registered reporting source and advertise `ReportGridCapabilities` on the catalog dimension that supports paging. Declare which column IDs can participate in text search, sorting, and exact-match filters. The library validates requests against the authorized catalog before calling the provider. Return the matching total and a bounded page of rows. Give every row a stable key and use it as an ordering tie-breaker so paging and selection stay consistent.

Each workspace uses this path automatically for grid tiles bound to a paging-enabled dimension. Search, sorting, and filtering apply to the full matching result on the server. Paged grids have their own controls below the snapshot widgets. For a standalone grid, use Angular's `PagedReportingGridComponent`, React's `PagedReportingGrid`, or Blazor's `PagedReportingGrid`. A custom TypeScript client can call `ReportingClient.page`. The snapshot grid supports client-side grouping, editing, and CSV export over its loaded dataset.

## Author a reporting widget directly

Create a `ReportingWidget` with kind `dashboard` to share named row sources and field settings with child reporting widgets. A child can override individual settings or host another dashboard. Each reporting definition is serializable and usable from the standard ChatWidgets renderer in JavaScript, React, Angular, and Blazor.

```ts
import { ReportingWidget, WidgetManager } from '@bbq-chat/widgets';

const dashboard = new ReportingWidget('Orders', '', 'dashboard', {
  sources: {
    daily: [
      { date: '2026-11-01', region: 'North', orders: 18, value: 810 },
      { date: '2026-11-02', region: 'South', orders: 12, value: 470 },
    ],
  },
  settings: {
    dataSource: 'daily',
    categoryField: 'date',
    valueField: 'value',
    dateField: 'date',
    xField: 'orders',
    columns: [
      { field: 'date', label: 'Date' },
      { field: 'region', label: 'Region' },
      { field: 'orders', label: 'Orders' },
      { field: 'value', label: 'Value' },
    ],
  },
  children: [
    { kind: 'filter', label: 'Region', action: 'region_changed', filterField: 'region' },
    { kind: 'metric', label: 'Order value', action: '' },
    { kind: 'bar', label: 'Value by region', action: '', settings: { groupBy: 'region' } },
    { kind: 'timeline', label: 'Order dates', action: 'open_date' },
    { kind: 'scatter', label: 'Order count and value', action: 'inspect_orders' },
    { kind: 'grid', label: 'Order summary', action: 'order_grid' },
  ],
});

const container = document.querySelector('#dashboard');
if (container) {
  new WidgetManager({
    actionHandler: {
      async handle(action, payload) {
        console.log(action, payload);
      },
    },
  }).renderInto(container, dashboard);
}
```

| Kind | Fields and behavior |
| --- | --- |
| `dashboard` | Hosts reporting children. Sources and settings inherit down the tree. |
| `filter` | Uses `filterField` to select a scalar value. Sibling data widgets and nested dashboards using the same named source update immediately. Multiple filters combine. |
| `bar`, `line`, `pie` | Use `categoryField` and numeric `valueField`. Set `groupBy` to sum values by a field. Pie charts display positive values. The line chart follows source order. |
| `timeline` | Uses ISO dates in `dateField` and orders events chronologically. |
| `time-line` | Plots values in chronological order, with horizontal spacing proportional to elapsed time. |
| `area` | Fills the area between the time-series line and zero to emphasise magnitude. |
| `step` | Carries each observation forward until the next one, then draws the change. |
| `time-column` | Draws a column for each observation on a time axis, with negative values below zero. |
| `scatter` | Uses numeric `xField` and `valueField`. |
| `waterfall` | Accumulates signed values in input order. Each bar starts at the previous total. |
| `pareto` | Ranks positive values and overlays their cumulative share among the displayed points. |
| `histogram` | Counts numeric observations in up to 12 equal-width bins based on the value range. A bin aggregates rows. |
| `table` | Shows the configured `columns`, or derives columns from the returned rows. |
| `grid` | Adds text search, column sorting and visibility, grouping, paging, row and page selection, CSV export, and opt-in per-column text or numeric editing. The CSV contains all matching rows and visible columns. |
| `metric` | Sums the numeric `valueField` after filters. |

A widget can supply `rows` directly or use the source named by `settings.dataSource`. Use string, number, Boolean, and null cells. Charts show up to 60 plotted values and announce when more are available. Chart data is also available in a textual list. A standalone filter emits actions. Place it inside a dashboard to apply shared filtering automatically.

The four time-series views use `dateField` and a numeric `valueField`. Supply ISO calendar dates (`2026-11-01`) or ISO timestamps with a time-zone offset or `Z`. The charts display dates in UTC and omit rows without a valid date and numeric value. For the reporting workspace, set `ReportField.DateField` on the catalog grouping to the timestamp field returned in `ReportRow.Fields`, or set it to `label` when the query returns dates as labels. For direct widget authoring, set `ReportingSettings.dateField` in TypeScript or `ReportingSettings.DateField` in .NET.

## Use the standard renderers

- **Angular** passes the widgets to `<bbq-widget-renderer>` and handles its `widgetAction` event.
- **React** passes the widgets to `WidgetRenderer` and handles `onWidgetAction`.
- **JavaScript** passes a widget to `WidgetManager.renderInto`. Server-rendered markup can be attached using `WidgetManager.attachHandlers`.
- **.NET and Blazor** construct `BbQ.ChatWidgets.Models.ReportingWidget` using the same kind names. In Blazor, pass it to `WidgetRenderer` and handle `OnAction` in an interactive render mode. C# SSR returns an encoded, readable data preview that the browser reporting engine can hydrate. The .NET converter recognizes reporting definitions automatically. To expose report authoring as an AI tool, explicitly register a reporting template in the host's widget registry.

## Handle custom actions

Give a directly authored widget an action name such as `inspect-orders`. JavaScript, React, and Angular widget renderers dispatch it through their usual action handler. Interactive Blazor dispatches it through `OnAction` with a `JsonElement` payload. The host can open a dialog, navigate to a route, or use the payload to request more data.

| Interaction | Payload |
| --- | --- |
| Activate a table or snapshot-grid row by clicking it or using its **View** button | `activate` with the original source index and row values. |
| Activate a chart mark by clicking it or pressing Enter or Space | `select` with the original source index and row values. Grouped marks include their group and contributing row indices. |
| Activate a server-paged row | `activate` with `rowKey` and the server result row. The key stays stable across pages. In Blazor, match the `ReportingGridRowActivation` payload. |
| Select snapshot-grid checkboxes, set a filter, or edit a cell | Existing `select`, `filter`, or `edit` events. |

Each workspace exposes the tile, its original index, the action name, and the payload. The optional resolver assigns a host-defined action name. The default is `report-result-<tile index>`.

### Angular

```html
<bbq-reporting [resolveAction]="resolveAction" (reportingAction)="onReportingAction($event)" />
```

```ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import type { ReportingWorkspaceAction } from '@bbq-chat/widgets-angular';

// Members of the host component
readonly router = inject(Router);
readonly resolveAction = () => 'open-order';

onReportingAction({ actionName, payload }: ReportingWorkspaceAction): void {
  if (actionName === 'open-order' && payload.kind === 'activate' && 'rowKey' in payload) {
    void this.router.navigate(['/orders', payload.rowKey]);
  }
}
```

### React

```tsx
import { ReportingWorkspace } from '@bbq-chat/widgets-react';
import '@bbq-chat/widgets-react/styles/reporting';

export function OrdersReporting({ openOrder }: { openOrder: (key: string) => void }) {
  return (
    <ReportingWorkspace
      initialPresetId="warehouse-grid"
      resolveAction={() => 'open-order'}
      onReportingAction={({ actionName, payload }) => {
        if (actionName === 'open-order' && payload.kind === 'activate' && 'rowKey' in payload) {
          openOrder(payload.rowKey);
        }
      }}
    />
  );
}
```

### Blazor

```razor
@using BbQ.ChatWidgets.Blazor.Components
@using BbQ.ChatWidgets.Blazor.Reporting
@inject IReportingWorkspaceClient Reporting
@inject NavigationManager Navigation

<ReportingWorkspace Client="Reporting" InitialPreset="warehouse-grid"
                    ResolveAction="@((_, _) => "open-order")" OnReportingAction="HandleAction" />

@code {
    private void HandleAction(ReportingWorkspaceAction action)
    {
        if (action.ActionName == "open-order" && action.Payload is ReportingGridRowActivation row)
            Navigation.NavigateTo($"/orders/{Uri.EscapeDataString(row.RowKey)}");
    }
}
```

Use stable business IDs for detail lookups. For a snapshot, resolve the ID from the row data. Apply the host's authorization when loading details or persisting edits. The Angular sample uses its action output to open a details dialog for chart marks and both kinds of grid rows.

The [Angular and .NET reporting sample](../../Sample/BbQ.ChatWidgets.Sample.Reporting/) demonstrates presets, custom dashboards, and scoped application data.
