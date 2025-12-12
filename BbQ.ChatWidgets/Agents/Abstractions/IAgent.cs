using BbQ.ChatWidgets.Models;
using BbQ.Outcome;
using Microsoft.AspNetCore.Http;

namespace BbQ.ChatWidgets.Agents.Abstractions;

public interface IAgent
{
    Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken cancellationToken);
}


public delegate Task<Outcome<ChatTurn>> AgentDelegate(ChatRequest request, CancellationToken ct);
