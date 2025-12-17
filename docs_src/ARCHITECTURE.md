# Architecture Guide

BbQ.ChatWidgets splits the work between a server-side .NET SDK and a client-side JavaScript widget registry.

- **Server**: `ChatWidgetService` handles incoming messages, renders responses, and supports both JSON endpoints (`/message`, `/action`, `/agent`) and SSE endpoints (`/stream/*` and `/widgets/streams/*`).
- **Clients**: The npm package renders widgets, binds actions, and forwards payloads back to the server.
- **Configurations**: Options such as `RoutePrefix`, `WidgetRegistryConfigurator`, action registrations, and tool/instruction providers let you integrate with any `IChatClient`.

Each major component is documented later in the guide sections (custom widgets, AI tools, design decisions).
