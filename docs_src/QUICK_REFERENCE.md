# Quick Reference

| Topic | Description |
| --- | --- |
| **API endpoints** | `POST /api/chat/{message,action,agent,stream/message}` and `GET|POST /api/chat/widgets/streams/{streamId}/events` |
| **Widgets** | button, card, input, dropdown, slider, toggle, fileupload, datepicker, multiselect, progressbar, themeswitcher, form, textarea |
| **Customization** | Use `BbQChatOptions.WidgetRegistryConfigurator` to register widgets and `BbQChatOptions.WidgetActionRegistryFactory` + `RegisterHandler<TAction,TPayload,THandler>()` to register actions |
| **Docs** | See `guides/`, `examples/`, `design/`, and the full `[API Reference](api/README.md)` |
