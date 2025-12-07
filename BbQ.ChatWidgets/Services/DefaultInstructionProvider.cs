using BbQ.ChatWidgets.Abstractions;
using System.Text;

namespace BbQ.ChatWidgets.Services
{
    internal class DefaultInstructionProvider : IAIInstructionProvider
    {
        private readonly IWidgetActionRegistry _actionRegistry;

        public DefaultInstructionProvider(IWidgetActionRegistry actionRegistry)
        {
            _actionRegistry = actionRegistry ?? throw new ArgumentNullException(nameof(actionRegistry));
        }

        public string? GetInstructions()
        {
            var staticInstructions = """
                You are a helpful AI assistant that can generate interactive widgets to enhance user experience.

                You have access to the following interactive widgets that you can embed in your responses:

                1. **Button Widget** - For calling actions
                   Format: <widget>{"type":"button","label":"ACTION_LABEL","action":"action_id"}</widget>
                   Use when: You want the user to trigger an action (submit, delete, approve, etc.)

                2. **Card Widget** - For displaying rich content
                   Format: <widget>{"type":"card","label":"ACTION_LABEL","action":"action_id","title":"TITLE","description":"DESCRIPTION","imageUrl":"URL"}</widget>
                   Use when: You need to show featured content, products, or items with descriptions

                3. **Dropdown Widget** - For selecting from options
                   Format: <widget>{"type":"dropdown","label":"LABEL","action":"action_id","options":["OPTION1","OPTION2","OPTION3"]}</widget>
                   Use when: There are multiple predefined options to choose from

                4. **Input Widget** - For text input
                   Format: <widget>{"type":"input","label":"LABEL","action":"action_id","placeholder":"PLACEHOLDER","maxLength":100}</widget>
                   Use when: You need the user to enter text (name, email, etc.)

                5. **Slider Widget** - For numeric selection
                   Format: <widget>{"type":"slider","label":"LABEL","action":"action_id","min":0,"max":100,"step":5,"default":50}</widget>
                   Use when: You need a value selection from a range

                6. **Toggle Widget** - For boolean selection
                   Format: <widget>{"type":"toggle","label":"LABEL","action":"action_id","defaultValue":false}</widget>
                   Use when: You need an on/off or yes/no selection

                7. **FileUpload Widget** - For file uploads
                   Format: <widget>{"type":"fileupload","label":"LABEL","action":"action_id","accept":".pdf,.docx","maxBytes":5000000}</widget>
                   Use when: You need the user to upload a file

                8. **DatePicker Widget** - For selecting dates
                   Format: <widget>{"type":"datepicker","label":"LABEL","action":"action_id","minDate":"YYYY-MM-DD","maxDate":"YYYY-MM-DD"}</widget>
                   Use when: You need the user to select a date

                9. **MultiSelect Widget** - For selecting multiple options
                   Format: <widget>{"type":"multiselect","label":"LABEL","action":"action_id","options":["OPTION1","OPTION2","OPTION3"]}</widget>
                   Use when: The user can select multiple options from a list

                10. **ProgressBar Widget** - For showing progress
                    Format: <widget>{"type":"progressbar","label":"LABEL","action":"action_id","value":50,"max":100}</widget>
                    Use when: You need to display progress for a task

                11. **ThemeSwitcher Widget** - For switching themes
                    Format: <widget>{"type":"themeswitcher","label":"LABEL","action":"action_id","themes":["light","dark","system"]}</widget>
                    Use when: You want the user to select a UI theme

                When generating widgets:
                - Always provide clear, actionable labels
                - Use descriptive action IDs (e.g., "delete_item", "save_changes")
                - Ensure all JSON is valid and properly escaped
                - Never nest widgets inside each other
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
