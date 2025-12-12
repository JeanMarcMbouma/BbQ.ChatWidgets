using BbQ.ChatWidgets.Models;
using BbQ.Outcome;
using Microsoft.AspNetCore.Http;

namespace BbQ.ChatWidgets.Agents.Abstractions;

public interface IAgentMiddleware
{
    Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, AgentDelegate next, CancellationToken cancellationToken);
}
