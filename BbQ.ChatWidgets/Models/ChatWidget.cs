using System.Text.Json.Schema;
using System.Text.Json.Serialization;

namespace BbQ.ChatWidgets.Models;

/// <summary>
/// Base class for all interactive chat widgets.
/// </summary>
/// <remarks>
/// Widgets are interactive UI elements that can be embedded in AI chat responses.
/// This base class defines common properties that all widgets must have:
/// - <c>Type</c>: Identifies the widget kind for JSON deserialization and rendering
/// - <c>Label</c>: Display text for the widget
/// - <c>Action</c>: Identifier for the action triggered when user interacts with widget
/// 
/// Specific widget types extend this base with additional properties relevant to their functionality.
/// The class uses JSON polymorphism to automatically deserialize to the correct type.
/// </remarks>
[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(ButtonWidget), "button")]
[JsonDerivedType(typeof(CardWidget), "card")]
[JsonDerivedType(typeof(InputWidget), "input")]
[JsonDerivedType(typeof(DropdownWidget), "dropdown")]
[JsonDerivedType(typeof(SliderWidget), "slider")]
[JsonDerivedType(typeof(ToggleWidget), "toggle")]
[JsonDerivedType(typeof(FileUploadWidget), "fileupload")]
public abstract record ChatWidget(
    /// <summary>
    /// The type identifier for this widget, used for JSON deserialization and rendering.
    /// </summary>
    [property: JsonPropertyName("type")]
    string Type, 
    
    /// <summary>
    /// The label or text displayed to the user for this widget.
    /// </summary>
    string Label, 
    
    /// <summary>
    /// The action identifier triggered when the user interacts with this widget.
    /// </summary>
    string Action);

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
    /// <summary>
    /// The text displayed on the button.
    /// </summary>
    string Label, 
    
    /// <summary>
    /// The action identifier triggered when the button is clicked.
    /// </summary>
    string Action)
    : ChatWidget("button", Label, Action);

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
    /// <summary>
    /// The label for the card's action button.
    /// </summary>
    string Label, 
    
    /// <summary>
    /// The action identifier triggered when the card is activated.
    /// </summary>
    string Action, 
    
    /// <summary>
    /// The title displayed at the top of the card.
    /// </summary>
    string Title, 
    
    /// <summary>
    /// Optional descriptive text displayed below the title.
    /// </summary>
    string? Description = null, 
    
    /// <summary>
    /// Optional URL for an image displayed in the card.
    /// </summary>
    string? ImageUrl = null)
    : ChatWidget("card", Label, Action);

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
    /// <summary>
    /// The label for the input field.
    /// </summary>
    string Label, 
    
    /// <summary>
    /// The action identifier triggered when the user submits the input.
    /// </summary>
    string Action, 
    
    /// <summary>
    /// Optional placeholder text shown when the input is empty.
    /// </summary>
    string? Placeholder = null, 
    
    /// <summary>
    /// Optional maximum number of characters allowed in the input.
    /// </summary>
    int? MaxLength = null)
    : ChatWidget("input", Label, Action);

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
    /// <summary>
    /// The label for the dropdown.
    /// </summary>
    string Label, 
    
    /// <summary>
    /// The action identifier triggered when an option is selected.
    /// </summary>
    string Action, 
    
    /// <summary>
    /// The list of options available for selection.
    /// </summary>
    IReadOnlyList<string> Options)
    : ChatWidget("dropdown", Label, Action);

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
    /// <summary>
    /// The label for the slider.
    /// </summary>
    string Label, 
    
    /// <summary>
    /// The action identifier triggered when the slider value changes.
    /// </summary>
    string Action, 
    
    /// <summary>
    /// The minimum value of the range.
    /// </summary>
    int Min, 
    
    /// <summary>
    /// The maximum value of the range.
    /// </summary>
    int Max, 
    
    /// <summary>
    /// The increment between values (step size).
    /// </summary>
    int Step, 
    
    /// <summary>
    /// Optional default value. If not specified, defaults to the minimum value.
    /// </summary>
    int? Default = null)
    : ChatWidget("slider", Label, Action);

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
    /// <summary>
    /// The label for the toggle.
    /// </summary>
    string Label, 
    
    /// <summary>
    /// The action identifier triggered when the toggle state changes.
    /// </summary>
    string Action, 
    
    /// <summary>
    /// The initial state of the toggle (true = checked/enabled, false = unchecked/disabled).
    /// </summary>
    bool DefaultValue)
    : ChatWidget("toggle", Label, Action);

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
    /// <summary>
    /// The label for the file upload input.
    /// </summary>
    string Label, 
    
    /// <summary>
    /// The action identifier triggered when a file is selected for upload.
    /// </summary>
    string Action, 
    
    /// <summary>
    /// Optional file type filter (e.g., ".pdf,.docx" or "image/*").
    /// Corresponds to the HTML accept attribute.
    /// </summary>
    string? Accept = null, 
    
    /// <summary>
    /// Optional maximum file size in bytes. The system should enforce this limit.
    /// </summary>
    long? MaxBytes = null)
    : ChatWidget("fileupload", Label, Action);

/// <summary>
/// Extension methods for <see cref="ChatWidget"/> instances.
/// </summary>
public static class ChatWidgetExtensions
{
    /// <summary>
    /// Gets the JSON schema for a widget type.
    /// </summary>
    /// <remarks>
    /// The schema describes the structure and properties of the widget type,
    /// enabling tools and utilities to understand widget requirements.
    /// </remarks>
    /// <param name="widget">The widget instance to get the schema for.</param>
    /// <returns>
    /// A JSON schema as a string representing the structure of this widget type.
    /// </returns>
    public static object GetSchema(this ChatWidget widget)
    {
        return Serialization.Default.GetJsonSchemaAsNode(widget.GetType()).ToString();
    }
}