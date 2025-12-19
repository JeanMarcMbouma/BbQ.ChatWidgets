using System.Text.Json;
using System.Text.Json.Schema;
using System.Text.Json.Serialization;

namespace BbQ.ChatWidgets.Models;

/// <summary>
/// Base class for all interactive chat widgets.
/// </summary>
/// <param name="Action">The action identifier triggered when the user interacts with the widget.</param>
/// <param name="Label">The display label for the widget.</param>
/// <remarks>
/// Widgets are interactive UI elements that can be embedded in AI chat responses.
/// This base class defines common properties that all widgets must have:
/// - <c>Type</c>: Identifies the widget kind for JSON deserialization and rendering
/// - <c>Label</c>: Display text for the widget
/// - <c>Action</c>: Identifier for the action triggered when user interacts with widget
/// 
/// Specific widget types extend this base with additional properties relevant to their functionality.
/// The class uses a custom JSON converter to automatically deserialize to the correct type.
/// </remarks>
public abstract record ChatWidget(
    string Label,
    string Action)
{

    /// <summary>
    /// Describes the purpose and usage of this widget.
    /// </summary>
    /// <remarks>
    /// This property provides a brief description of the widget's functionality and intended use cases.
    /// </remarks>
    [JsonIgnore] 
    public abstract string Purpose { get; }
}

/// <summary>
/// A simple button widget that triggers an action when clicked.
/// </summary>
/// <remarks>
/// The button is the simplest widget type, containing only a label and an action.
/// When clicked, it triggers the specified action with no payload data.
/// 
/// Example JSON:
/// {"type":"button","label":"Submit","action":"submit"}
/// </remarks>
public sealed record ButtonWidget(
    string Label,
    string Action)
    : ChatWidget(Label, Action)
{
    /// <summary>
    /// <inheritdoc/>
    /// </summary>
    public override string Purpose => """
           **Button Widget** - For calling actions
           Format: <widget>{"type":"button","label":"ACTION_LABEL","action":"action_id"}</widget>
           Use when: You want the user to trigger an action (submit, delete, approve, etc.)
        """;
}

/// <summary>
/// A card widget that displays rich content including title, description, and optional image.
/// </summary>
/// <remarks>
/// Cards are used to display featured items, products, recommendations, or other rich content.
/// They support:
/// - A title for the card
/// - An optional description
/// - An optional image URL
/// - An action triggered by clicking the card or its button
/// 
/// Example JSON:
/// {"type":"card","label":"View Details","action":"view","title":"Product Name","description":"Description","imageUrl":"https://..."}
/// </remarks>
public sealed record CardWidget(
    string Label,
    string Action,
    string Title,
    string? Description = null,
    string? ImageUrl = null)
    : ChatWidget(Label, Action)
{
    /// <summary>
    ///<inheritdoc/>
    /// </summary>
    public override string Purpose => """
           **Card Widget** - For displaying rich content
           Format: <widget>{"type":"card","label":"ACTION_LABEL","action":"action_id","title":"TITLE","description":"DESCRIPTION","imageUrl":"URL"}</widget>
           Use when: You need to show featured content, products, or items with descriptions
        """;
}

/// <summary>
/// An input widget for collecting short text from the user.
/// </summary>
/// <remarks>
/// Input widgets are used for text entry, such as names, emails, or search queries.
/// They support:
/// - A placeholder text
/// - Maximum length constraint
/// 
/// Example JSON:
/// {"type":"input","label":"Enter name","action":"input","placeholder":"Full name","maxLength":100}
/// </remarks>
public sealed record InputWidget(
    string Label,
    string Action,
    string? Placeholder = null,
    int? MaxLength = null)
    : ChatWidget(Label, Action)
{

    /// <summary>
    ///<inheritdoc/>
    /// </summary>
    public override string Purpose => """
           **Input Widget** - For single line text input
           Format: <widget>{"type":"input","label":"LABEL","action":"action_id","placeholder":"PLACEHOLDER","maxLength":100}</widget>
           Use when: You need the user to enter text (name, email, etc.)
        """;
}

