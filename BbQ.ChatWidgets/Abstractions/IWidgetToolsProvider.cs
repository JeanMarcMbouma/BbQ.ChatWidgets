using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Abstractions;

/// <summary>
/// Defines the contract for providing AI tool definitions for all available widget types.
/// </summary>
/// <remarks>
/// This interface provides a way for chat clients to discover what widgets are available
/// and how to use them. The tools are passed to AI models via the library configuration (for example, <see cref="BbQChatOptions.WidgetToolsProviderFactory"/>)
/// to enable the model to understand and use widgets.
/// 
/// Each tool includes:
/// - <c>Name</c>: The widget type identifier (e.g., "button", "card", "dropdown")
/// - <c>Description</c>: Human-readable description of the widget
/// - <c>Schema</c>: JSON schema describing the widget's parameters
/// 
/// By providing these tools to the AI, the model can:
/// - Understand what widgets are available
/// - Know the required and optional parameters for each widget
/// - Generate proper JSON for widget embedding
/// - Embed widgets appropriately in responses
/// </remarks>
public interface IWidgetToolsProvider
{
    /// <summary>
    /// Gets all available widget tools that the AI model can use.
    /// </summary>
    /// <remarks>
    /// Tools are typically cached after the first call for performance.
    /// Each tool represents a widget type with its schema and description.
    /// 
    /// The returned tools should include all widget types the system supports:
    /// - Button
    /// - Card
    /// - Input
    /// - Dropdown
    /// - Slider
    /// - Toggle
    /// - FileUpload
    /// 
    /// Implementations may:
    /// - Return a fixed set of tools
    /// - Dynamically generate tools from a registry
    /// - Filter tools based on configuration
    /// - Cache results for performance
    /// </remarks>
    /// <returns>
    /// A read-only list of <see cref="WidgetTool"/> instances available for use.
    /// The list should not be null but may be empty if no tools are available.
    /// </returns>
    IReadOnlyList<WidgetTool> GetTools();
}
