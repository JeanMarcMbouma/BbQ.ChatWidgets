using Xunit;
using BbQ.ChatWidgets.Agents;
using BbQ.ChatWidgets.Agents.Abstractions;
using BbQ.ChatWidgets.Models;
using BbQ.Outcome;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.AI;
using BbQ.ChatWidgets.Extensions;

namespace BbQ.ChatWidgets.Tests.Agents;

/// <summary>
/// Tests for the agent hooks (IAgentEventHandler / IAgentEventDispatcher) feature.
/// </summary>
public class AgentHooksTests
{
    // ---- Test doubles ----

    private sealed class RecordingHandler : IAgentEventHandler
    {
        public List<AgentEvent> Received { get; } = [];

        public Task HandleAsync(AgentEvent agentEvent, CancellationToken cancellationToken)
        {
            Received.Add(agentEvent);
            return Task.CompletedTask;
        }
    }

    private sealed class AlwaysThrowingHandler : IAgentEventHandler
    {
        public Task HandleAsync(AgentEvent agentEvent, CancellationToken cancellationToken)
            => throw new InvalidOperationException("handler error");
    }

    private sealed class EchoAgent(string name) : IAgent
    {
        public Task<Outcome<ChatTurn>> InvokeAsync(ChatRequest request, CancellationToken ct)
            => Task.FromResult(Outcome<ChatTurn>.From(new ChatTurn(ChatRole.Assistant, $"{name}: done")));
    }

    private enum TestCategory { A, B }

    private sealed class FixedClassifier(TestCategory result) : IClassifier<TestCategory>
    {
        public Task<TestCategory> ClassifyAsync(string input, CancellationToken ct)
            => Task.FromResult(result);
    }

    // ---- DefaultAgentEventDispatcher ----

    [Fact]
    public async Task Dispatcher_WithNoHandlers_IsNoOp()
    {
        var dispatcher = new DefaultAgentEventDispatcher([]);
        // Should not throw
        await dispatcher.DispatchAsync(new AgentEvent(AgentEventType.Thinking, "t1"), default);
    }

    [Fact]
    public async Task Dispatcher_DeliversEventsToAllRegisteredHandlers()
    {
        var handler1 = new RecordingHandler();
        var handler2 = new RecordingHandler();
        var dispatcher = new DefaultAgentEventDispatcher([handler1, handler2]);

        var evt = new AgentEvent(AgentEventType.Thinking, "thread-1");
        await dispatcher.DispatchAsync(evt, default);

        Assert.Single(handler1.Received);
        Assert.Equal(AgentEventType.Thinking, handler1.Received[0].EventType);
        Assert.Single(handler2.Received);
    }

