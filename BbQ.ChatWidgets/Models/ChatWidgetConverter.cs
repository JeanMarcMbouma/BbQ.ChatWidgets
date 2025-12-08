using BbQ.ChatWidgets.Abstractions;
using System.Collections.Concurrent;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace BbQ.ChatWidgets.Models;

/// <summary>
/// Custom JSON converter for ChatWidget that handles both built-in and custom widgets.
/// </summary>
/// <remarks>
/// This converter enables polymorphic deserialization of ChatWidget types, including custom ones
/// registered in ICustomWidgetRegistry. It works alongside the standard JsonPolymorphic
/// attributes for built-in types but provides fallback support for custom widgets.
/// </remarks>
public sealed class ChatWidgetConverter : JsonConverter<ChatWidget>
{
    private readonly ICustomWidgetRegistry? _customRegistry;
    private static readonly ConcurrentDictionary<string, JsonSerializerOptions> _serializerOptionsCache = new();

    public ChatWidgetConverter(ICustomWidgetRegistry? customRegistry = null)
    {
        _customRegistry = customRegistry;
    }

    public override bool CanConvert(Type typeToConvert)
    {
        // Handle ChatWidget and all derived types
        return typeof(ChatWidget).IsAssignableFrom(typeToConvert);
    }

    public override ChatWidget? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
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

        // Determine the target type
        Type? targetType = GetBuiltInWidgetType(discriminator);

        // If not built-in, try custom registry
        if (targetType == null && _customRegistry != null)
        {
            targetType = _customRegistry.GetWidgetType(discriminator);
        }

        if (targetType == null)
            throw new JsonException($"Unknown widget type: '{discriminator}'.");

        // Deserialize as the target type, using options without this converter to avoid infinite recursion
        var json = root.GetRawText();
        JsonSerializerOptions optionsToUse;
        if (_serializerOptionsCache.TryGetValue(discriminator, out var cachedOptions))
        {
            optionsToUse = cachedOptions;
        }
        else
        {
            var optionsWithoutConverter = new JsonSerializerOptions(options);
            var convertersToKeep = options.Converters
                .Where(c => c is not ChatWidgetConverter)
                .ToList();
            optionsWithoutConverter.Converters.Clear();
            foreach (var converter in convertersToKeep)
            {
                optionsWithoutConverter.Converters.Add(converter);
            }
            _serializerOptionsCache[discriminator] = optionsWithoutConverter;
            optionsToUse = optionsWithoutConverter;
        }
        var widget = JsonSerializer.Deserialize(json, targetType, optionsToUse) as ChatWidget;

        return widget;
    }

    public override void Write(Utf8JsonWriter writer, ChatWidget value, JsonSerializerOptions options)
    {
        // Create options without this converter to avoid recursion
        if (value == null)
        {
            writer.WriteNullValue();
            return;
        }
        JsonSerializerOptions jsonSerializerOptions;
        if (_serializerOptionsCache.TryGetValue(value.Type, out var cachedOptions))
        {
            jsonSerializerOptions = cachedOptions;
        }
        else
        {
            var optionsWithoutConverter = new JsonSerializerOptions(options);
            var convertersToKeep = options.Converters
                .Where(c => c is not ChatWidgetConverter)
                .ToList();
            optionsWithoutConverter.Converters.Clear();
            foreach (var converter in convertersToKeep)
            {
                optionsWithoutConverter.Converters.Add(converter);
            }
            _serializerOptionsCache[value.Type] = optionsWithoutConverter;
            jsonSerializerOptions = optionsWithoutConverter;
        }

        // Get the JSON for the derived type
        var tempJson = JsonSerializer.Serialize(value, value.GetType(), jsonSerializerOptions);
        using var jsonDoc = JsonDocument.Parse(tempJson);
        var tempElement = jsonDoc.RootElement;

        // Write the object with the type discriminator added
        writer.WriteStartObject();
        writer.WriteString("type", value.Type);

        // Copy all existing properties
        foreach (var property in tempElement.EnumerateObject())
        {
            writer.WritePropertyName(property.Name);
            property.Value.WriteTo(writer);
        }

        writer.WriteEndObject();
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
