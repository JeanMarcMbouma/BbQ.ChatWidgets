# API Models

Explore the widget, message, and thread models that flow through the service boundary. Each model has JSON converters and helper extensions in `BbQ.ChatWidgets.Models`.

## Widget Models

### Core Widgets
- [ChatWidget](../BbQ.ChatWidgets.Models.ChatWidget.html) - Base class for all widgets
- [ButtonWidget](../BbQ.ChatWidgets.Models.ButtonWidget.html) - Clickable button widget
- [CardWidget](../BbQ.ChatWidgets.Models.CardWidget.html) - Card display widget
- [ImageWidget](../BbQ.ChatWidgets.Models.ImageWidget.html) - Image display widget
- [ImageCollectionWidget](../BbQ.ChatWidgets.Models.ImageCollectionWidget.html) - Collection of images
- [ProgressBarWidget](../BbQ.ChatWidgets.Models.ProgressBarWidget.html) - Progress indicator widget
- [ThemeSwitcherWidget](../BbQ.ChatWidgets.Models.ThemeSwitcherWidget.html) - Theme switcher control

### Form Widgets
- [FormWidget](../BbQ.ChatWidgets.Models.FormWidget.html) - Container for form fields
- [FormField](../BbQ.ChatWidgets.Models.FormField.html) - Individual form field
- [FormAction](../BbQ.ChatWidgets.Models.FormAction.html) - Form action definition
- [InputWidget](../BbQ.ChatWidgets.Models.InputWidget.html) - Text input field
- [TextAreaWidget](../BbQ.ChatWidgets.Models.TextAreaWidget.html) - Multi-line text input
- [DropdownWidget](../BbQ.ChatWidgets.Models.DropdownWidget.html) - Dropdown select widget
- [MultiSelectWidget](../BbQ.ChatWidgets.Models.MultiSelectWidget.html) - Multi-select dropdown
- [SliderWidget](../BbQ.ChatWidgets.Models.SliderWidget.html) - Numeric slider widget
- [ToggleWidget](../BbQ.ChatWidgets.Models.ToggleWidget.html) - Toggle/switch widget
- [FileUploadWidget](../BbQ.ChatWidgets.Models.FileUploadWidget.html) - File upload widget
- [DatePickerWidget](../BbQ.ChatWidgets.Models.DatePickerWidget.html) - Date picker widget

## Chat Models
- [ChatTurn](../BbQ.ChatWidgets.Models.ChatTurn.html) - Represents a conversation turn
- [StreamChatTurn](../BbQ.ChatWidgets.Models.StreamChatTurn.html) - Streaming conversation turn
- [ChatMessages](../BbQ.ChatWidgets.Models.ChatMessages.html) - Message collection utilities

## Supporting Models
- [ImageItem](../BbQ.ChatWidgets.Models.ImageItem.html) - Image item for collections
- [WidgetTool](../BbQ.ChatWidgets.Models.WidgetTool.html) - AI tool definition for widgets

## Utilities
- [ChatWidgetConverter](../BbQ.ChatWidgets.Models.ChatWidgetConverter.html) - JSON converter for widgets
- [ChatWidgetExtensions](../BbQ.ChatWidgets.Models.ChatWidgetExtensions.html) - Extension methods for widgets
- [ChatMessageExtensions](../BbQ.ChatWidgets.Models.ChatMessageExtensions.html) - Extension methods for messages
- [Serialization](../BbQ.ChatWidgets.Models.Serialization.html) - Serialization utilities

For a complete list of models, see the [API Reference TOC](../toc.html).
