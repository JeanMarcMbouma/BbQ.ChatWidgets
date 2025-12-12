using BbQ.ChatWidgets.Agents.Abstractions;
using Microsoft.Extensions.DependencyInjection;

namespace BbQ.ChatWidgets.Agents.Extensions;

public static class AgentPipelineExtensions
{
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