/// <summary>
/// A textarea widget for multi-line text input.
/// </summary>
/// <remarks>
/// TextArea widgets are used when users need to enter multiple lines of text.
/// They support:
/// - Placeholder text shown when empty
/// - Maximum length constraint
/// - Minimum and maximum row constraints for sizing
/// 
/// Example JSON:
/// {"type":"textarea","label":"Enter message","action":"input","placeholder":"Your message here","maxLength":500,"rows":5}
/// </remarks>
public sealed record TextAreaWidget(
    string Label,
    string Action,
    string? Placeholder = null,
    int? MaxLength = null,
    int? Rows = null)
    : ChatWidget(Label, Action)
{

    /// <summary>
    ///<inheritdoc/>
    /// </summary>
    public override string Purpose => """
           **TextArea Widget** - For multi-line text input
           Format: <widget>{"type":"textarea","label":"LABEL","action":"action_id","placeholder":"PLACEHOLDER","maxLength":500,"rows":5}</widget>
           Use when: You need the user to enter multiple lines of text (feedback, comments, descriptions, etc.)
        """;
}

/// <summary>
/// A dropdown widget for selecting from multiple predefined options.
/// </summary>
/// <remarks>
/// Dropdowns are used when the user must select from a list of options.
/// They work well for:
/// - Categorical choices (size, color, priority, etc.)
/// - Filtering or sorting options
/// - Any selection from 3+ options
/// 
/// Example JSON:
/// {"type":"dropdown","label":"Select size","action":"select_size","options":["Small","Medium","Large"]}
/// </remarks>
public sealed record DropdownWidget(
    string Label,
    string Action,
    IReadOnlyList<string> Options)
    : ChatWidget(Label, Action)
{

    /// <summary>
    ///<inheritdoc/>
    /// </summary>
    public override string Purpose => """
           **Dropdown Widget** - For selecting from options
           Format: <widget>{"type":"dropdown","label":"LABEL","action":"action_id","options":["OPTION1","OPTION2","OPTION3"]}</widget>
           Use when: There are multiple predefined options to choose from
        """;
}

/// <summary>
/// A slider widget for selecting a numeric value from a range.
/// </summary>
/// <remarks>
/// Sliders allow users to select a value within a defined range using visual feedback.
/// Common uses:
/// - Volume control
/// - Price range selection
/// - Rating scales
/// - Confidence levels
/// 
/// Example JSON:
/// {"type":"slider","label":"Volume","action":"set_volume","min":0,"max":100,"step":5,"default":50}
/// </remarks>
public sealed record SliderWidget(
    string Label,
    string Action,
    int Min,
    int Max,
    int Step,
    int? Default = null)
    : ChatWidget(Label, Action)
{

    /// <summary>
    ///<inheritdoc/>
    /// </summary>
    public override string Purpose => """
           **Slider Widget** - For numeric selection
           Format: <widget>{"type":"slider","label":"LABEL","action":"action_id","min":0,"max":100,"step":5,"default":50}</widget>
           Use when: You need a value selection from a range
        """;
}

/// <summary>
/// A toggle widget for boolean (yes/no, on/off) selection.
/// </summary>
/// <remarks>
/// Toggles provide a simple on/off selection mechanism with visual feedback.
/// Uses:
/// - Feature enable/disable
/// - Preference settings
/// - Yes/no questions
/// 
/// Example JSON:
/// {"type":"toggle","label":"Enable notifications","action":"toggle_notifications","defaultValue":false}
/// </remarks>
public sealed record ToggleWidget(
    string Label,
    string Action,
    bool DefaultValue)
    : ChatWidget(Label, Action)
{

    /// <summary>
    ///<inheritdoc/>
    /// </summary>
    public override string Purpose => """
           **Toggle Widget** - For boolean selection
           Format: <widget>{"type":"toggle","label":"LABEL","action":"action_id","defaultValue":false}</widget>
           Use when: You need an on/off or yes/no selection
        """;
}

