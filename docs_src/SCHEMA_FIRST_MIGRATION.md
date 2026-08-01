# Schema-first widget protocol migration

Protocol version `1.0` adds strict model emission and revisioned incremental updates while keeping the original wire path available.

## Generation compatibility

`BbQChatOptions.WidgetGenerationMode` controls the model boundary:

- `StrictToolCall` exposes the canonical catalogue as the `emit_widgets` JSON Schema function. Use this with function-capable providers.
- `StructuredResponse` is reserved for providers that support schema-constrained response bodies.
- `EmbeddedMarkupLegacy` retains the existing `<widget>...</widget>` parser only for applications that explicitly select it.

`StrictToolCall` is the default. Unknown types/properties and invalid registered actions are rejected before rendering. Set `RequireRegisteredWidgetActions = false` only when action routing is deliberately external.

## Streaming compatibility

The SSE endpoint now emits `event:`, `id:`, and `data:` fields. Protocol clients reconcile `widget.snapshot`, `widget.upsert`, `widget.patch`, and `widget.remove` by `instanceId` and revision. They ignore stale/duplicate events and request a fresh snapshot after `stream.resync-required`, an invalid patch, or a revision gap.

Reconnect using the browser-provided `Last-Event-ID`. The server replays retained events; when retention no longer covers the requested ID it emits `stream.resync-required`. Configure `options.WidgetSse.SubscriberBufferCapacity`, `ReplayCapacity`, and `HeartbeatInterval` to match expected traffic.

Legacy `message` payloads use the existing full-rerender path when legacy generation is explicitly configured.

## Stateful renderer adoption

The JavaScript `WidgetStreamReducer` is the reference reconciliation contract. `WidgetManager` exposes keyed `updateWidget`/`unmountWidget` operations and optional `mount`, `update`, and `unmount` lifecycle hooks. An update hook may return `true` after changing a component in place; this preserves focus, selection, and renderer-local state. Angular and Blazor integrations can consume the same event envelope and keyed lifecycle rules.

## End-to-end rollout proof

1. Enable `StrictToolCall` and register the form actions used by a schema-constrained `FormWidget`.
2. Publish an initial `ProgressBarWidget` snapshot with revision `0`.
3. Publish server-generated patches with matching base revisions.
4. Keep focus in a form field while progress revisions arrive; the keyed reducer updates only the progress widget.
5. Intentionally omit a revision and confirm the client requests resynchronisation and accepts the replacement snapshot.
