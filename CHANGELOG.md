# Changelog

All notable changes to BbQ.ChatWidgets will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024

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
