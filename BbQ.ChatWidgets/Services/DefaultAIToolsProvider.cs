using BbQ.ChatWidgets.Abstractions;
using Microsoft.Extensions.AI;

namespace BbQ.ChatWidgets.Services
{
    /// <summary>
    /// Provides default AI tools for the chat widget system.
    /// </summary>
    /// <remarks>
    /// Applications can supply additional callable tools. No placeholder tools are
    /// exposed by default: widget repair is handled by emit_widgets diagnostics.
    /// 
    /// Implements <see cref="IAIToolsProvider"/> and can be overridden by custom implementations
    /// via <see cref="BbQChatOptions.ToolProviderFactory"/>.
    /// </remarks>
    public sealed class DefaultAIToolsProvider : IAIToolsProvider
    {
        /// <summary>
        /// Gets the list of available AI tools.
        /// </summary>
        /// <remarks>
        /// The default list is empty. A retry tool that only returns an instruction
        /// cannot perform a repair and can distract a model from the real widget tool.
        /// </remarks>
        /// <returns>
        /// A read-only list of <see cref="AITool"/> instances representing available tools.
        /// </returns>
        public IReadOnlyList<AITool> GetAITools() => [];
    }
}
