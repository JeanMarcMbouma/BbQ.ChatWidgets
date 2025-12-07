using System.Text.Json;
using System.Text.Json.Serialization.Metadata;
using BbQ.ChatWidgets.Abstractions;

namespace BbQ.ChatWidgets.Models;

/// <summary>
/// Provides centralized JSON serialization configuration for BbQ ChatWidgets.
/// </summary>
/// <remarks>
/// This static class defines the JSON serialization options used throughout the library.
/// It ensures consistent JSON formatting for:
/// - Widget definitions (including custom widgets)
/// - Chat messages
/// - API requests and responses
/// - Structured AI responses
/// 
/// Configuration:
/// - PropertyNamingPolicy: camelCase (standard for APIs and JavaScript)
/// - WriteIndented: false (compact JSON for network efficiency)
/// - Support for custom widget types via ICustomWidgetRegistry
/// </remarks>
public static class Serialization
{
    private static ICustomWidgetRegistry? _customRegistry;

    /// <summary>
    /// Sets the custom widget registry for custom widget deserialization support.
    /// </summary>
    /// <remarks>
    /// This is set automatically when AddCustomWidgetSupport is called in dependency injection.
    /// The registry allows deserializing custom widget types defined outside the library.
    /// </remarks>
    public static void SetCustomWidgetRegistry(ICustomWidgetRegistry? registry)
    {
        _customRegistry = registry;
    }

    /// <summary>
    /// Gets the default JSON serializer options used by BbQ ChatWidgets.
    /// </summary>
    /// <remarks>
    /// This option instance should be used for all JSON serialization/deserialization
    /// within the library to ensure consistency. It uses:
    /// - camelCase for property names (e.g., "message" instead of "Message")
    /// - Non-indented output for efficiency
    /// - Support for polymorphic type serialization
    /// - Support for custom widget types (if registry is set)
    /// </remarks>
    public static JsonSerializerOptions Default
    {
        get
        {
            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = false,
                TypeInfoResolver = new DefaultJsonTypeInfoResolver()
            };

            // Add extensible converter for custom widget support if registry is available
            if (_customRegistry != null)
            {
                options.Converters.Add(new ExtensibleChatWidgetConverter(_customRegistry));
            }

            return options;
        }
    }
}