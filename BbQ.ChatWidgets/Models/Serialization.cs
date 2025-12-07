using System.Text.Json;
using System.Text.Json.Serialization.Metadata;

namespace BbQ.ChatWidgets.Models;

/// <summary>
/// Provides centralized JSON serialization configuration for BbQ ChatWidgets.
/// </summary>
/// <remarks>
/// This static class defines the JSON serialization options used throughout the library.
/// It ensures consistent JSON formatting for:
/// - Widget definitions
/// - Chat messages
/// - API requests and responses
/// - Structured AI responses
/// 
/// Configuration:
/// - PropertyNamingPolicy: camelCase (standard for APIs and JavaScript)
/// - WriteIndented: false (compact JSON for network efficiency)
/// - TypeInfoResolver: DefaultJsonTypeInfoResolver (supports polymorphic types)
/// </remarks>
public static class Serialization
{
    /// <summary>
    /// Gets the default JSON serializer options used by BbQ ChatWidgets.
    /// </summary>
    /// <remarks>
    /// This option instance should be used for all JSON serialization/deserialization
    /// within the library to ensure consistency. It uses:
    /// - camelCase for property names (e.g., "message" instead of "Message")
    /// - Non-indented output for efficiency
    /// - Support for polymorphic type serialization
    /// </remarks>
    public static readonly JsonSerializerOptions Default = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
        TypeInfoResolver = new DefaultJsonTypeInfoResolver()
    };
}