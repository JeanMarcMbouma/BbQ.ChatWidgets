using BbQ.ChatWidgets.Agents.Abstractions;
using Microsoft.Extensions.DependencyInjection;

namespace BbQ.ChatWidgets.Agents.Extensions;

/// <summary>
/// Extension methods for registering agent pipelines in the service collection.
/// </summary>  
public static class AgentPipelineExtensions
{
    /// <summary>
    /// Adds an agent pipeline to the service collection.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="configure">The configuration action for the agent pipeline builder.</param>
    /// <returns>The updated service collection.</returns>
    /// <remarks>
    /// This method allows for configuring the agent pipeline with custom behaviors,
    /// middleware, and other processing logic.
    /// </remarks>
    public static IServiceCollection AddAgentPipeline(
        this IServiceCollection services,
        Action<AgentPipelineBuilder> configure)
    {
        var builder = new AgentPipelineBuilder();
        configure(builder);

        var pipeline = builder.Build(async (request, ct) =>
        {
            using var scope = request.RequestServices.CreateScope();
            var agent = scope.ServiceProvider.GetRequiredService<IAgent>();
            return await agent.InvokeAsync(request, ct);
        });

        services.AddSingleton(pipeline);
        return services;
    }
}