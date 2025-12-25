# API Abstractions

This section covers the interfaces you can implement to extend the system: `IWidgetRegistry`, `IWidgetActionHandlerResolver`, and `IThreadService` are good entry points.

## Core Interfaces

### Widget System
- [IWidgetRegistry](../BbQ.ChatWidgets.Abstractions.IWidgetRegistry.html) - Central registry for widget templates
- [IWidgetToolsProvider](../BbQ.ChatWidgets.Abstractions.IWidgetToolsProvider.html) - Provides widget tools to AI agents
- [IWidgetHintParser](../BbQ.ChatWidgets.Abstractions.IWidgetHintParser.html) - Parses widget hints from AI responses
- [IWidgetHintSanitizer](../BbQ.ChatWidgets.Abstractions.IWidgetHintSanitizer.html) - Sanitizes widget content
- [IWidgetLocalizer](../BbQ.ChatWidgets.Abstractions.IWidgetLocalizer.html) - Localizes widget content
- [IRecyclableWidget](../BbQ.ChatWidgets.Abstractions.IRecyclableWidget.html) - Interface for widgets that can be recycled

### Action Handling
- [IWidgetAction<T>](../BbQ.ChatWidgets.Abstractions.IWidgetAction-1.html) - Base interface for widget actions
- [IActionWidgetActionHandler<TWidgetAction, T>](../BbQ.ChatWidgets.Abstractions.IActionWidgetActionHandler-2.html) - Handler for typed widget actions
- [IWidgetActionRegistry](../BbQ.ChatWidgets.Abstractions.IWidgetActionRegistry.html) - Registry for widget action metadata
- [IWidgetActionHandlerResolver](../BbQ.ChatWidgets.Abstractions.IWidgetActionHandlerResolver.html) - Resolves action handlers
- [IWidgetActionMetadata](../BbQ.ChatWidgets.Abstractions.IWidgetActionMetadata.html) - Metadata for widget actions

### Thread Management
- [IThreadService](../BbQ.ChatWidgets.Abstractions.IThreadService.html) - Manages conversation threads and history
- [IChatHistorySummarizer](../BbQ.ChatWidgets.Abstractions.IChatHistorySummarizer.html) - Summarizes chat history to manage context windows

### AI Integration
- [IAIToolsProvider](../BbQ.ChatWidgets.Abstractions.IAIToolsProvider.html) - Provides AI tools for the chat system
- [IAIInstructionProvider](../BbQ.ChatWidgets.Abstractions.IAIInstructionProvider.html) - Provides AI instructions and prompts

### SSE (Server-Sent Events)
- [IWidgetSseService](../BbQ.ChatWidgets.Abstractions.IWidgetSseService.html) - Real-time widget streaming via SSE
- [IStreamPayloadValidator](../BbQ.ChatWidgets.Abstractions.IStreamPayloadValidator.html) - Validates SSE stream payloads
- [StreamValidationRules](../BbQ.ChatWidgets.Abstractions.StreamValidationRules.html) - Rules for stream validation

### Exceptions
- [PayloadValidationException](../BbQ.ChatWidgets.Abstractions.PayloadValidationException.html) - Exception for payload validation errors
- [PayloadValidationReason](../BbQ.ChatWidgets.Abstractions.PayloadValidationReason.html) - Reasons for payload validation failures
- [PublishRateLimitExceededException](../BbQ.ChatWidgets.Abstractions.PublishRateLimitExceededException.html) - Exception for rate limit violations

For a complete list of types, see the [API Reference TOC](../toc.html).
