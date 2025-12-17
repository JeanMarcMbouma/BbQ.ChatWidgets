# Quick Reference

This page provides a concise summary of the most common endpoints, types, and configuration options in BbQ.ChatWidgets.

## API Endpoints

All endpoints are prefixed with the `RoutePrefix` (default: `/api/chat`).

| Endpoint | Method | Description |
| --- | --- | --- |
| `/message` | `POST` | Send a user message and get a `ChatTurn` response. |
| `/action` | `POST` | Execute a widget action (e.g., button click, form submit). |
| `/agent` | `POST` | Route a message through the Triage Agent system. |
| `/stream/message` | `POST` | Stream a `ChatTurn` response via Server-Sent Events (SSE). |
| `/widgets/streams/{id}/events` | `GET` | Subscribe to server-pushed widget updates (SSE). |
| `/widgets/streams/{id}/events` | `POST` | Publish a server-pushed widget update. |

## Core Types

### ChatTurn
The standard response object for chat interactions.
- `Role`: The role of the message sender (usually "assistant").
- `Content`: The text content of the response.
- `Widgets`: A list of `ChatWidget` objects to be rendered.
- `ThreadId`: The unique identifier for the conversation thread.

### ChatWidget
Metadata for a single UI component.
- `Type`: The unique identifier for the widget type (e.g., "button", "form").
- `Data`: A dictionary of properties specific to that widget type.

## Built-in Widgets

| Type | Description |
| --- | --- |
| `button` | A simple clickable button that triggers an action. |
| `card` | A container for text, images, and other widgets. |
| `input` | A single-line text input field. |
| `dropdown` | A selectable list of options. |
| `slider` | A numeric range selector. |
| `toggle` | A boolean switch. |
| `fileupload` | A component for uploading files. |
| `datepicker` | A date selection component. |
| `multiselect` | A component for selecting multiple options from a list. |
| `progressbar` | A visual indicator of progress. |
| `form` | A container for grouping input-like widgets. |
| `textarea` | A multi-line text input field. |

## Common Configuration

```csharp
builder.Services.AddBbQChatWidgets(options => {
    options.RoutePrefix = "/api/chat"; // Change the base API path
    options.ChatClientFactory = sp => ...; // Provide the IChatClient
    options.WidgetRegistryConfigurator = reg => ...; // Register custom widgets
    options.WidgetActionRegistryFactory = (sp, reg, res) => ...; // Register action handlers
});
```
