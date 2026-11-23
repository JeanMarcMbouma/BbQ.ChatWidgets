# BbQ.ChatWidgets.Blazor

Render interactive chat widgets and reporting dashboards in a .NET 8 Blazor application. This package includes the Razor components and their static assets, and depends on [BbQ.ChatWidgets](https://www.nuget.org/packages/BbQ.ChatWidgets) for the shared models and server contracts.

## Install

```sh
dotnet add package BbQ.ChatWidgets.Blazor
```

## Render chat widgets

Import `BbQ.ChatWidgets.Blazor.Components` and pass a widget to `WidgetRenderer`. Host the component in an interactive render mode for callbacks. In `Program.cs`, call `AddBbQChatWidgetsBlazor` from the `BbQ.ChatWidgets.Blazor` namespace to configure host component overrides.

```razor
@using BbQ.ChatWidgets.Blazor.Components

<WidgetRenderer Widget="Widget" OnAction="HandleWidgetAction" />
```

## Mount a reporting workspace

Register an `IReportingWorkspaceClient` in your host. Use `ReportingHttpClient` with a host-configured `HttpClient`, or use an in-process adapter that applies the current caller's authorization and reporting scope. In a Blazor Server circuit, the configured client must authenticate outbound requests as the current caller. Register the client in the prerendering host too if the page prerenders.

```razor
@using BbQ.ChatWidgets.Blazor.Components
@using BbQ.ChatWidgets.Blazor.Reporting
@inject IReportingWorkspaceClient Reports

<ReportingWorkspace Client="Reports" InitialPreset="warehouse-grid" />
```

The workspace runs built-in and saved definitions, renders chart settings, and displays server-paged grids when the catalog supports paging. For a custom layout, construct a `ReportingWidget` with the data and chart settings and pass it to `WidgetRenderer`. The optional `IReportingInputWorkspaceClient` exposes scoped choices for host-supplied controls.

See the [Blazor sample](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/tree/master/Sample/BbQ.ChatWidgets.Sample.Blazor), the [reporting integration guide](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/blob/master/docs_src/widgets/REPORTING.md), and the [ASP.NET Core package guide](https://www.nuget.org/packages/BbQ.ChatWidgets).

### Authored reporting layouts

The workspace recognizes saved layout definitions and lets readers switch modes and card variants. Native charts and grouped cards use the shared reporting renderer. The Blazor editor retains existing layouts when changing ordinary report settings. Create or rearrange layouts using the Angular layout editor, a host tool, or the typed .NET contract.
