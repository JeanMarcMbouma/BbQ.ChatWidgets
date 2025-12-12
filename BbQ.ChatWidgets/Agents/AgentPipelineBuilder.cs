using BbQ.ChatWidgets.Agents.Abstractions;
using Microsoft.Extensions.DependencyInjection;

namespace BbQ.ChatWidgets.Agents;

public class AgentPipelineBuilder
{
    private readonly IList<Func<AgentDelegate, AgentDelegate>> _components =
        [];

    public AgentPipelineBuilder Use<TMiddleware>() where TMiddleware : IAgentMiddleware
    {
        _components.Add(next =>
        {
            return async (request, ct) =>
            {
                var middleware = ActivatorUtilities.CreateInstance<TMiddleware>(
                    request.RequestServices,
                    []);

                return await middleware.InvokeAsync(request, next, ct);
            };
        });
        return this;
    }

    internal AgentDelegate Build(AgentDelegate terminal)
    {
        AgentDelegate app = terminal;
        foreach (var component in _components.Reverse())
        {
            app = component(app);
        }
        return app;
    }
}