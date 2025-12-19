using BbQ.ChatWidgets.Agents.Abstractions;
using Microsoft.Extensions.DependencyInjection;

namespace BbQ.ChatWidgets.Agents;

/// <summary>
/// Builder for constructing an agent middleware pipeline.
/// </summary> 
public sealed class AgentPipelineBuilder
{
    private readonly IList<Func<AgentDelegate, AgentDelegate>> _components =
        [];

    /// <summary>
    /// Adds a middleware component to the pipeline.
    /// </summary>
    /// <typeparam name="TMiddleware">The type of the middleware.</typeparam>
    /// <returns>The updated pipeline builder.</returns>
    /// <remarks>
    /// This method adds a middleware component to the pipeline.
    /// </remarks>
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