using BbQ.ChatWidgets.Abstractions;
using Microsoft.Extensions.AI;

namespace BbQ.ChatWidgets.Services
{
    public sealed class DefaultAIToolsProvider : IAIToolsProvider
    {
        private AITool[]? _tools;
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
