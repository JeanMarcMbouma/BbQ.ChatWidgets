using System.Text.Json;
using System.Text.Json.Serialization;
using BbQ.ChatWidgets.Abstractions;

namespace BbQ.ChatWidgets.Models;

/// <summary>
/// Custom JSON converter for ChatWidget that supports both built-in and custom widgets.
/// </summary>
/// <remarks>
/// This converter enables deserialization of any ChatWidget type, including custom ones
/// registered in ICustomWidgetRegistry. It works alongside the standard JsonPolymorphic
/// attributes to provide seamless extensibility.
/// </remarks>
public sealed class ExtensibleChatWidgetConverter : JsonConverter<ChatWidget>
{
    private readonly ICustomWidgetRegistry? _customRegistry;

    /// <summary>
    /// Initializes a new converter with optional custom widget registry.
    /// </summary>
    public ExtensibleChatWidgetConverter(ICustomWidgetRegistry? customRegistry = null)
    {
        _customRegistry = customRegistry;
    }

    public override ChatWidget? Read(
        ref Utf8JsonReader reader,
        Type typeToConvert,
        JsonSerializerOptions options)
    {
        if (reader.TokenType != JsonTokenType.StartObject)
            throw new JsonException("Expected JSON object.");

        using var doc = JsonDocument.ParseValue(ref reader);
        var root = doc.RootElement;

        // Extract the "type" discriminator
        if (!root.TryGetProperty("type", out var typeElement))
            throw new JsonException("Widget JSON must contain 'type' field.");

        var discriminator = typeElement.GetString();
        if (string.IsNullOrWhiteSpace(discriminator))
            throw new JsonException("Widget 'type' cannot be empty.");

        // Try to find the type
        Type? targetType = null;

        // First, try custom registry
        if (_customRegistry != null)
        {
            targetType = _customRegistry.GetWidgetType(discriminator);
        }

        // Fall back to built-in types
        targetType ??= GetBuiltInWidgetType(discriminator);

        if (targetType == null)
            throw new JsonException($"Unknown widget type: '{discriminator}'.");

        // Deserialize as the target type
        var json = doc.RootElement.GetRawText();
        var widget = JsonSerializer.Deserialize(json, targetType, options) as ChatWidget;

        return widget;
    }

    public override void Write(
        Utf8JsonWriter writer,
        ChatWidget value,
        JsonSerializerOptions options)
    {
        // Use the default serialization
        JsonSerializer.Serialize(writer, value, value.GetType(), options);
    }

    /// <summary>
    /// Maps built-in widget discriminators to types.
    /// </summary>
    private static Type? GetBuiltInWidgetType(string discriminator) =>
        discriminator switch
        {
            "button" => typeof(ButtonWidget),
            "card" => typeof(CardWidget),
            "input" => typeof(InputWidget),
            "dropdown" => typeof(DropdownWidget),
            "slider" => typeof(SliderWidget),
            "toggle" => typeof(ToggleWidget),
            "fileupload" => typeof(FileUploadWidget),
            "themeswitcher" => typeof(ThemeSwitcherWidget),
            "datepicker" => typeof(DatePickerWidget),
            "multiselect" => typeof(MultiSelectWidget),
            "progressbar" => typeof(ProgressBarWidget),
            _ => null
        };
}
