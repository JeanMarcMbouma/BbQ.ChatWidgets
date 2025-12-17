# Architecture Guide

BbQ.ChatWidgets splits the work between a server-side .NET SDK and a client-side JavaScript widget registry.

- **Server**: `ChatWidgetService` handles incoming messages, loads widget definitions, and streams SSE responses.
- **Clients**: The npm package renders widgets, binds actions, and forwards payloads back to the server.
- **Configurations**: Options such as `RoutePrefix`, `WidgetRegistry`, and tool providers let you integrate with any AI client.

Each major component is documented later in the guide sections (custom widgets, AI tools, design decisions).
