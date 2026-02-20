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

    internal string? OverrideTypeId { get; set; }
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
           **Button Widget** — Single action with no payload

           Use when:
           - You want the user to trigger an action immediately (approve, retry, confirm, open, etc.).

           Avoid when:
           - You need to collect any input; use a `FormWidget` with fields instead.

           JSON:
           <widget>{"type":"button","label":"ACTION_LABEL","action":"action_id"}</widget>
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
           **Card Widget** — Rich preview + click/CTA action

           Use when:
           - You want to showcase an item (product, recommendation, article, profile) with a title.
           - You want optional supporting text (`description`) and/or an image (`imageUrl`).

           Notes:
           - The `action` is triggered when the user interacts with the card / CTA.

           JSON:
           <widget>{"type":"card","label":"VIEW_DETAILS","action":"view_details","title":"TITLE","description":"OPTIONAL_DESCRIPTION","imageUrl":"https://..."}</widget>
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
    int? MaxLength = 100)
    : ChatWidget(Label, Action)
{

    /// <summary>
    ///<inheritdoc/>
    /// </summary>
    public override string Purpose => """
           **Input Widget** — Single-line text field (MUST be used inside a `FormWidget`)
           Use when:
           - You need short text (name, email, search query, ID, etc.).
           - Use 'maxLength' to enforce limits and guide user input. Its value cannot be 0 or negative.
           Avoid when:
           - The input is multi-line; use `TextAreaWidget`.
           - You need multiple fields; use a single `FormWidget` with multiple fields.
           JSON (field-style, inside a form):
           <widget>{"type":"form","title":"...","action":"form_action","fields":[{"name":"fieldName","label":"LABEL","type":"input","required":true,"validationHint":"..."}],"actions":[{"type":"button","label":"Submit"},{"type":"button","label":"Cancel"}]}</widget>
           If used standalone (not recommended), the widget JSON is:
           <widget>{"type":"input","label":"LABEL","action":"action_id","placeholder":"PLACEHOLDER","maxLength":100}</widget>
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
    int? MaxLength = 500,
    int? Rows = 3)
    : ChatWidget(Label, Action)
{

    /// <summary>
    ///<inheritdoc/>
    /// </summary>
    public override string Purpose => """
           **TextArea Widget** — Multi-line text field (MUST be used inside a `FormWidget`)
           Use when:
           - You need longer/freeform text (feedback, description, comments, notes, biography, etc.).
           Tips:
           - Use `rows` to guide visible height.
           - Use 'maxLength' to enforce limits and guide user input. Its value cannot be 0 or negative.
           JSON (field-style, inside a form):
           <widget>{"type":"form","title":"...","action":"form_action","fields":[{"name":"message","label":"Message","type":"textarea","required":true,"validationHint":"..."}],"actions":[{"type":"button","label":"Send"},{"type":"button","label":"Cancel"}]}</widget>
           If used standalone (not recommended), the widget JSON is:
           <widget>{"type":"textarea","label":"LABEL","action":"action_id","placeholder":"PLACEHOLDER","maxLength":500,"rows":5}</widget>
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
           **Dropdown Widget** — Choose exactly one option (MUST be used inside a `FormWidget`)
           Use when:
           - The user must pick one value from a predefined list (3+ options).
           Avoid when:
           - Multiple selections are allowed; use `MultiSelectWidget`.
           JSON:
           <widget>{"type":"dropdown","label":"LABEL","action":"action_id","options":["Option1","Option2","Option3"]}</widget>
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
           **Slider Widget** — Numeric value in a range (MUST be used inside a `FormWidget`)
           Use when:
           - You need a bounded numeric input with a clear min/max (volume, rating, percentage).
           Tips:
           - Keep `step` meaningful (e.g., 1, 5, 10).
           JSON:
           <widget>{"type":"slider","label":"LABEL","action":"action_id","min":0,"max":100,"step":5,"default":50}</widget>
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
           **Toggle Widget** — Boolean on/off (MUST be used inside a `FormWidget`)
           Use when:
           - A single yes/no or enabled/disabled choice is needed.
           JSON:
           <widget>{"type":"toggle","label":"LABEL","action":"action_id","defaultValue":false}</widget>
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
           **FileUpload Widget** — Upload one file (MUST be used inside a `FormWidget`)

           Use when:
           - You need the user to attach a document/image.
           Tips:
           - Use `accept` to constrain extensions/MIME types.
           - Use `maxBytes` to enforce a size limit.
           JSON:
           <widget>{"type":"fileupload","label":"LABEL","action":"action_id","accept":".pdf,.doc,.docx","maxBytes":5000000}</widget>
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
           **ThemeSwitcher Widget** — Pick one theme option
           Use when:
           - You want the user to choose UI theme (light/dark/system/auto) or a named theme.
           JSON:
           <widget>{"type":"themeswitcher","label":"LABEL","action":"action_id","themes":["light","dark","system"]}</widget>
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
           **DatePicker Widget** — Select a date (MUST be used inside a `FormWidget`)
           Use when:
           - You need a specific date (appointment, deadline, birthday) optionally constrained by range.
           Format:
           - `minDate` / `maxDate` should be `YYYY-MM-DD`.
           JSON:
           <widget>{"type":"datepicker","label":"LABEL","action":"action_id","minDate":"2024-01-01","maxDate":"2024-12-31"}</widget>
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
           **MultiSelect Widget** — Choose multiple options (MUST be used inside a `FormWidget`)
           Use when:
           - The user can select 0..N items from a predefined list (tags, categories, filters).
           Avoid when:
           - Exactly one selection is required; use `DropdownWidget`.
           JSON:
           <widget>{"type":"multiselect","label":"LABEL","action":"action_id","options":["Option1","Option2","Option3"]}</widget>
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
           **ProgressBar Widget** — Read-only progress indicator
           Use when:
           - You want to show progress for a long-running step (upload, processing, multi-step flow).
           Notes:
           - This widget typically gets updated by the backend over time (e.g., streaming/SSE).
           JSON:
           <widget>{"type":"progressbar","label":"LABEL","action":"action_id","value":50,"max":100}</widget>
        """;
}

/// <summary>
/// Displays a single image.
/// </summary>
/// <remarks>
/// Use this widget when you want to show one image inline in a chat response.
/// For a gallery of images, use <see cref="ImageCollectionWidget"/>.
/// 
/// Example JSON:
/// {"type":"image","label":"Open","action":"open_image","imageUrl":"https://...","alt":"Optional alt","width":320,"height":180}
/// </remarks>
public sealed record ImageWidget(
    string Label,
    string Action,
    string ImageUrl,
    string? Alt = null,
    int? Width = null,
    int? Height = null)
    : ChatWidget(Label, Action)
{
    /// <summary>
    /// <inheritdoc/>
    /// </summary>
    public override string Purpose => """
           **Image Widget** — Display a single image (no input)

           Use when:
           - You want to show exactly one image inline (diagram, screenshot, product photo).

           Avoid when:
           - You need a grid/list of images; use `ImageCollectionWidget`.
           - You need title/description/CTA; use `CardWidget`.

           Notes:
           - `imageUrl` is required.
           - `alt` is recommended for accessibility.
           - `width`/`height` are optional sizing hints.
           - `action` can be used to open the image or trigger follow-up.

           JSON:
           <widget>{"type":"image","label":"LABEL","action":"action_id","imageUrl":"https://...","alt":"ALT_TEXT","width":320,"height":180}</widget>
        """;
}

/// <summary>
/// Displays a collection of images (gallery).
/// </summary>
/// <remarks>
/// Use this widget when you want to present multiple images as a grid/gallery.
/// 
/// Example JSON:
/// {"type":"imagecollection","label":"Gallery","action":"open_gallery","images":[{"imageUrl":"https://...","alt":"...","action":"open_1"}]}
/// </remarks>
public sealed record ImageCollectionWidget(
    string Label,
    string Action,
    IReadOnlyList<ImageItem> Images)
    : ChatWidget(Label, Action)
{
    /// <summary>
    /// <inheritdoc/>
    /// </summary>
    public override string Purpose => """
           **ImageCollection Widget** — Display multiple images (gallery)

           Use when:
           - You want to show 2+ images (product gallery, before/after, photo set, steps).

           Avoid when:
           - You only have one image; use `ImageWidget`.
           - You need per-item rich text; use multiple `CardWidget`s.

           Notes:
           - `images` must contain at least one item.
           - Each image item can optionally define its own `action`; otherwise the parent `action` is used.

           JSON:
           <widget>{"type":"imagecollection","label":"LABEL","action":"action_id","images":[{"imageUrl":"https://...","alt":"ALT","action":"item_action","width":320,"height":180}]}</widget>
        """;
}

/// <summary>
/// An image item for use inside an <see cref="ImageCollectionWidget"/>.
/// </summary>
public sealed record ImageItem(
    string ImageUrl,
    string? Alt = null,
    string? Action = null,
    int? Width = null,
    int? Height = null);

/// <summary>
/// Represents a composite form widget used to collect structured input from users, including multiple fields and
/// associated actions such as submit and cancel.
/// </summary>
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
           **Form Widget** — Collect multiple fields and submit/cancel as one interaction
           Use when:
           - You need ANY input-like widgets (input/textarea/dropdown/slider/toggle/fileupload/datepicker/multiselect).
           - You need multiple values at once and want a single submit action.
           Required rules:
           - Provide `fields` (at least 1).
           - Provide `actions` INCLUDING BOTH a `submit` and a `cancel`.
           - Each field must include: `name`, `label`, `type`, `required`.
           Field `type` values commonly used:
           - `input`, `textarea`, `dropdown`, `slider`, `toggle`, `fileupload`, `datepicker`, `multiselect`
           JSON:
           <widget>{"type":"form","title":"TITLE","action":"action_id","fields":[{"name":"email","label":"Email","type":"input","required":true,"validationHint":"user@domain.com"}],"actions":[{"type":"submit","label":"Submit"},{"type":"cancel","label":"Cancel"}]}</widget>
        """;
}

