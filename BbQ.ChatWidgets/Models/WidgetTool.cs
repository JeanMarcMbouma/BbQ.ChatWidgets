using Microsoft.Extensions.AI;

namespace BbQ.ChatWidgets.Models
{
    /// <summary>
    /// Wraps a <see cref="ChatWidget"/> as an <see cref="AITool"/> for use by language models.
    /// </summary>
    /// <remarks>
    /// This class adapts widget definitions to the Microsoft.Extensions.AI tool format,
    /// allowing AI models to:
    /// - Discover available widget types
    /// - Understand widget structure via JSON schemas
    /// - Generate proper JSON for widget embedding
    /// 
    /// Each tool includes:
    /// - <c>Name</c>: The widget type (e.g., "button", "card")
    /// - <c>Description</c>: Human-readable description
    /// - <c>Schema</c>: JSON schema for the widget type
    /// </remarks>
    public sealed class WidgetTool(
        /// <summary>
        /// The widget that this tool represents.
        /// </summary>
        ChatWidget widget) : AITool
    {
        /// <summary>
        /// Gets the name of this tool, which is the widget type.
        /// </summary>
        public override string Name => widget.Type;

        /// <summary>
        /// Gets a human-readable description of this tool.
        /// </summary>
        /// <remarks>
        /// The description includes the widget type, label, and action,
        /// providing context about what the widget does.
        /// </remarks>
        public override string Description => $"An interactive widget of type {widget.Type} with label '{widget.Label}' and action '{widget.Action}'.";

        /// <summary>
        /// Gets additional properties for this tool, including the JSON schema.
        /// </summary>
        /// <remarks>
        /// The schema is generated dynamically from the widget type and provides
        /// detailed information about required and optional parameters.
        /// </remarks>
        public override IReadOnlyDictionary<string, object?> AdditionalProperties => new Dictionary<string, object?>
        {
            ["schema"] = widget.GetSchema()
        };
    }
}