/// <summary>
/// A file upload widget for selecting and uploading files.
/// </summary>
/// <remarks>
/// File upload widgets allow users to select files from their system for upload.
/// Supports:
/// - File type filtering via Accept property
/// - Maximum file size constraints via MaxBytes property
/// 
/// Example JSON:
/// {"type":"fileupload","label":"Upload document","action":"upload","accept":".pdf,.docx","maxBytes":5000000}
/// </remarks>
public sealed record FileUploadWidget(
    string Label,
    string Action,
    string? Accept = null,
    long? MaxBytes = null)
    : ChatWidget(Label, Action)
{

    /// <summary>
    ///<inheritdoc/>
    /// </summary>
    public override string Purpose => """
           **FileUpload Widget** - For file uploads
           Format: <widget>{"type":"fileupload","label":"LABEL","action":"action_id","accept":".pdf,.doc","maxBytes":5000000}</widget>
           Use when: You need the user to upload a file
        """;
}

/// <summary>
/// A theme switcher widget for selecting between multiple theme options.
/// </summary>
/// <remarks>
/// Theme switcher widgets allow users to select from predefined theme options.
/// Common uses:
/// - Light/dark mode switching
/// - Color scheme selection
/// - Application theme customization
/// 
/// The themes are provided as a list of option strings, and the selected theme
/// is sent as the payload when the user makes a selection.
/// 
/// Example JSON:
/// {"type":"themeswitcher","label":"Choose theme","action":"set_theme","themes":["light","dark","auto"]}
/// </remarks>
public sealed record ThemeSwitcherWidget(
    string Label,
    string Action,
    IReadOnlyList<string> Themes)
    : ChatWidget(Label, Action)
{

    /// <summary>
    ///<inheritdoc/>
    /// </summary>
    public override string Purpose => """
           **ThemeSwitcher Widget** - For switching themes
           Format: <widget>{"type":"themeswitcher","label":"LABEL","action":"action_id","themes":["light","dark","system"]}</widget>
           Use when: You want the user to select a UI theme
        """;
}

/// <summary>
/// A date picker widget for selecting a date.
/// </summary>
/// <remarks>
/// Date picker widgets allow users to select a specific date within an optional date range.
/// Common uses:
/// - Appointment scheduling
/// - Event date selection
/// - Deadline specification
/// - Birthday/date of birth selection
/// 
/// Example JSON:
/// {"type":"datepicker","label":"Select date","action":"pick_date","minDate":"2024-01-01","maxDate":"2024-12-31"}
/// </remarks>
public sealed record DatePickerWidget(
    string Label,
    string Action,
    string? MinDate = null,
    string? MaxDate = null)
    : ChatWidget(Label, Action)
{

    /// <summary>
    ///<inheritdoc/>
    /// </summary>
    public override string Purpose => """
           **DatePicker Widget** - For selecting dates
           Format: <widget>{"type":"datepicker","label":"LABEL","action":"action_id","minDate":"YYYY-MM-DD","maxDate":"YYYY-MM-DD"}</widget>
           Use when: You need the user to select a date
        """;
}

/// <summary>
/// A multi-select widget for selecting multiple options from a list.
/// </summary>
/// <remarks>
/// Multi-select widgets allow users to select multiple options from a predefined list.
/// Common uses:
/// - Selecting multiple categories
/// - Multi-item checklist
/// - Filter selection with multiple values
/// - Bulk action selection
/// 
/// Example JSON:
/// {"type":"multiselect","label":"Select items","action":"select_items","options":["Option1","Option2","Option3"]}
/// </remarks>
public sealed record MultiSelectWidget(
    string Label,
    string Action,
    IReadOnlyList<string> Options)
    : ChatWidget(Label, Action)
{

    /// <summary>
    ///<inheritdoc/>
    /// </summary>
    public override string Purpose => """
           **MultiSelect Widget** - For selecting multiple options
           Format: <widget>{"type":"multiselect","label":"LABEL","action":"action_id","options":["OPTION1","OPTION2","OPTION3"]}</widget>
           Use when: The user can select multiple options from a list
        """;
}

