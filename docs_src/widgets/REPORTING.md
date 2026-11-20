# Author a reporting dashboard

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
| `scatter` | Uses numeric `xField` and `valueField`. |
| `table` | Shows the configured `columns`, or derives columns from the returned rows. |
| `grid` | Adds text search, column sorting and visibility, grouping, paging, row and page selection, CSV export, and opt-in per-column text or numeric editing. The CSV contains all matching rows and visible columns. |
| `metric` | Sums the numeric `valueField` after filters. |

A widget can supply `rows` directly or use the source named by `settings.dataSource`. Use string, number, Boolean, and null cells. Charts show up to 60 plotted values and announce when more are available. Chart data is also available in a textual list. A standalone filter emits actions. Place it inside a dashboard to apply shared filtering automatically.

## Use the standard renderers

- **Angular** passes the widgets to `<bbq-widget-renderer>` and handles its `widgetAction` event.
- **React** passes the widgets to `WidgetRenderer` and handles `onWidgetAction`.
- **JavaScript** passes a widget to `WidgetManager.renderInto`. Server-rendered markup can be attached using `WidgetManager.attachHandlers`.
- **.NET and Blazor** construct `BbQ.ChatWidgets.Models.ReportingWidget` using the same kind names. In Blazor, pass it to `WidgetRenderer` and handle `OnAction` in an interactive render mode. C# SSR returns an encoded, readable data preview that the browser reporting engine can hydrate. The .NET converter recognizes reporting definitions automatically. To expose report authoring as an AI tool, explicitly register a reporting template in the host's widget registry.

The browser emits `filter`, `select`, and `edit` payloads through the action configured on each widget. Filter payloads include the source, field, value, and whether the filter is active. Selection includes source row indices and, for an individual row, its values. An edit includes the source, row index, field, and proposed value. Data in a grid is a client snapshot. Apply application authorization and validation before persisting edits or issuing drill-through queries. Resolve stable business IDs from your data and bind actions to the original source snapshot.

The [Angular and .NET reporting sample](../../Sample/BbQ.ChatWidgets.Sample.Reporting/) demonstrates presets, custom dashboards, and scoped application data.
