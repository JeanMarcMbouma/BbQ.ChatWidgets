using Microsoft.Extensions.AI;

namespace BbQ.ChatWidgets.Abstractions;

/// <summary>
/// Provides custom AI tools that can be used by the chat client.
/// </summary>
/// <remarks>
/// Implement this interface to provide additional tools beyond the built-in widget tools.
/// Custom tools allow the AI to perform specialized operations like:
/// - Database queries
/// - External API calls
/// - Custom calculations
/// - Data transformations
///
/// The provided tools are passed to the AI chat client, which can choose to invoke them
/// as part of its response generation.
///
/// Example implementation:
/// <code>
/// public class WeatherToolProvider : IAIToolsProvider
/// {
///     public IReadOnlyList&lt;AITool&gt; GetAITools()
///     {
///         var weatherTool = AIFunctionFactory.Create(
///             (string location) => GetWeatherForLocation(location),
///             new AIFunctionFactoryOptions
///             {
///                 Name = "get_weather",
///                 Description = "Get current weather for a location"
///             });
///
///         return new[] { weatherTool };
///     }
///
///     private string GetWeatherForLocation(string location)
///     {
///         // Call weather API
///         return "Sunny, 72°F";
///     }
/// }
/// </code>
/// </remarks>
public interface IAIToolsProvider
{
    /// <summary>
    /// Gets the list of AI tools available for the chat client.
    /// </summary>
    /// <remarks>
    /// This method is called when preparing the chat request to the AI client.
    /// The returned tools are passed in the ChatOptions along with widget tools.
    ///
    /// Implementations can:
    /// - Cache tools after first call for performance
    /// - Generate tools dynamically based on configuration
    /// - Filter tools based on permissions or context
    /// - Return an empty list if no custom tools are available
    /// </remarks>
    /// <returns>A read-only list of AITool instances available for the AI client.</returns>
    IReadOnlyList<AITool> GetAITools();
}
