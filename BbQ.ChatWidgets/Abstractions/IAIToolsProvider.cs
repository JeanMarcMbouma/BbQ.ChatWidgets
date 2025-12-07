using Microsoft.Extensions.AI;

namespace BbQ.ChatWidgets.Abstractions;

public interface IAIToolsProvider
{
    IReadOnlyList<AITool> GetAITools();
}
