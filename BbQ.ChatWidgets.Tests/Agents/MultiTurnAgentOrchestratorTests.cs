using Xunit;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using BbQ.ChatWidgets.Agents;
using BbQ.ChatWidgets.Agents.Abstractions;
using BbQ.ChatWidgets.Models;
using BbQ.Outcome;
using Microsoft.Extensions.AI;

namespace BbQ.ChatWidgets.Tests.Agents;

/// <summary>
/// Tests for <see cref="MultiTurnAgentOrchestrator"/>.
/// </summary>
public class MultiTurnAgentOrchestratorTests
{
    // ---- Test doubles ----

    private sealed class EchoAgent(string prefix) : IAgent
    {
        public Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken ct)
        {
            var userMsg = InterAgentCommunicationContext.GetUserMessage(request) ?? "(no message)";
            return Task.FromResult(
                Outcome<ChatTurn>.From(new ChatTurn(ChatRole.Assistant, $"{prefix}: {userMsg}")));
        }
    }

    private sealed class FailingAgent : IAgent
    {
        public Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken ct)
            => Task.FromResult(Outcome<ChatTurn>.FromError("Fail", "Agent intentionally failed"));
    }

    private sealed class CancellingAgent : IAgent
    {
        public Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();
            return Task.FromResult(Outcome<ChatTurn>.From(new ChatTurn(ChatRole.Assistant, "ok")));
        }
    }

    private sealed class PersonaRecordingAgent : IAgent
    {
        public string? LastPersona { get; private set; }

        public Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken ct)
        {
            LastPersona = InterAgentCommunicationContext.GetPersona(request);
            return Task.FromResult(
                Outcome<ChatTurn>.From(new ChatTurn(ChatRole.Assistant, "persona-recorded")));
        }
    }

    private sealed class ContextInspectingAgent : IAgent
    {
        public string? LastPriorContext { get; private set; }

        public Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken ct)
        {
            request.Metadata.TryGetValue("PriorAgentContext", out var ctx);
            LastPriorContext = ctx?.ToString();
            return Task.FromResult(
                Outcome<ChatTurn>.From(new ChatTurn(ChatRole.Assistant, "context-checked")));
        }
    }

    // ---- Helpers ----

    private static ServiceProvider BuildProvider(Action<IServiceCollection> configure)
    {
        var services = new ServiceCollection();
        configure(services);
        return services.BuildServiceProvider();
    }

    private static ChatRequest CreateRequest(string message = "hello", string? threadId = "t1")
    {
        var sp = BuildProvider(_ => { });
        var request = new ChatRequest(threadId, sp);
        InterAgentCommunicationContext.SetUserMessage(request, message);
        return request;
    }

    // ---- Constructor validation ----

    [Fact]
    public void Constructor_NullRegistry_Throws()
    {
        Assert.Throws<ArgumentNullException>(() =>
            new MultiTurnAgentOrchestrator(
                null!,
                [("a", new AgentConversationOptions())]));
    }

    [Fact]
    public void Constructor_NullPipeline_Throws()
    {
        using var provider = BuildProvider(s => s.AddAgent<EchoAgent>("a"));
        using var scope = provider.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<IAgentRegistry>();

        Assert.Throws<ArgumentNullException>(() =>
            new MultiTurnAgentOrchestrator(registry, null!));
    }

    [Fact]
    public void Constructor_EmptyPipeline_Throws()
    {
        using var provider = BuildProvider(s => s.AddAgent<EchoAgent>("a"));
        using var scope = provider.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<IAgentRegistry>();

        Assert.Throws<ArgumentException>(() =>
            new MultiTurnAgentOrchestrator(registry, []));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Constructor_InvalidMaxRoundsPerAgent_Throws(int maxRounds)
    {
        using var provider = BuildProvider(s => s.AddAgent<EchoAgent>("a"));
        using var scope = provider.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<IAgentRegistry>();

        Assert.Throws<ArgumentException>(() =>
            new MultiTurnAgentOrchestrator(
                registry,
                [("a", new AgentConversationOptions())],
                new MultiTurnAgentOrchestratorOptions { MaxRoundsPerAgent = maxRounds, MaxTotalRounds = 5 }));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Constructor_InvalidMaxTotalRounds_Throws(int maxTotal)
    {
        using var provider = BuildProvider(s => s.AddAgent<EchoAgent>("a"));
        using var scope = provider.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<IAgentRegistry>();

        Assert.Throws<ArgumentException>(() =>
            new MultiTurnAgentOrchestrator(
                registry,
                [("a", new AgentConversationOptions())],
                new MultiTurnAgentOrchestratorOptions { MaxRoundsPerAgent = 1, MaxTotalRounds = maxTotal }));
    }

    // ---- Single-agent pipeline ----

    [Fact]
    public async Task SingleAgent_ReturnsAgentResponse()
    {
        using var provider = BuildProvider(s => s.AddAgent<EchoAgent>("echo",
            _ => new EchoAgent("Echo")));

        using var scope = provider.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<IAgentRegistry>();

        var orchestrator = new MultiTurnAgentOrchestrator(
            registry,
            [("echo", new AgentConversationOptions())]);

        var request = CreateRequest("test message");
        var outcome = await orchestrator.InvokeAsync(request, default);

        Assert.True(outcome.IsSuccess);
        Assert.Equal("Echo: test message", outcome.Value!.Content);
    }

    // ---- Multi-agent pipeline ----

    [Fact]
    public async Task TwoAgentPipeline_BothAgentsInvoked_LastResponseReturned()
    {
        using var provider = BuildProvider(s =>
        {
            s.AddAgent<EchoAgent>("first", _ => new EchoAgent("First"));
            s.AddAgent<EchoAgent>("second", _ => new EchoAgent("Second"));
        });

        using var scope = provider.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<IAgentRegistry>();

        var orchestrator = new MultiTurnAgentOrchestrator(
            registry,
            [
                ("first",  new AgentConversationOptions()),
                ("second", new AgentConversationOptions())
            ]);

        var request = CreateRequest("hi");
        var outcome = await orchestrator.InvokeAsync(request, default);

        Assert.True(outcome.IsSuccess);
        Assert.Equal("Second: hi", outcome.Value!.Content);
    }

    // ---- Conversation context accumulation ----

    [Fact]
    public async Task ConversationContext_AccumulatesTurnsFromAllAgents()
    {
        using var provider = BuildProvider(s =>
        {
            s.AddAgent<EchoAgent>("a1", _ => new EchoAgent("A1"));
            s.AddAgent<EchoAgent>("a2", _ => new EchoAgent("A2"));
        });

        using var scope = provider.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<IAgentRegistry>();

        var orchestrator = new MultiTurnAgentOrchestrator(
            registry,
            [("a1", new AgentConversationOptions()), ("a2", new AgentConversationOptions())]);

        var request = CreateRequest("context test");
        await orchestrator.InvokeAsync(request, default);

        var ctx = MultiTurnAgentOrchestrator.GetConversationContext(request);
        Assert.NotNull(ctx);
        Assert.Equal(2, ctx.Turns.Count);
        Assert.Equal("a1", ctx.Turns[0].AgentName);
        Assert.Equal("a2", ctx.Turns[1].AgentName);
    }

    [Fact]
    public async Task SecondAgent_ReceivesPriorContextInMetadata()
    {
        var contextInspector = new ContextInspectingAgent();

        using var provider = BuildProvider(s =>
        {
            s.AddAgent<EchoAgent>("first", _ => new EchoAgent("First"));
            s.AddAgent<ContextInspectingAgent>("inspector", _ => contextInspector);
        });

        using var scope = provider.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<IAgentRegistry>();

        var orchestrator = new MultiTurnAgentOrchestrator(
            registry,
            [("first", new AgentConversationOptions()), ("inspector", new AgentConversationOptions())]);

        var request = CreateRequest("order matters");
        await orchestrator.InvokeAsync(request, default);

        Assert.NotNull(contextInspector.LastPriorContext);
        Assert.Contains("First:", contextInspector.LastPriorContext);
    }

    // ---- Max-rounds guard ----

    [Fact]
    public async Task MaxRoundsPerAgent_PreventsAgentBeingCalledMoreThanLimit()
    {
        int callCount = 0;

        using var provider = BuildProvider(s =>
            s.AddAgent<EchoAgent>("a", _ =>
            {
                callCount++;
                return new EchoAgent("A");
            }));

        // Use a single-agent pipeline so we only test per-agent cap
        using var scope = provider.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<IAgentRegistry>();

        // maxRoundsPerAgent = 1, so agent "a" should only be invoked once
        var orchestrator = new MultiTurnAgentOrchestrator(
            registry,
            [("a", new AgentConversationOptions { MaxRoundsOverride = 1 })],
            new MultiTurnAgentOrchestratorOptions { MaxRoundsPerAgent = 5, MaxTotalRounds = 10 });

        var request = CreateRequest("round cap");
        var outcome = await orchestrator.InvokeAsync(request, default);

        Assert.True(outcome.IsSuccess);
        // Agent factory is called once to build the agent; agent is invoked once
        Assert.Equal(1, callCount);
    }

    [Fact]
    public async Task MaxTotalRounds_StopsEarlyWhenHardCapReached()
    {
        using var provider = BuildProvider(s =>
        {
            s.AddAgent<EchoAgent>("a", _ => new EchoAgent("A"));
            s.AddAgent<EchoAgent>("b", _ => new EchoAgent("B"));
            s.AddAgent<EchoAgent>("c", _ => new EchoAgent("C"));
        });

        using var scope = provider.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<IAgentRegistry>();

        // MaxTotalRounds = 1 means only the first agent runs
        var orchestrator = new MultiTurnAgentOrchestrator(
            registry,
            [
                ("a", new AgentConversationOptions()),
                ("b", new AgentConversationOptions()),
                ("c", new AgentConversationOptions())
            ],
            new MultiTurnAgentOrchestratorOptions { MaxRoundsPerAgent = 5, MaxTotalRounds = 1 });

        var request = CreateRequest("stop early");
        var outcome = await orchestrator.InvokeAsync(request, default);

        Assert.True(outcome.IsSuccess);
        // Only agent "a" should have run
        var ctx = MultiTurnAgentOrchestrator.GetConversationContext(request);
        Assert.NotNull(ctx);
        Assert.Single(ctx.Turns);
        Assert.Equal("a", ctx.Turns[0].AgentName);
        Assert.Equal("A: stop early", outcome.Value!.Content);
    }

    // ---- Per-agent persona ----

    [Fact]
    public async Task AgentPersona_InjectedIntoRequest()
    {
        var personaAgent = new PersonaRecordingAgent();

        using var provider = BuildProvider(s =>
            s.AddAgent<PersonaRecordingAgent>("pa", _ => personaAgent));

        using var scope = provider.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<IAgentRegistry>();

        var orchestrator = new MultiTurnAgentOrchestrator(
            registry,
            [("pa", new AgentConversationOptions { Persona = "You are a test assistant." })]);

        var request = CreateRequest("persona test");
        await orchestrator.InvokeAsync(request, default);

        Assert.Equal("You are a test assistant.", personaAgent.LastPersona);
    }

    [Fact]
    public async Task PersonaDoesNotLeakFromFirstAgentToSecondAgent()
    {
        // Agent 1 has a persona; Agent 2 does not.
        // After fix, Agent 2 should receive an empty/cleared persona, not Agent 1's.
        var personaA = new PersonaRecordingAgent();
        var personaB = new PersonaRecordingAgent();

        using var provider = BuildProvider(s =>
        {
            s.AddAgent<PersonaRecordingAgent>("a1", _ => personaA);
            s.AddAgent<PersonaRecordingAgent>("a2", _ => personaB);
        });

        using var scope = provider.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<IAgentRegistry>();

        var orchestrator = new MultiTurnAgentOrchestrator(
            registry,
            [
                ("a1", new AgentConversationOptions { Persona = "You are agent A." }),
                ("a2", new AgentConversationOptions())  // no Persona
            ]);

        var request = CreateRequest("persona leak test");
        await orchestrator.InvokeAsync(request, default);

        // Agent 1 should have received its persona
        Assert.Equal("You are agent A.", personaA.LastPersona);
        // Agent 2 should have received an empty/cleared persona (not Agent 1's)
        Assert.True(personaB.LastPersona is null or { Length: 0 });
    }

    [Fact]
    public async Task NoPersonaSet_PersonaClearedBetweenAgents()
    {
        var personaAgent = new PersonaRecordingAgent();

        using var provider = BuildProvider(s =>
            s.AddAgent<PersonaRecordingAgent>("pa", _ => personaAgent));

        using var scope = provider.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<IAgentRegistry>();

        var orchestrator = new MultiTurnAgentOrchestrator(
            registry,
            [("pa", new AgentConversationOptions())]);   // no Persona

        var request = CreateRequest("no persona");
        await orchestrator.InvokeAsync(request, default);

        // When no persona is configured the orchestrator explicitly clears the persona
        // (sets it to empty string) to prevent leakage from a previous agent's turn.
        Assert.True(personaAgent.LastPersona is null or { Length: 0 });
    }

    // ---- Missing agent ----

    [Fact]
    public async Task UnknownAgent_ReturnsError()
    {
        using var provider = BuildProvider(s => s.AddAgent<EchoAgent>("real"));
        using var scope = provider.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<IAgentRegistry>();

        var orchestrator = new MultiTurnAgentOrchestrator(
            registry,
            [("does-not-exist", new AgentConversationOptions())]);

        var request = CreateRequest("missing agent");
        var outcome = await orchestrator.InvokeAsync(request, default);

        Assert.False(outcome.IsSuccess);
    }

    // ---- Failing agent ----

    [Fact]
    public async Task FailingAgent_ErrorRecordedInContext_LastOutcomeIsError()
    {
        using var provider = BuildProvider(s => s.AddAgent<FailingAgent>("fail"));
        using var scope = provider.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<IAgentRegistry>();

        var orchestrator = new MultiTurnAgentOrchestrator(
            registry,
            [("fail", new AgentConversationOptions())]);

        var request = CreateRequest("fail test");
        var outcome = await orchestrator.InvokeAsync(request, default);

        Assert.False(outcome.IsSuccess);
        var ctx = MultiTurnAgentOrchestrator.GetConversationContext(request);
        Assert.NotNull(ctx);
        Assert.Single(ctx.Turns);
        Assert.Contains("[Error:", ctx.Turns[0].Content);
    }

    // ---- Cancellation ----

    [Fact]
    public async Task Cancellation_StopsPipeline()
    {
        using var cts = new CancellationTokenSource();
        await cts.CancelAsync();

        using var provider = BuildProvider(s => s.AddAgent<CancellingAgent>("c"));
        using var scope = provider.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<IAgentRegistry>();

        var orchestrator = new MultiTurnAgentOrchestrator(
            registry,
            [("c", new AgentConversationOptions())]);

        var request = CreateRequest("cancel");
        await Assert.ThrowsAsync<OperationCanceledException>(
            () => orchestrator.InvokeAsync(request, cts.Token));
    }

    // ---- DI registration helper ----

    [Fact]
    public void AddMultiTurnAgentOrchestrator_RegistersIAgentAsScopedFactory()
    {
        using var provider = BuildProvider(s =>
        {
            s.AddAgent<EchoAgent>("echo");
            s.AddMultiTurnAgentOrchestrator(
                [("echo", new AgentConversationOptions())]);
        });

        using var scope = provider.CreateScope();
        var agent = scope.ServiceProvider.GetService<IAgent>();

        Assert.NotNull(agent);
        Assert.IsType<MultiTurnAgentOrchestrator>(agent);
    }

    [Fact]
    public void AddMultiTurnAgentOrchestrator_Named_RegistersAsKeyedAgent()
    {
        using var provider = BuildProvider(s =>
        {
            s.AddAgent<EchoAgent>("echo");
            s.AddMultiTurnAgentOrchestrator(
                "my-pipeline",
                [("echo", new AgentConversationOptions())]);
        });

        using var scope = provider.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<IAgentRegistry>();

        var agent = registry.GetAgent("my-pipeline");

        Assert.NotNull(agent);
        Assert.IsType<MultiTurnAgentOrchestrator>(agent);
    }

    // ---- ConversationContext summary ----

    [Fact]
    public void AgentConversationContext_BuildSummary_FormatsCorrectly()
    {
        var ctx = new AgentConversationContext();
        ctx.AddTurn("AgentA", 0, "Hello from A");
        ctx.AddTurn("AgentB", 1, "Hello from B");

        var summary = ctx.BuildSummary();

        Assert.Contains("[Round 0] AgentA: Hello from A", summary);
        Assert.Contains("[Round 1] AgentB: Hello from B", summary);
    }

    [Fact]
    public void AgentConversationContext_EmptyContext_BuildSummaryReturnsEmpty()
    {
        var ctx = new AgentConversationContext();
        Assert.Equal(string.Empty, ctx.BuildSummary());
    }

    // ---- DI helper for AddAgent with factory ----
    // (The TestDouble helpers above use a factory overload; make sure the test extension exists)
    // We provide a tiny extension here rather than modifying production code.
}

file static class TestAgentExtensions
{
    /// <summary>
    /// Convenience overload that accepts a factory delegate for test doubles.
    /// </summary>
    internal static IServiceCollection AddAgent<TAgent>(
        this IServiceCollection services,
        string name,
        Func<IServiceProvider, TAgent> factory)
        where TAgent : class, IAgent
    {
        services.Configure<AgentRegistryOptions>(opts => opts.RegisteredAgentNames.Add(name));
        services.AddKeyedScoped<IAgent>(name, (sp, _) => factory(sp));
        services.TryAddScoped<IAgentRegistry, AgentRegistry>();
        return services;
    }
}
