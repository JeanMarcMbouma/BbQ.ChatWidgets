using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Models;
using System.Collections.Concurrent;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// Registry for custom widget types enabling runtime extensibility.
/// </summary>
/// <remarks>
/// This registry allows applications to register custom ChatWidget types at runtime
/// without modifying the library. Custom widgets can then be serialized and deserialized
/// just like built-in widgets.
/// </remarks>
public sealed class CustomWidgetRegistry : ICustomWidgetRegistry
{
    private readonly ConcurrentDictionary<string, Type> _discriminatorToType = new();
    private readonly ConcurrentDictionary<Type, string> _typeToDiscriminator = new();

    /// <summary>
    /// Initializes a new instance with no pre-registered types.
    /// </summary>
    public CustomWidgetRegistry()
    {
    }

    public void Register(Type widgetType, string discriminator)
    {
        if (widgetType == null)
            throw new ArgumentNullException(nameof(widgetType));

        if (!typeof(ChatWidget).IsAssignableFrom(widgetType))
            throw new ArgumentException(
                $"Type '{widgetType.Name}' must inherit from ChatWidget.",
                nameof(widgetType));

        if (string.IsNullOrWhiteSpace(discriminator))
            throw new ArgumentException("Discriminator cannot be null or empty.", nameof(discriminator));

        if (_typeToDiscriminator.TryGetValue(widgetType, out var existing) && existing != discriminator)
            throw new InvalidOperationException(
                $"Type '{widgetType.Name}' is already registered with discriminator '{existing}'.");

        if (_discriminatorToType.TryGetValue(discriminator, out var existingType) && existingType != widgetType)
            throw new InvalidOperationException(
                $"Discriminator '{discriminator}' is already registered for type '{existingType.Name}'.");

        _discriminatorToType[discriminator] = widgetType;
        _typeToDiscriminator[widgetType] = discriminator;
    }

    public void Register(Type widgetType)
    {
        if (widgetType == null)
            throw new ArgumentNullException(nameof(widgetType));

        var discriminator = widgetType.Name.Replace("Widget", "").ToLowerInvariant();
        Register(widgetType, discriminator);
    }

    public void Register<T>(string discriminator) where T : ChatWidget
    {
        Register(typeof(T), discriminator);
    }

    public void Register<T>() where T : ChatWidget
    {
        Register(typeof(T));
    }

    public Type? GetWidgetType(string discriminator)
    {
        if (string.IsNullOrWhiteSpace(discriminator))
            return null;

        _discriminatorToType.TryGetValue(discriminator, out var type);
        return type;
    }

    public string? GetDiscriminator(Type widgetType)
    {
        if (widgetType == null)
            return null;

        _typeToDiscriminator.TryGetValue(widgetType, out var discriminator);
        return discriminator;
    }

    public IReadOnlyDictionary<string, Type> GetAllRegistrations() => _discriminatorToType;
}