/// <summary>
/// A progress bar widget for displaying progress of a task.
/// </summary>
/// <remarks>
/// Progress bar widgets display the completion status of a task or operation.
/// Common uses:
/// - File upload/download progress
/// - Task completion percentage
/// - Loading progress indication
/// - Multi-step process progress
/// 
/// The widget is read-only and typically updated by the backend as progress occurs.
/// 
/// Example JSON:
/// {"type":"progressbar","label":"Upload progress","action":"upload_progress","value":65,"max":100}
/// </remarks>
public sealed record ProgressBarWidget(
    string Label,
    string Action,
    int Value,
    int Max)
    : ChatWidget(Label, Action)
{

    /// <summary>
    ///<inheritdoc/>
    /// </summary>
    public override string Purpose => """
           **ProgressBar Widget** - For showing progress
           Format: <widget>{"type":"progressbar","label":"LABEL","action":"action_id","value":50,"max":100}</widget>
           Use when: You need to display progress for a task
        """;
}

/// <summary>
/// Represents a composite form widget used to collect structured input from users, including multiple fields and
/// associated actions such as submit and cancel.
/// </summary>
/// <remarks>Use the FormWidget when you need to gather multiple pieces of structured data from a user in a single
/// interaction. Each form must define its fields and include both submit and cancel actions to ensure proper handling
/// of user input. The widget supports various field types and validation options, allowing for flexible form
/// design.</remarks>
/// <param name="Title">The title displayed at the top of the form. Cannot be null.</param>
/// <param name="Action">The identifier for the form's primary action, typically used to distinguish the form submission event. Cannot be
/// null.</param>
/// <param name="Fields">A read-only list of form fields that define the structure and input elements of the form. Each field specifies its
/// name, label, type, and optional validation rules. Cannot be null or empty.</param>
/// <param name="Actions">A read-only list of actions available for the form, such as submit and cancel. Must include at least both a submit
/// and a cancel action. Cannot be null or contain fewer than two actions.</param>
public record FormWidget(
    string Title,
    string Action,
    IReadOnlyList<FormField> Fields,
    IReadOnlyList<FormAction> Actions
) : ChatWidget("form", Action)
{

    /// <summary>
    ///<inheritdoc/>
    /// </summary>
    public override string Purpose => """
           **Form Widget** - For collecting structured input
           Format: <widget>{"type":"form","title":"TITLE","action":"action_id","fields":[...],"actions":[...]}</widget>
           Schema: {
                  "name": "form",
                  "description": "Composite form widget with structured fields, nested widgets, validation, and mandatory submit/cancel actions",
                  "parameters": {
                    "title": {
                      "type": "string",
                      "description": "Title of the form"
                    },
                    "fields": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "name": { "type": "string" },
                          "label": { "type": "string" },
                          "type": {
                            "type": "string",
                            "description": "Widget type (text, number, email, dropdown, slider, toggle, fileupload, etc.)"
                          },
                          "required": { "type": "boolean" },
                          "validation": {
                            "type": "string",
                            "description": "Validation hint or regex"
                          }
                        },
                        "required": ["name", "label", "type"]
                      }
                    },
                    "actions": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "type": { "enum": ["submit", "cancel"] },
                          "label": { "type": "string" }
                        },
                        "required": ["type", "label"]
                      },
                      "minItems": 2,
                      "description": "Every form must include both submit and cancel actions"
                    }
                  },
                  "required": ["title", "fields", "actions"]
                }
           Use when: You need to collect multiple pieces of structured data from the user
        """;
}

/// <summary>
/// Represents a field definition for a form, including metadata such as name, label, type, and validation requirements.
/// </summary>
/// <param name="Name">The unique identifier for the form field. Used to reference the field in form data and processing.</param>
/// <param name="Label">The display label for the form field, shown to users in the form UI.</param>
/// <param name="Type">The type of widget or input control to use for the field, such as 'text', 'checkbox', or other supported types.</param>
/// <param name="Required">A value indicating whether the field is required for form submission. Set to <see langword="true"/> if the field
/// must be provided; otherwise, <see langword="false"/>.</param>
/// <param name="ValidationHint">An optional hint or message to assist users in providing valid input for the field. Can be <see langword="null"/> if
/// no hint is provided.</param>
public record FormField(
    string Name,
    string Label,
    string Type, 
    bool Required,
    string? ValidationHint = null
);

