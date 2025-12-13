using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Agents;
using BbQ.ChatWidgets.Agents.Abstractions;
using BbQ.ChatWidgets.Endpoints;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Services;
using BbQ.Outcome;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json;

namespace BbQ.ChatWidgets.Extensions;

/// <summary>
/// Extension methods for registering and configuring BbQ ChatWidgets services.
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Registers BbQ ChatWidgets services in the dependency injection container.
    /// </summary>
    /// <remarks>
    /// This extension method configures all necessary services for chat widget functionality:
    /// - <see cref="BbQChatOptions"/>: Configuration options
    /// - <see cref="WidgetRegistry"/>: Widget type registry
    /// - <see cref="ChatWidgetService"/>: Main service orchestrator
    /// - <see cref="IWidgetHintParser"/>: Widget hint parser
    /// - <see cref="IWidgetToolsProvider"/>: Widget tools provider
    /// - <see cref="IChatWidgetRenderer"/>: Widget HTML renderer
    /// - <see cref="IThreadService"/>: Thread/conversation management
    /// - <see cref="IWidgetActionRegistry"/>: Action metadata registry
    /// - <see cref="IWidgetActionHandlerResolver"/>: Handler resolution service
    /// - <see cref="IChatClient"/>: Chat client (if factory provided)
    /// 
    /// Usage:
    /// <code>
    /// services.AddBbQChatWidgets(options => {
    ///     options.RoutePrefix = "/api/chat";
    ///     options.ChatClientFactory = sp => new MyCustomChatClient();
    /// });
    /// </code>
    /// </remarks>
    /// <param name="services">The service collection to register services with.</param>
    /// <param name="configure">Optional configuration action for <see cref="BbQChatOptions"/>.</param>
    /// <returns>The service collection for method chaining.</returns>
    public static IServiceCollection AddBbQChatWidgets(this IServiceCollection services, Action<BbQChatOptions>? configure = null)
    {
        var options = new BbQChatOptions();
        configure?.Invoke(options);

        services.AddSingleton(options);
        services.AddSingleton<WidgetRegistry>();
        services.AddScoped<ChatWidgetService>();
        services.AddSingleton<IChatWidgetRenderer, Renderers.SsrWidgetRenderer>();
        services.AddSingleton<IThreadService, DefaultThreadService>();
        services.AddSingleton<IWidgetHintParser, DefaultWidgetHintParser>();
        
        // Register action registry and handler resolver
        services.AddSingleton<IWidgetActionRegistry, DefaultWidgetActionRegistry>();
        services.AddSingleton<IWidgetActionHandlerResolver, DefaultWidgetActionHandlerResolver>();

        if (options.ChatClientFactory is not null)
            services.AddSingleton(sp => options.ChatClientFactory(sp));

        if (options.ToolProviderFactory is not null)
            services.AddScoped(sp => options.ToolProviderFactory(sp));
        else
            services.AddScoped<IAIToolsProvider, DefaultAIToolsProvider>();

        if (options.AIInstructionProviderFactory is not null)
            services.AddScoped(sp => options.AIInstructionProviderFactory(sp));
        else
            services.AddScoped<IAIInstructionProvider, DefaultInstructionProvider>();
            
        if (options.WidgetToolsProviderFactory is not null)
            services.AddSingleton(sp => options.WidgetToolsProviderFactory(sp));
        else
            services.AddSingleton<IWidgetToolsProvider, DefaultWidgetToolsProvider>();

        services.AddSingleton<IWidgetRegistry>(sp =>
        {
            var registry = sp.GetRequiredService<WidgetRegistry>();
            options.WidgetRegistryConfigurator?.Invoke(registry);
            Serialization.SetCustomWidgetRegistry(registry);
            return registry;
        });

        return services;
    }


    /// <summary>
    /// Maps BbQ ChatWidgets API endpoints to the application.
    /// </summary>
    /// <remarks>
    /// This extension method registers middleware that handles three endpoints:
    /// - POST {routePrefix}/message: Send user messages and get AI responses with widgets
    /// - POST {routePrefix}/action: Handle widget-triggered actions
    /// - POST {routePrefix}/agent: Route through triage agent (if registered) or AgentDelegate
    /// - POST {routePrefix}/stream/message: Stream responses via Server-Sent Events (SSE)
    /// - POST {routePrefix}/stream/agent: Stream triage agent responses via Server-Sent Events (SSE)
    /// 
    /// The route prefix is configurable via <see cref="BbQChatOptions.RoutePrefix"/> (default: "/api/chat").
    /// 
    /// Request/Response format:
    /// - Content-Type: application/json
    /// - Serialization: camelCase JSON with custom serialization options
    /// 
    /// When a triage agent is registered via dependency injection (e.g., through AddTriageAgentSystem()),
    /// the /agent endpoint will automatically use it for intelligent request routing. If no triage agent
    /// is registered, it falls back to the AgentDelegate.
    /// 
    /// Streaming endpoints use Server-Sent Events (SSE) format:
    /// - Content-Type: text/event-stream
    /// - Each ChatTurn is sent as a separate event with "data: {json}" format
    /// - Final event includes complete ChatTurn with all widgets
    /// - Delta events flag intermediate updates with IsDelta = true
    /// 
    /// Usage:
    /// <code>
    /// app.MapBbQChatEndpoints();
    /// </code>
    /// </remarks>
    /// <param name="app">The application builder to map endpoints to.</param>
    /// <returns>The application builder for method chaining.</returns>
    public static IApplicationBuilder MapBbQChatEndpoints(this IApplicationBuilder app)
    {
        var options = app.ApplicationServices.GetRequiredService<BbQChatOptions>();
        var prefix = options.RoutePrefix ?? "/api/chat";

        app.Use(async (context, next) =>
        {
            var path = context.Request.Path.Value ?? string.Empty;

            if (context.Request.Method == HttpMethods.Post && path == $"{prefix}/message")
            {
                await HandleMessageRequest(context);
                return;
            }

            if (context.Request.Method == HttpMethods.Post && path == $"{prefix}/action")
            {
                await HandleActionRequest(context);
                return;
            }

            if(context.Request.Method == HttpMethods.Post && path == $"{prefix}/agent" )
            {
                await HandleAgentRequest(context);
                return;
            }

            if (context.Request.Method == HttpMethods.Post && path == $"{prefix}/stream/message")
            {
                await HandleStreamMessageRequest(context);
                return;
            }

            if (context.Request.Method == HttpMethods.Post && path == $"{prefix}/stream/agent")
            {
                await HandleStreamAgentRequest(context);
                return;
            }

            await next();
        });

        return app;
    }

    private static async Task HandleAgentRequest(HttpContext context)
    {
        // Reset stream position for multiple deserializations
        var metadata = await DeserializeRequest<Dictionary<string, object>>(context) ?? [];
        var serialization = JsonSerializer.Serialize(metadata, Serialization.Default);
        var payload = JsonSerializer.Deserialize<UserMessageDto>(serialization, Serialization.Default)
            ?? throw new InvalidOperationException("Failed to deserialize request payload.");

        // Reset stream position again for metadata deserialization

        var chatRequest = new ChatRequest(payload.ThreadId, context.RequestServices)
        {
            Metadata = metadata
        };

        // Store user message in metadata for triage agent consumption
        if (!string.IsNullOrWhiteSpace(payload.Message))
        {
            InterAgentCommunicationContext.SetUserMessage(chatRequest, payload.Message);
        }

        // Try to get a registered triage agent first, fall back to AgentDelegate
        var triageAgent = context.RequestServices.GetService<IAgent>();
        var outcome = triageAgent != null
            ? await triageAgent.InvokeAsync(chatRequest, context.RequestAborted)
            : await GetAgentDelegate(context.RequestServices).Invoke(chatRequest, context.RequestAborted);

        await outcome.Match(result =>
        {
            return WriteJsonResponse(context, result);
        }, error =>
        {
            context.Response.StatusCode = 500;
            return context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(new { Error = error }));
        });
    }

    private static async Task HandleStreamMessageRequest(HttpContext context)
    {
        var service = context.RequestServices.GetRequiredService<ChatWidgetService>();
        var dto = await DeserializeRequest<UserMessageDto>(context);
        var ct = context.RequestAborted;

        context.Response.ContentType = "text/event-stream";
        context.Response.Headers.Add("Cache-Control", "no-cache");
        context.Response.Headers.Add("Connection", "keep-alive");

        await foreach (var turn in service.StreamResponseAsync(dto.Message, dto.ThreadId, ct))
        {
            var json = System.Text.Json.JsonSerializer.Serialize(turn, Serialization.Default);
            await context.Response.WriteAsync($"data: {json}\n\n");
            await context.Response.Body.FlushAsync(ct);
        }
    }

    private static async Task HandleStreamAgentRequest(HttpContext context)
    {
        var metadata = await DeserializeRequest<Dictionary<string, object>>(context) ?? [];
        var serialization = JsonSerializer.Serialize(metadata, Serialization.Default);
        var payload = JsonSerializer.Deserialize<UserMessageDto>(serialization, Serialization.Default)
                        ?? throw new InvalidOperationException("Failed to deserialize request payload.");

        var chatRequest = new ChatRequest(payload.ThreadId, context.RequestServices)
        {
            Metadata = metadata
        };

        if (!string.IsNullOrWhiteSpace(payload.Message))
        {
            InterAgentCommunicationContext.SetUserMessage(chatRequest, payload.Message);
        }

        context.Response.ContentType = "text/event-stream";
        context.Response.Headers.Add("Cache-Control", "no-cache");
        context.Response.Headers.Add("Connection", "keep-alive");

        var triageAgent = context.RequestServices.GetService<IAgent>();
        var ct = context.RequestAborted;

        if (triageAgent != null)
        {
            var outcome = await triageAgent.InvokeAsync(chatRequest, ct);
            await outcome.Match(async result =>
            {
                var json = System.Text.Json.JsonSerializer.Serialize(result, Serialization.Default);
                await context.Response.WriteAsync($"data: {json}\n\n");
                await context.Response.Body.FlushAsync(ct);
                return Task.CompletedTask;
            }, async error =>
            {
                context.Response.StatusCode = 500;
                var errorJson = System.Text.Json.JsonSerializer.Serialize(new { Error = error });
                await context.Response.WriteAsync($"data: {errorJson}\n\n");
                await context.Response.Body.FlushAsync(ct);
                return Task.CompletedTask;
            });
        }
        else
        {
            var agentDelegate = GetAgentDelegate(context.RequestServices);
            var outcome = await agentDelegate(chatRequest, ct);
            await outcome.Match(async result =>
            {
                var json = System.Text.Json.JsonSerializer.Serialize(result, Serialization.Default);
                await context.Response.WriteAsync($"data: {json}\n\n");
                await context.Response.Body.FlushAsync(ct);
                return Task.CompletedTask;
            }, async error =>
            {
                context.Response.StatusCode = 500;
                var errorJson = System.Text.Json.JsonSerializer.Serialize(new { Error = error });
                await context.Response.WriteAsync($"data: {errorJson}\n\n");
                await context.Response.Body.FlushAsync(ct);
                return Task.CompletedTask;
            });
        }
    }

    private static AgentDelegate GetAgentDelegate(IServiceProvider serviceProvider)
    {
        return serviceProvider.GetRequiredService<AgentDelegate>();
    }

    /// <summary>
    /// Handles an incoming message request.
    /// </summary>
    /// <remarks>
    /// This method:
    /// 1. Deserializes the request body to <see cref="UserMessageDto"/>
    /// 2. Calls <see cref="ChatWidgetService.RespondAsync"/>
    /// 3. Serializes the response back to JSON
    /// </remarks>
    private static async Task HandleMessageRequest(HttpContext context)
    {
        var service = context.RequestServices.GetRequiredService<ChatWidgetService>();
        var dto = await DeserializeRequest<UserMessageDto>(context);
        var ct = context.RequestAborted;

        var turn = await service.RespondAsync(dto.Message, dto.ThreadId, ct);
        await WriteJsonResponse(context, turn);
    }

    /// <summary>
    /// Handles an incoming action request.
    /// </summary>
    /// <remarks>
    /// This method:
    /// 1. Deserializes the request body to <see cref="WidgetActionDto"/>
    /// 2. Calls <see cref="ChatWidgetService.HandleActionAsync"/>
    /// 3. Serializes the response back to JSON
    /// </remarks>
    private static async Task HandleActionRequest(HttpContext context)
    {
        var service = context.RequestServices.GetRequiredService<ChatWidgetService>();
        var dto = await DeserializeRequest<WidgetActionDto>(context);
        var ct = context.RequestAborted;

        var turn = await service.HandleActionAsync(dto.Action, dto.Payload ?? [], dto.ThreadId, context.RequestServices, ct);
        await WriteJsonResponse(context, turn);
    }

    /// <summary>
    /// Deserializes the HTTP request body to the specified type.
    /// </summary>
    /// <typeparam name="T">The type to deserialize to.</typeparam>
    /// <param name="context">The HTTP context.</param>
    /// <returns>The deserialized object.</returns>
    /// <exception cref="InvalidOperationException">
    /// Thrown if the request body cannot be deserialized to the specified type.
    /// </exception>
    private static async Task<T> DeserializeRequest<T>(HttpContext context)
    {
        using var reader = new System.IO.StreamReader(context.Request.Body);
        var body = await reader.ReadToEndAsync();
        return System.Text.Json.JsonSerializer.Deserialize<T>(body, Serialization.Default) ?? throw new InvalidOperationException("Failed to deserialize request");
    }

    /// <summary>
    /// Writes a JSON response to the HTTP context.
    /// </summary>
    /// <param name="context">The HTTP context.</param>
    /// <param name="data">The object to serialize as JSON.</param>
    private static async Task WriteJsonResponse(HttpContext context, object data)
    {
        context.Response.ContentType = "application/json";
        var json = System.Text.Json.JsonSerializer.Serialize(data, Serialization.Default);
        await context.Response.WriteAsync(json);
    }
}