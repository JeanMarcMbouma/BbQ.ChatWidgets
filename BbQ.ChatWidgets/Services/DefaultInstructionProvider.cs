using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Abstractions;

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
    internal class DefaultInstructionProvider(
        IWidgetActionRegistry actionRegistry,
        IWidgetRegistry widgetRegistry,
        BbQChatOptions options) : IAIInstructionProvider
    {
        private readonly IWidgetActionRegistry _actionRegistry = actionRegistry ?? throw new ArgumentNullException(nameof(actionRegistry));
        private readonly IWidgetRegistry _widgetRegistry = widgetRegistry ?? throw new ArgumentNullException(nameof(widgetRegistry));
        private readonly BbQChatOptions _options = options ?? throw new ArgumentNullException(nameof(options));

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
            var staticInstructions = _options.WidgetGenerationMode switch
            {
                BbQ.ChatWidgets.Options.WidgetGenerationMode.StrictToolCall => BuildStrictToolInstructions(),
                BbQ.ChatWidgets.Options.WidgetGenerationMode.StructuredResponse => BuildStructuredResponseInstructions(),
                _ => BuildLegacyInstructions()
            };

            var dynamicActions = _options.WidgetGenerationMode is BbQ.ChatWidgets.Options.WidgetGenerationMode.StructuredResponse
                ? "Action IDs: " + string.Join(", ", _actionRegistry.GetActions().Select(action => action.Name))
                : BuildDynamicActionInstructions();

            return staticInstructions + (string.IsNullOrEmpty(dynamicActions) ? "" : $"\n\n## Registered Actions\n\n{dynamicActions}");
        }

        private string BuildStrictToolInstructions() => $$"""
                You are a helpful AI assistant that can use registered interactive widgets when they improve the response.

                Available widget types:
                {{string.Join("\n", _widgetRegistry.GetEntries().Select(entry => $"- {entry.TypeId}"))}}

                Widget generation rules:
                {{(_options.RequireWidgetDecision ? "- Every turn requires an emit_widgets decision before answering. For a requested or useful widget, emit its complete state. For ordinary text-only conversation, call emit_widgets with widgets: []. Never use an empty decision for an explicitly requested supported widget." : "")}}
                - Emit widgets only by invoking the `emit_widgets` tool.
                - When the user explicitly requests a supported widget, invoke emit_widgets; do not merely describe how to create it or claim you cannot display it.
                - Registered action IDs are values for widget action properties, NOT callable tools. Choose an appropriate registered action; never invent one.
                - If emit_widgets returns accepted false and repairAllowed true, correct the reported diagnostics and invoke emit_widgets again before answering. Never claim a rejected widget was displayed.
                - Follow the tool JSON Schema exactly; do not invent types, properties, nesting, or actions.
                - Send complete desired widget state, never patches.
                - Never generate instance IDs, revisions, lifecycle state, authorization decisions, or transport metadata.
                - Do not include widget JSON or `<widget>` markers in assistant text.
                - After successful emission, briefly confirm what was displayed. Do not print HTML, code examples, or setup instructions for the widget.
                - Keep labels concise and action-oriented.

                Registered widget examples (adapt labels and requested content; preserve the action and streamId unless another registered configuration is requested):
                {{BuildWidgetExamples()}}
                """;

        private string BuildWidgetExamples()
        {
            var examples = new List<string>();
            foreach (var (typeId, widget) in _widgetRegistry.GetEntries().OrderBy(entry => entry.TypeId))
            {
                // Built-in templates can contain placeholder actions. Do not teach the
                // model to emit those when the application requires registered actions.
                if (_options.RequireRegisteredWidgetActions && _actionRegistry.GetAction(widget.Action) is null)
                    continue;

                var example = JsonSerializer.SerializeToNode(widget, widget.GetType(), Serialization.Default)!.AsObject();
                example["type"] = typeId;
                // Purpose contains legacy markup instructions on some widget types.
                example["purpose"] = null;
                examples.Add(example.ToJsonString());
            }
            return string.Join("\n", examples);
        }

        private string BuildStructuredResponseInstructions() => $$"""
                You are a helpful AI assistant that can produce schema-constrained widget responses.
                Follow the response JSON Schema exactly and never invent widget types, properties, actions, or transport metadata.
                Return one JSON object with content and widgets. First write a brief reply in content, then put the complete requested widget states in widgets.
                For an explicitly requested supported widget, include it in widgets. For ordinary conversation use an empty widgets array.
                Action IDs are widget property values, not callable tools. Do not print widget markup or setup instructions in content.
                Use these registered examples, adapting requested labels and content while preserving action and stream defaults:
                {{BuildWidgetExamples()}}
                """;

        private string BuildLegacyInstructions() => $$"""
                You are a helpful AI assistant that can generate interactive widgets to enhance user experience.

                You have access to the following interactive widgets that you can embed in your responses:

                {{string.Join("\n", _widgetRegistry.GetInstances().Select((w, i) => $"{i + 1}.{w.Purpose}"))}}

                When generating widgets:
                - Always provide clear, actionable labels
                - Use descriptive action IDs (e.g., "delete_item", "save_changes")
                - Ensure all JSON is valid and properly escaped
                - Never nest widgets inside each other, unless while using a FormWidget as a container
                - **IMPORTANT: Input widgets (InputWidget, DropdownWidget, SliderWidget, ToggleWidget, FileUploadWidget, DatePickerWidget, MultiSelectWidget) MUST ALWAYS be bundled inside a FormWidget with appropriate submit/cancel actions**
                - Do NOT use standalone input widgets - always wrap them in a FormWidget
                - Keep widget text concise and action-oriented
                - Always wrap widgets in <widget>...</widget> tags
                
                **MANDATORY: maxLength Property Rules**
                - EVERY input and textarea field MUST include a maxLength property
                - EVERY form field with type="input" or type="textarea" MUST include maxLength in ExtensionData
                - **CRITICAL: maxLength must ALWAYS be aligned with validationHint length constraints**
                  - If validationHint says "3-30 characters", set maxLength to 30 (or higher)
                  - If validationHint says "at least 8 characters", set maxLength to 100+ to allow flexibility
                  - If validationHint mentions specific character limits, respect those limits in maxLength
                - Default maxLength values when no validationHint: input=100, textarea=500
                - Examples with validationHint alignment:
                  - {"name":"code","label":"Code","type":"input","required":true,"validationHint":"Must be 4 digits","maxLength":4}
                  - {"name":"password","label":"Password","type":"input","required":true,"validationHint":"Must be at least 8 characters","maxLength":128}
                  - {"name":"feedback","label":"Feedback","type":"textarea","required":true,"validationHint":"Limit to 250 characters","maxLength":250}
                - NO EXCEPTIONS - if maxLength conflicts with validationHint, the form will reject valid input
                """;

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