    [Fact]
    public async Task Dispatcher_PropagatesHandlerExceptions()
    {
        var dispatcher = new DefaultAgentEventDispatcher([new AlwaysThrowingHandler()]);
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => dispatcher.DispatchAsync(new AgentEvent(AgentEventType.Thinking, null), default));
    }

    [Fact]
    public async Task Dispatcher_InvokesHandlersInRegistrationOrder()
    {
        var order = new List<string>();

        var h1 = new OrderRecordingHandler("first", order);
        var h2 = new OrderRecordingHandler("second", order);
        var dispatcher = new DefaultAgentEventDispatcher([h1, h2]);

        await dispatcher.DispatchAsync(new AgentEvent(AgentEventType.Thinking, null), default);

        Assert.Equal(["first", "second"], order);
    }

    private sealed class OrderRecordingHandler(string name, List<string> order) : IAgentEventHandler
    {
        public Task HandleAsync(AgentEvent agentEvent, CancellationToken cancellationToken)
        {
            order.Add(name);
            return Task.CompletedTask;
        }
    }

    // ---- TriageAgent event dispatch ----

    private static ServiceProvider BuildProvider(Action<IServiceCollection> configure)
    {
        var services = new ServiceCollection();
        configure(services);
        return services.BuildServiceProvider();
    }

    private static ChatRequest CreateRequest(string message, string? threadId = "t1")
    {
        var sp = BuildProvider(_ => { });
        var request = new ChatRequest(threadId, sp);
        InterAgentCommunicationContext.SetUserMessage(request, message);
        return request;
    }

    [Fact]
    public async Task TriageAgent_FiresTriagingAndTriageCompleted_WhenRoutingSucceeds()
    {
        var handler = new RecordingHandler();
        var dispatcher = new DefaultAgentEventDispatcher([handler]);

        using var provider = BuildProvider(s =>
        {
            s.AddAgent<EchoAgent>("target", _ => new EchoAgent("Target"));
        });
        using var scope = provider.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<IAgentRegistry>();

        var triage = new TriageAgent<TestCategory>(
            new FixedClassifier(TestCategory.A),
            registry,
            category => category == TestCategory.A ? "target" : null,
            eventDispatcher: dispatcher);

        var request = CreateRequest("hello");
        await triage.InvokeAsync(request, default);

        Assert.Contains(handler.Received, e => e.EventType == AgentEventType.Triaging);
        Assert.Contains(handler.Received, e => e.EventType == AgentEventType.TriageCompleted);

        var completed = handler.Received.Single(e => e.EventType == AgentEventType.TriageCompleted);
        Assert.Equal("target", completed.AgentName);
    }

    [Fact]
    public async Task TriageAgent_WithNoDispatcher_DoesNotThrow()
    {
        using var provider = BuildProvider(s =>
        {
            s.AddAgent<EchoAgent>("target", _ => new EchoAgent("Target"));
        });
        using var scope = provider.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<IAgentRegistry>();

        var triage = new TriageAgent<TestCategory>(
            new FixedClassifier(TestCategory.A),
            registry,
            category => category == TestCategory.A ? "target" : null);

        var request = CreateRequest("hello");
        var outcome = await triage.InvokeAsync(request, default);

        Assert.True(outcome.IsSuccess);
    }

    [Fact]
    public async Task TriageAgent_TriagingEvent_CarriesThreadId()
    {
        var handler = new RecordingHandler();
        var dispatcher = new DefaultAgentEventDispatcher([handler]);

        using var provider = BuildProvider(s =>
        {
            s.AddAgent<EchoAgent>("target", _ => new EchoAgent("Target"));
        });
        using var scope = provider.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<IAgentRegistry>();

        var triage = new TriageAgent<TestCategory>(
            new FixedClassifier(TestCategory.A),
            registry,
            _ => "target",
            eventDispatcher: dispatcher);

        var request = CreateRequest("hello", threadId: "my-thread");
        await triage.InvokeAsync(request, default);

        var triaging = handler.Received.Single(e => e.EventType == AgentEventType.Triaging);
        Assert.Equal("my-thread", triaging.ThreadId);
    }

    // ---- MultiTurnAgentOrchestrator event dispatch ----

    [Fact]
    public async Task MultiTurnOrchestrator_FiresAgentStartedAndCompleted_PerAgent()
    {
        var handler = new RecordingHandler();
        var dispatcher = new DefaultAgentEventDispatcher([handler]);

        using var provider = BuildProvider(s =>
        {
            s.AddAgent<EchoAgent>("a1", _ => new EchoAgent("A1"));
            s.AddAgent<EchoAgent>("a2", _ => new EchoAgent("A2"));
        });
        using var scope = provider.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<IAgentRegistry>();

        var orchestrator = new MultiTurnAgentOrchestrator(
            registry,
            [("a1", new AgentConversationOptions()), ("a2", new AgentConversationOptions())],
            eventDispatcher: dispatcher);

        var request = CreateRequest("hello");
        await orchestrator.InvokeAsync(request, default);

        var started = handler.Received.Where(e => e.EventType == AgentEventType.AgentStarted).ToList();
        var completed = handler.Received.Where(e => e.EventType == AgentEventType.AgentCompleted).ToList();

        Assert.Equal(2, started.Count);
        Assert.Equal(2, completed.Count);
        Assert.Equal("a1", started[0].AgentName);
        Assert.Equal("a2", started[1].AgentName);
        Assert.Equal("a1", completed[0].AgentName);
        Assert.Equal("a2", completed[1].AgentName);
    }

    [Fact]
    public async Task MultiTurnOrchestrator_WithNoDispatcher_DoesNotThrow()
    {
        using var provider = BuildProvider(s =>
        {
            s.AddAgent<EchoAgent>("a", _ => new EchoAgent("A"));
        });
        using var scope = provider.CreateScope();
        var registry = scope.ServiceProvider.GetRequiredService<IAgentRegistry>();

        var orchestrator = new MultiTurnAgentOrchestrator(
            registry,
            [("a", new AgentConversationOptions())]);

        var outcome = await orchestrator.InvokeAsync(CreateRequest("hi"), default);
        Assert.True(outcome.IsSuccess);
    }

    // ---- DI registration (AddAgentEventHandler) ----

    [Fact]
    public void AddAgentEventHandler_RegistersHandlerInContainer()
    {
        using var provider = BuildProvider(s =>
        {
            s.AddAgentEventHandler<RecordingHandler>();
        });

        var handlers = provider.GetServices<IAgentEventHandler>().ToList();
        Assert.Single(handlers);
        Assert.IsType<RecordingHandler>(handlers[0]);
    }

    [Fact]
    public void AddAgentEventHandler_MultipleHandlers_AllRegistered()
    {
        using var provider = BuildProvider(s =>
        {
            s.AddAgentEventHandler<RecordingHandler>();
            s.AddAgentEventHandler<RecordingHandler>();
        });

        var handlers = provider.GetServices<IAgentEventHandler>().ToList();
        Assert.Equal(2, handlers.Count);
    }

    [Fact]
    public async Task AddAgentEventHandler_DispatcherCallsAllHandlersViaContainer()
    {
        using var provider = BuildProvider(s =>
        {
            s.AddAgentEventHandler<RecordingHandler>();
            s.TryAddScoped<IAgentEventDispatcher, DefaultAgentEventDispatcher>();
        });

        using var scope = provider.CreateScope();
        var dispatcher = scope.ServiceProvider.GetRequiredService<IAgentEventDispatcher>();

        await dispatcher.DispatchAsync(new AgentEvent(AgentEventType.Thinking, "t1"), default);

        var handler = scope.ServiceProvider.GetServices<IAgentEventHandler>().OfType<RecordingHandler>().Single();
        Assert.Single(handler.Received);
        Assert.Equal(AgentEventType.Thinking, handler.Received[0].EventType);
    }
}

// ---- Helpers ---- (local extension re-used from MultiTurnAgentOrchestratorTests)
file static class TestAgentHookExtensions
{
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