/// <summary>
/// Represents a field definition for a form, including metadata such as name, label, type, and validation requirements.
/// This class supports JSON extension data to allow any registered widget to be deserialized as a form field.
/// </summary>
public class FormField
{
    /// <summary>
    /// The unique identifier for the form field. Used to reference the field in form data and processing.
    /// </summary>
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// The display label for the form field, shown to users in the form UI.
    /// </summary>
    [JsonPropertyName("label")]
    public string Label { get; set; } = string.Empty;

    /// <summary>
    /// The type of widget or input control to use for the field, such as 'input', 'dropdown', or other supported widget types.
    /// </summary>
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// A value indicating whether the field is required for form submission. Set to <see langword="true"/> if the field
    /// must be provided; otherwise, <see langword="false"/>.
    /// </summary>
    [JsonPropertyName("required")]
    public bool Required { get; set; }

    /// <summary>
    /// An optional hint or message to assist users in providing valid input for the field. Can be <see langword="null"/> if
    /// no hint is provided.
    /// </summary>
    [JsonPropertyName("validationHint")]
    public string? ValidationHint { get; set; }

    /// <summary>
    /// Stores additional JSON properties that are not explicitly defined, allowing any registered widget's properties
    /// to be captured and later deserialized.
    /// </summary>
    [JsonExtensionData]
    public Dictionary<string, JsonElement>? ExtensionData { get; set; }

