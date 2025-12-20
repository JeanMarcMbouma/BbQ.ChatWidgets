using BbQ.ChatWidgets.Abstractions;
using System.Text;

namespace BbQ.ChatWidgets.Services
{
    /// <summary>
    /// Default implementation of <see cref="IAIInstructionProvider"/> that generates system instructions
    /// for the AI model about available widgets and actions.
    /// </summary>
    /// <remarks>
    /// This provider creates comprehensive instructions that tell the AI model:
    /// - What interactive widgets are available
    /// - How to properly format widget JSON
    /// - What actions can be triggered
    /// - Best practices for widget usage
    ///
    /// The instructions are generated dynamically based on registered widgets and actions,
    /// ensuring the AI always has accurate information about what's available.
    /// </remarks>
    internal class DefaultInstructionProvider(IWidgetActionRegistry actionRegistry, IWidgetRegistry widgetRegistry) : IAIInstructionProvider
    {
        private readonly IWidgetActionRegistry _actionRegistry = actionRegistry ?? throw new ArgumentNullException(nameof(actionRegistry));
        private readonly IWidgetRegistry _widgetRegistry = widgetRegistry ?? throw new ArgumentNullException(nameof(widgetRegistry));

        /// <summary>
        /// Gets the system instructions for the AI model.
        /// </summary>
        /// <remarks>
        /// The instructions include:
        /// 1. Role description for the AI
        /// 2. List of available widgets with their purposes
        /// 3. Guidelines for widget generation and formatting
        /// 4. Information about registered actions and their payloads
        ///
        /// This method is called by the chat service before sending messages to the AI.
        /// The instructions are regenerated on each call to reflect any newly registered actions.
        /// </remarks>
        /// <returns>The system instructions string, or null if no instructions are available.</returns>
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

        /// <summary>
        /// Builds the action-related instructions by iterating through registered actions.
        /// </summary>
        /// <remarks>
        /// Creates a formatted list of all registered actions with their descriptions and schemas.
        /// This helps the AI understand what backend actions can be triggered when users interact with widgets.
        /// </remarks>
        /// <returns>Formatted action instructions string, or empty string if no actions are registered.</returns>
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
