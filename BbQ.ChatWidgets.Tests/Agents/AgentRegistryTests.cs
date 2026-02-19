using Xunit;
using Microsoft.Extensions.DependencyInjection;
using BbQ.ChatWidgets.Agents;
using BbQ.ChatWidgets.Agents.Abstractions;
using BbQ.ChatWidgets.Models;
using BbQ.Outcome;
using Microsoft.Extensions.AI;

namespace BbQ.ChatWidgets.Tests.Agents;

/// <summary>
/// Tests for AgentRegistry keyed-service-based implementation.
/// </summary>
public class AgentRegistryTests
{
    // --- Test doubles ---

    private sealed class AlphaAgent : IAgent
    {
        public Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken cancellationToken)
            => Task.FromResult(Outcome<ChatTurn>.From(new ChatTurn(ChatRole.Assistant, "alpha")));
    }

    private sealed class BetaAgent : IAgent
    {
        public Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken cancellationToken)
            => Task.FromResult(Outcome<ChatTurn>.From(new ChatTurn(ChatRole.Assistant, "beta")));
    }

    // --- Helpers ---

    private static ServiceProvider BuildProvider(Action<IServiceCollection> configure)
    {
        var services = new ServiceCollection();
        configure(services);
        return services.BuildServiceProvider();
    }

    // --- Tests ---

    [Fact]
    public void AddAgent_RegistersAgentRetrievableByName()
    {
        // Arrange
        using var provider = BuildProvider(s => s.AddAgent<AlphaAgent>("alpha"));
        using var scope = provider.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<IAgentRegistry>();

        // Act
        var agent = registry.GetAgent("alpha");

        // Assert
        Assert.NotNull(agent);
        Assert.IsType<AlphaAgent>(agent);
    }

    [Fact]
    public void AddAgent_MultipleAgents_EachRetrievableByName()
    {
        // Arrange
        using var provider = BuildProvider(s =>
        {
            s.AddAgent<AlphaAgent>("alpha");
            s.AddAgent<BetaAgent>("beta");
        });
        using var scope = provider.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<IAgentRegistry>();

        // Act
        var alpha = registry.GetAgent("alpha");
        var beta = registry.GetAgent("beta");

        // Assert
        Assert.IsType<AlphaAgent>(alpha);
        Assert.IsType<BetaAgent>(beta);
    }

    [Fact]
    public void GetAgent_UnknownName_ReturnsNull()
    {
        // Arrange
        using var provider = BuildProvider(s => s.AddAgent<AlphaAgent>("alpha"));
        using var scope = provider.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<IAgentRegistry>();

        // Act
        var agent = registry.GetAgent("unknown");

        // Assert
        Assert.Null(agent);
    }

    [Fact]
    public void HasAgent_RegisteredName_ReturnsTrue()
    {
        // Arrange
        using var provider = BuildProvider(s => s.AddAgent<AlphaAgent>("alpha"));
        using var scope = provider.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<IAgentRegistry>();

        // Act & Assert
        Assert.True(registry.HasAgent("alpha"));
    }

    [Fact]
    public void HasAgent_UnknownName_ReturnsFalse()
    {
        // Arrange
        using var provider = BuildProvider(s => s.AddAgent<AlphaAgent>("alpha"));
        using var scope = provider.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<IAgentRegistry>();

        // Act & Assert
        Assert.False(registry.HasAgent("unknown"));
    }

    [Fact]
    public void GetRegisteredAgents_ReturnsAllRegisteredNames()
    {
        // Arrange
        using var provider = BuildProvider(s =>
        {
            s.AddAgent<AlphaAgent>("alpha");
            s.AddAgent<BetaAgent>("beta");
        });
        using var scope = provider.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<IAgentRegistry>();

        // Act
        var names = registry.GetRegisteredAgents().ToList();

        // Assert
        Assert.Contains("alpha", names);
        Assert.Contains("beta", names);
        Assert.Equal(2, names.Count);
    }

    [Fact]
    public void AddAgent_DefaultLifetime_IsScoped()
    {
        // Arrange – resolve two instances from different scopes; they should differ
        using var provider = BuildProvider(s => s.AddAgent<AlphaAgent>("alpha"));

        IAgent? instance1, instance2;
        using (var scope1 = provider.CreateScope())
            instance1 = scope1.ServiceProvider.GetKeyedService<IAgent>("alpha");
        using (var scope2 = provider.CreateScope())
            instance2 = scope2.ServiceProvider.GetKeyedService<IAgent>("alpha");

        // Scoped: different instances per scope
        Assert.NotSame(instance1, instance2);
    }

    [Fact]
    public void AddAgent_ScopedLifetime_SameInstanceWithinScope()
    {
        // Arrange
        using var provider = BuildProvider(s => s.AddAgent<AlphaAgent>("alpha", ServiceLifetime.Scoped));
        using var scope = provider.CreateScope();

        // Act – resolve twice in the same scope
        var a = scope.ServiceProvider.GetKeyedService<IAgent>("alpha");
        var b = scope.ServiceProvider.GetKeyedService<IAgent>("alpha");

        // Assert
        Assert.Same(a, b);
    }

    [Fact]
    public void AddAgent_SingletonLifetime_SameInstanceAcrossScopes()
    {
        // Arrange
        using var provider = BuildProvider(s => s.AddAgent<AlphaAgent>("alpha", ServiceLifetime.Singleton));

        IAgent? instance1, instance2;
        using (var scope1 = provider.CreateScope())
            instance1 = scope1.ServiceProvider.GetKeyedService<IAgent>("alpha");
        using (var scope2 = provider.CreateScope())
            instance2 = scope2.ServiceProvider.GetKeyedService<IAgent>("alpha");

        // Assert – singleton: same instance across scopes
        Assert.Same(instance1, instance2);
    }

    [Fact]
    public void AddAgent_EnsuresIAgentRegistryIsRegistered()
    {
        // Arrange
        using var provider = BuildProvider(s => s.AddAgent<AlphaAgent>("alpha"));
        using var scope = provider.CreateScope();

        // Act & Assert – IAgentRegistry should be resolvable without explicit registration
        var registry = scope.ServiceProvider.GetService<IAgentRegistry>();
        Assert.NotNull(registry);
    }

    [Fact]
    public void AddAgent_ThrowsOnNullOrEmptyName()
    {
        var services = new ServiceCollection();

        Assert.Throws<ArgumentException>(() => services.AddAgent<AlphaAgent>(""));
        Assert.Throws<ArgumentException>(() => services.AddAgent<AlphaAgent>("   "));
    }
}
