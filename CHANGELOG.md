# Changelog

All notable changes to BbQ.ChatWidgets will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and package versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - Unreleased

### Added

- Widget protocol 1.0: canonical versioned schemas, strict `emit_widgets` generation, validation diagnostics, and one bounded repair attempt.
- Server-owned widget instance IDs and revisions with deterministic RFC 6902 patches.
- Bounded SSE delivery with named events, event IDs, reconnect replay, heartbeats, and deterministic resynchronisation.
- A keyed JavaScript reducer and renderer lifecycle hooks that preserve unrelated component state.

### Deprecated

- Embedded `<widget>` markup and snapshot-only SSE remain available as compatibility fallbacks; new integrations should use strict tool emission and protocol 1.0 events.

### Reliability and demo improvements

- New responsive React entry page and local booking/support/approval playground, with JSON inspection and action feedback.
- Lazy-load live examples; correct the React package name, asset publishing, mobile chat input layout, duplicate action dispatch, and chart/stream resource cleanup.
- Repair native ESM/CommonJS exports, shared model identity, and image deserialization; verify installed npm tarballs.
- Scope widget updates to a container, attach root handlers, and replace duplicate listeners with explicit cleanup.
- Escape numeric rendering attributes, validate email fields, and reject unsafe JSON Patch paths and stale snapshots after removal.
- Bound JSON requests, return 400/413 for malformed/oversized bodies, and expose an authorization gate before every library request.
- Serve the sample playground without an AI key; production live APIs need explicit opt-in.
- Update ECharts and align Angular tooling/runtime to patched releases; audit consuming apps in CI.
- Use the SDK-provided Source Link tooling instead of the vulnerable legacy build package.
- Publish the Angular compiled package, include README/license, and stop swallowing release failures. Require supported Node/SDK versions in CI.
- Document production hosting responsibilities and add mobile/desktop playground checks.
- Preserve all concurrent conversation-history appends.
- Preserve SSE delta flags, token whitespace, and widget markup split across model updates.
- Ignore stale widget events after disconnect and reset revision tracking for explicit connections.
- Buffer fragmented Angular streams; cancel cleared/unmounted demo requests and preserve widget-only updates.
- Make Angular custom widget registration repeat-safe and register renderers in the shared registry.
- Support local OpenAI-compatible endpoints in the React and Angular demos, with a repeatable live-model integration check.
- Make installed npm tarball verification portable to Windows.
- Build the optional llama.cpp integration explicitly before packaging it in the NuGet release workflow.

### Release preparation

- Align NuGet packages (`BbQ.ChatWidgets`, `BbQ.ChatWidgets.Blazor`, `BbQ.LlamaCpp`) and npm packages (`@bbq-chat/widgets`, `@bbq-chat/widgets-angular`) at 1.1.0.
- Local live-model validation passed all five checks through both demo APIs using Qwen2.5-1.5B-Instruct Q4_K_M and llama.cpp b11429. This is an integration smoke test, not a model quality benchmark.
- Demo builds retain bundle-size warnings; JavaScript lint retains non-blocking warnings.

## [1.0.0] - 2024-01-01

### Added

#### Core Features
- **Interactive Chat Widgets**: 14 built-in widget types including buttons, forms, cards, inputs, and more
- **Server-Driven UI**: AI/LLM decides which widgets to render based on conversation context
- **Automatic Chat History Summarization**: Efficiently manages long conversations by summarizing older turns
- **Server-Sent Events (SSE)**: Real-time server-pushed widget updates for live data
- **Triage Agent System**: Intelligent routing to specialized agents based on user intent classification
- **Type-Safe Widget Actions**: Strongly-typed handlers for all widget interactions with compile-time safety
- **Extensible Architecture**: Full dependency injection support for swapping components

#### Widget Library
- `ButtonWidget` - Simple clickable action triggers
- `CardWidget` - Rich content display with title, description, and images
- `FormWidget` - Container for collecting user inputs
- `InputWidget` - Single-line text input
- `TextAreaWidget` - Multi-line text input
- `DropdownWidget` - Single-select from options
- `MultiSelectWidget` - Multiple selection from options
- `SliderWidget` - Numeric range selector
- `ToggleWidget` - Boolean on/off switch
- `DatePickerWidget` - Date selection
- `FileUploadWidget` - File selection and upload
- `ProgressBarWidget` - Visual progress indicator
- `ThemeSwitcherWidget` - UI theme selection
- `ImageWidget` - Single image display
- `ImageCollectionWidget` - Multiple image gallery

#### Framework Support
- **.NET 8+**: Full ASP.NET Core integration with services and endpoints
- **JavaScript/TypeScript**: Framework-agnostic client library with type definitions
- **Angular**: Native Angular components and services with reactive bindings
- **React**: Sample implementation with hooks and components
- **Blazor**: Server-side Blazor component integration

#### Developer Experience
- Comprehensive API documentation generated with DocFX
- TypeScript type definitions for client libraries
- Multiple sample projects (Console, Web API, Angular, React, Blazor)
- Triage agent samples demonstrating intent classification
- Custom widget examples (ECharts, Clock, Weather)
- SSE streaming examples with real-time updates

#### Documentation
- Getting Started guide with step-by-step instructions
- Widget catalog with usage examples
- Architecture overview and design documentation
- Custom widget creation guide
- Action handler implementation guide
- Chat history summarization guide
- Contributing guidelines

### Package Information
- **NuGet**: `BbQ.ChatWidgets` 1.0.0
- **npm**: `@bbq-chat/widgets` 1.0.0
- **npm**: `@bbq-chat/widgets-angular` 1.0.0

[1.0.0]: https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/releases/tag/v1.0.0