    /// <summary>
    /// Default constructor for JSON deserialization.
    /// </summary>
    public FormField() { }

    /// <summary>
    /// Creates a new FormField instance.
    /// </summary>
    /// <param name="name">The unique identifier for the form field.</param>
    /// <param name="label">The display label for the form field.</param>
    /// <param name="type">The type of widget or input control to use for the field.</param>
    /// <param name="required">A value indicating whether the field is required for form submission.</param>
    /// <param name="validationHint">An optional hint or message to assist users in providing valid input.</param>
    public FormField(string name, string label, string type, bool required, string? validationHint = null)
    {
        Name = name;
        Label = label;
        Type = type;
        Required = required;
        ValidationHint = validationHint;
    }

    /// <summary>
    /// Deserializes this FormField to the appropriate ChatWidget based on the Type property.
    /// </summary>
    /// <remarks>
    /// This method constructs a widget from the FormField properties and extension data.
    /// The widget's Action property is set to the FormField's Name to maintain field identity
    /// when handling widget actions within forms.
    /// </remarks>
    /// <returns>The deserialized ChatWidget, or null if deserialization fails.</returns>
    public ChatWidget? ToWidget()
    {
        try
        {
            // Build a JSON object with the type and all extension data
            var jsonObject = new Dictionary<string, object?>();
            jsonObject["type"] = Type;
            jsonObject["label"] = Label;
            jsonObject["action"] = Name; // Use field name as action for field identity

            // Copy extension data - convert JsonElement to actual values
            if (ExtensionData != null)
            {
                foreach (var kvp in ExtensionData)
                {
                    // Convert JsonElement to the appropriate type
                    var element = kvp.Value;
                    object? value = element.ValueKind switch
                    {
                        JsonValueKind.String => element.GetString(),
                        JsonValueKind.Number => element.TryGetInt32(out var i) ? i : element.GetDouble(),
                        JsonValueKind.True => true,
                        JsonValueKind.False => false,
                        JsonValueKind.Null => null,
                        JsonValueKind.Array => JsonSerializer.Deserialize<object[]>(element.GetRawText(), Serialization.Default),
                        JsonValueKind.Object => JsonSerializer.Deserialize<Dictionary<string, object?>>(element.GetRawText(), Serialization.Default),
                        _ => element.GetRawText()
                    };
                    jsonObject[kvp.Key] = value;
                }
            }

            var json = JsonSerializer.Serialize(jsonObject, Serialization.Default);
            return ChatWidget.FromJson(json);
        }
        catch (Exception ex)
        {
            // Log the error for debugging - in production environments, this should use a proper logging framework
            System.Diagnostics.Debug.WriteLine($"Failed to deserialize FormField '{Name}' of type '{Type}': {ex.Message}");
            return null;
        }
    }
}

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
                return widget.OverrideTypeId ?? widget.GetType().Name.Replace("Widget", "").ToLowerInvariant();
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