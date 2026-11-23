# BbQ.ChatWidgets for ASP.NET Core

Add interactive widgets to an AI chat, or expose application data through the reporting API. This package targets .NET 8 and includes the widget models, serialization, server renderers, and ASP.NET Core services and endpoints.

## Install

```sh
dotnet add package BbQ.ChatWidgets
```

## Connect an AI chat

Register `AddBbQChatWidgets` with an application-provided `IChatClient`, then map `MapBbQChatEndpoints` in your ASP.NET Core host. Configure authentication, conversation storage, and the widget actions your application supports. See the [ASP.NET Core integration example](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/blob/master/docs_src/INTEGRATION_PATHS.md) and the [widget catalog](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/blob/master/docs_src/widgets/README.md).

## Expose reports and dashboards

Implement `IReportingSource` for the catalog, presets and queries, and `IReportingStore` for saved definitions. Apply the caller's scope in the data source and store. The reporting endpoints run independently of the chat services.

```csharp
using BbQ.ChatWidgets.Reporting;

// In the host's service registration.
builder.Services.AddBbQReporting<OrdersReportingSource, DatabaseReportStore>();

// After building the web app and configuring its authentication.
app.MapBbQReporting(policy: "CanUseReporting");
```

The default reporting route is `/api/reporting`. A dataset can declare typed inputs and a calendar. The API validates queries and tile bindings against the caller's catalog. Implement `IReportingInputSource` for scoped choices and `IReportingGridSource` for server paging.

## Choose a renderer

- [Blazor components](https://www.nuget.org/packages/BbQ.ChatWidgets.Blazor)
- [JavaScript and TypeScript](https://www.npmjs.com/package/@bbq-chat/widgets), [Angular](https://www.npmjs.com/package/@bbq-chat/widgets-angular), or [React](https://www.npmjs.com/package/@bbq-chat/widgets-react)

See the [reporting integration guide](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/blob/master/docs_src/widgets/REPORTING.md) and the [runnable reporting sample](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/tree/master/Sample/BbQ.ChatWidgets.Sample.Reporting).
