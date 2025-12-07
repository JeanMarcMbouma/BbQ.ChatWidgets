using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Endpoints;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.DependencyInjection;

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
        services.AddScoped<IThreadService, DefaultThreadService>();
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

        return services;
    }

    /// <summary>
    /// Maps BbQ ChatWidgets API endpoints to the application.
    /// </summary>
    /// <remarks>
    /// This extension method registers middleware that handles two endpoints:
    /// - POST {routePrefix}/message: Send user messages and get AI responses with widgets
    /// - POST {routePrefix}/action: Handle widget-triggered actions
    /// 
    /// The route prefix is configurable via <see cref="BbQChatOptions.RoutePrefix"/> (default: "/api/chat").
    /// 
    /// Request/Response format:
    /// - Content-Type: application/json
    /// - Serialization: camelCase JSON with custom serialization options
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
                await HandleMessageRequest(context, app.ApplicationServices);
                return;
            }

            if (context.Request.Method == HttpMethods.Post && path == $"{prefix}/action")
            {
                await HandleActionRequest(context, app.ApplicationServices);
                return;
            }

            await next();
        });

        return app;
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
    private static async Task HandleMessageRequest(HttpContext context, IServiceProvider services)
    {
        var service = services.GetRequiredService<ChatWidgetService>();
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
    private static async Task HandleActionRequest(HttpContext context, IServiceProvider services)
    {
        var service = services.GetRequiredService<ChatWidgetService>();
        var dto = await DeserializeRequest<WidgetActionDto>(context);
        var ct = context.RequestAborted;

        var turn = await service.HandleActionAsync(dto.Action, dto.Payload ?? [], dto.ThreadId, services, ct);
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