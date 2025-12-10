using BbQ.ChatWidgets.Abstractions;
using System.Text;

namespace BbQ.ChatWidgets.Services
{
    internal class DefaultInstructionProvider(IWidgetActionRegistry actionRegistry, IWidgetRegistry widgetRegistry) : IAIInstructionProvider
    {
        private readonly IWidgetActionRegistry _actionRegistry = actionRegistry ?? throw new ArgumentNullException(nameof(actionRegistry));
        private readonly IWidgetRegistry _widgetRegistry = widgetRegistry ?? throw new ArgumentNullException(nameof(widgetRegistry));

        public string? GetInstructions()
        {
            var staticInstructions = $"""
                You are a helpful AI assistant that can generate interactive widgets to enhance user experience.

                You have access to the following interactive widgets that you can embed in your responses:

                { string.Join("\n", _widgetRegistry.GetInstances().Select((w, i) => $"{i+1}.{w.Purpose}"))}

                When generating widgets:
                - Always provide clear, actionable labels
                - Use descriptive action IDs (e.g., "delete_item", "save_changes")
                - Ensure all JSON is valid and properly escaped
                - Never nest widgets inside each other, unless while using a FormWidget as a container
                - **IMPORTANT: Input widgets (InputWidget, DropdownWidget, SliderWidget, ToggleWidget, FileUploadWidget, DatePickerWidget, MultiSelectWidget) MUST ALWAYS be bundled inside a FormWidget with appropriate submit/cancel actions**
                - Do NOT use standalone input widgets - always wrap them in a FormWidget
                - Keep widget text concise and action-oriented
                - Always wrap widgets in <widget>...</widget> tags
                """;

            var dynamicActions = BuildDynamicActionInstructions();

            return staticInstructions + (string.IsNullOrEmpty(dynamicActions) ? "" : $"\n\n## Registered Actions\n\n{dynamicActions}");
        }

        private string BuildDynamicActionInstructions()
        {
            var actions = _actionRegistry.GetActions();
            if (!actions.Any())
                return string.Empty;

            var sb = new StringBuilder();
            sb.AppendLine("The following actions are available for widgets:");
            sb.AppendLine();

            foreach (var action in actions)
            {
                sb.AppendLine($"- **{action.Name}**: {action.Description}");
                sb.AppendLine($"  Payload: {action.PayloadSchema}");
                sb.AppendLine();
            }

            return sb.ToString();
        }
    }
}
