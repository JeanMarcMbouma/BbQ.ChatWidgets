using BbQ.ChatWidgets.Abstractions;
using Microsoft.Extensions.AI;

namespace BbQ.ChatWidgets.Services
{
    /// <summary>
    /// Provides default AI tools for the chat widget system.
    /// </summary>
    /// <remarks>
    /// This provider supplies a basic set of AI-callable tools that extend the AI's capabilities
    /// beyond the standard widget tools. Currently provides a retry tool to allow the AI to
    /// explicitly request retry operations when needed.
    /// 
    /// Implements <see cref="IAIToolsProvider"/> and can be overridden by custom implementations
    /// via <see cref="BbQChatOptions.ToolProviderFactory"/>.
    /// </remarks>
    public sealed class DefaultAIToolsProvider : IAIToolsProvider
    {
        private AITool[]? _tools;

        /// <summary>
        /// Gets the list of available AI tools.
        /// </summary>
        /// <remarks>
        /// This method returns a cached list of AI tools. On first call, it creates the tools
        /// and caches them for subsequent calls. The current implementation includes:
        /// - <c>retry_tool</c>: Instructs the AI to retry the previous logic or generation
        /// </remarks>
        /// <returns>
        /// A read-only list of <see cref="AITool"/> instances representing available tools.
        /// </returns>
        public IReadOnlyList<AITool> GetAITools()
        {
            if(_tools is not null)
                return _tools;

            var retryTool = AIFunctionFactory.Create(() =>
            {
                return "please retry the previous logic";
            }, new AIFunctionFactoryOptions
            {
                Name = "retry_tool",
                Description = "Instruction to LLM to retry the previous instruction or generation"
            });

            _tools = [retryTool];
            return _tools;
        }
    }
}