/// <summary>
/// Represents an action that can be performed on a form, such as submitting or canceling.
/// </summary>
/// <param name="Type">The type of action to perform. Common values include "submit" and "cancel". This value determines the behavior
/// associated with the form action.</param>
/// <param name="Label">The display label for the action, typically shown on a button or user interface element.</param>
public record FormAction(
    string Type,  
    string Label
);

/// <summary>
/// Extension methods for <see cref="ChatWidget"/> instances.
/// </summary>
public static class ChatWidgetExtensions
{
    extension(ChatWidget widget)
    {
        /// <summary>
        /// Gets the JSON schema for a widget type.
        /// </summary>
        /// <remarks>
        /// The schema describes the structure and properties of the widget type,
        /// enabling tools and utilities to understand widget requirements.
        /// </remarks>
        /// <returns>
        /// A JSON schema as a string representing the structure of this widget type.
        /// </returns>
        public object GetSchema()
        {
            return Serialization.Default.GetJsonSchemaAsNode(widget.GetType()).ToString();
        }

        /// <summary>
        /// Serializes the widget to a JSON string.
        /// </summary>
        /// <remarks>
        /// The resulting JSON includes the type discriminator and all widget properties.
        /// Uses camelCase property naming per the configured JSON serialization options.
        /// </remarks>
        /// <returns>
        /// A JSON string representation of the widget.
        /// </returns>
        public string ToJson()
        {
            return JsonSerializer.Serialize(widget, Serialization.Default);
        }

        /// <summary>
        /// Gets the type name of the widget in lowercase without the "Widget" suffix.
        /// </summary>
        /// <remarks>
        /// For example, a <see cref="ButtonWidget"/> returns "button",
        /// and a <see cref="CardWidget"/> returns "card".
        /// This matches the type discriminator values used in JSON serialization.
        /// </remarks>
        /// <returns>
        /// The normalized type name in lowercase.
        /// </returns>
        public string Type
        {
            get
            {
                return widget.GetType().Name.Replace("Widget", "").ToLowerInvariant();
            }
        }
    }

    extension(ChatWidget)
    {
        /// <summary>
        /// Deserializes a JSON string to a <see cref="ChatWidget"/> instance.
        /// </summary>
        /// <remarks>
        /// The JSON must contain a valid "type" discriminator field indicating which widget type to deserialize to.
        /// If the JSON is invalid or the type discriminator is unrecognized, returns null.
        /// </remarks>
        /// <param name="json">The JSON string to deserialize.</param>
        /// <returns>
        /// A <see cref="ChatWidget"/> instance of the appropriate derived type, or null if deserialization fails.
        /// </returns>
        public static ChatWidget? FromJson(string json)
        {
            return JsonSerializer.Deserialize<ChatWidget?>(json, Serialization.Default);
        }

        /// <summary>
        /// Deserializes a JSON string to a collection of <see cref="ChatWidget"/> instances.
        /// </summary>
        /// <remarks>
        /// The JSON must be an array of widget objects, each with a valid "type" discriminator field.
        /// If the JSON is invalid or any type discriminator is unrecognized, returns null.
        /// </remarks>
        /// <param name="json">The JSON array string to deserialize.</param>
        /// <returns>
        /// A read-only list of <see cref="ChatWidget"/> instances, or null if deserialization fails.
        /// </returns>
        public static IReadOnlyList<ChatWidget>? ListFromJson(string json)
        {
            return JsonSerializer.Deserialize<IReadOnlyList<ChatWidget>?>(json, Serialization.Default);
        }
    }

    extension(IEnumerable<ChatWidget> widgets)
    {
        /// <summary>
        /// Serializes a collection of widgets to a JSON string.
        /// </summary>
        /// <remarks>
        /// The resulting JSON is an array of widget objects, each with its type discriminator.
        /// Uses camelCase property naming per the configured JSON serialization options.
        /// </remarks>
        /// <returns>
        /// A JSON string representation of the widget collection.
        /// </returns>
        public string ToJson()
        {
            return JsonSerializer.Serialize(widgets, Serialization.Default);
        }
    }
}