using Microsoft.Extensions.AI;
using BbQ.ChatWidgets.Extensions;
using BbQ.ChatWidgets.Sample.Shared;
using BbQ.ChatWidgets.Agents.Abstractions;
using BbQ.ChatWidgets.Sample.Shared.Agents;
using BbQ.ChatWidgets.Sample.Shared.Services;

/// <summary>
/// BbQ.ChatWidgets Web API Sample Application
/// 
/// This sample demonstrates:
/// - Using OpenAI chat client with BbQ.ChatWidgets
/// - ASP.NET Core Web API with chat endpoints
/// - React frontend consuming the chat API
/// - Widget-based interactive UI
/// - Typed action handlers with IWidgetAction<T>
/// - Triage agent with intent classification and agent routing
/// - Agent-to-agent communication through metadata
/// </summary>
/// 
var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseDefaultServiceProvider(options =>
{
    options.ValidateScopes = false;
    options.ValidateOnBuild = true;
});
// Add services to the container
var configuration = builder.Configuration;
var services = builder.Services;

// Configure OpenAI chat client factory
var openaiModelId = configuration["OpenAI:ModelId"] ?? "gpt-4o-mini";
var openaiApiKey = configuration["OpenAI:ApiKey"];

if (string.IsNullOrEmpty(openaiApiKey))
{
    throw new InvalidOperationException(
        "OpenAI API key not found. Please set 'OpenAI:ApiKey' in appsettings.Development.json or environment variables.");
}

IChatClient openaiClient =
    new OpenAI.Chat.ChatClient(openaiModelId, openaiApiKey)
    .AsIChatClient();

IChatClient chatClient = new ChatClientBuilder(openaiClient)
    .UseFunctionInvocation()
    .Build();

// Register BbQ.ChatWidgets services
services.AddBbQChatWidgets(bbqOptions =>
{
    bbqOptions.RoutePrefix = "/api/chat";
    bbqOptions.ChatClientFactory = sp => chatClient;
    bbqOptions.WidgetRegistryConfigurator = registry =>
    {
        // Additional custom widget registrations can go here
        // e.g., registry.Register(new CustomWidget(...));
        registry.Register(new EChartsWidget("Sales Chart", "on_chart_click", "bar", "{\"xAxis\": {\"type\": \"category\", \"data\": [\"Jan\", \"Feb\", \"Mar\"]}, \"yAxis\": {\"type\": \"value\"}, \"series\": [{\"data\": [100, 200, 150], \"type\": \"bar\"}]}"));
        // Register a server-side Clock widget template used by the SSE demo.
        // Specify a stream ID so the widget knows which SSE stream to subscribe to on the client.
        registry.Register(new ClockWidget("Server Clock", "clock_tick", "UTC", "default-stream"), "clock");
        // Register a server-side Weather widget template used for SSE weather updates demo.
        registry.Register(new WeatherWidget("Weather", "weather_update", "London", "weather-stream"), "weather");
    };
    bbqOptions.WidgetActionRegistryFactory = (sp, actionRegistry, handlerResolver) =>
    {

        // Register greeting action
        actionRegistry.RegisterHandler<GreetingAction, GreetingPayload, GreetingHandler>(handlerResolver);

        // Register feedback action
        actionRegistry.RegisterHandler<FeedbackAction, FeedbackPayload, FeedbackHandler>(handlerResolver);

        // Register ECharts click action (demonstrates custom widget integration)
        actionRegistry.RegisterHandler<EChartsClickAction, EChartsClickPayload, EChartsClickHandler>(handlerResolver);

        // Register clock tick action (demonstrates SSE widget integration)
        actionRegistry.RegisterHandler<ClockTickAction, ClockPayload, ClockTickHandler>(handlerResolver);

        // Register weather update action (demonstrates SSE widget integration)
        actionRegistry.RegisterHandler<WeatherUpdateAction, WeatherPayload, WeatherUpdateHandler>(handlerResolver);
    };
});

// Register triage agent system with specialized agents
services.AddSharedTriageAgents();

// Register typed action handlers
services.AddScoped<GreetingHandler>();
services.AddScoped<FeedbackHandler>();
services.AddScoped<EChartsClickHandler>();
services.AddScoped<ClockTickHandler>();
services.AddScoped<WeatherUpdateHandler>();

// Register triage-aware chat service
//services.AddScoped<TriageAwareChatService>();

// Register sample clock publisher for SSE demo
services.AddSingleton<ClockPublisher>();

// Register sample weather publisher for SSE demo
services.AddSingleton<WeatherPublisher>();

// Add CORS for React frontend
services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
app.UseRouting();
app.UseCors();
app.UseDefaultFiles();
app.UseStaticFiles();

// Log startup information
var logger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");
logger.LogInformation("=== BbQ.ChatWidgets Web API Sample ===");
logger.LogInformation("Chat API available at POST /api/chat/message");
logger.LogInformation("Widget actions available at POST /api/chat/action");
logger.LogInformation("React frontend served from wwwroot/");
logger.LogInformation("");
logger.LogInformation("Triage Agent System: Enabled");

// Log registered agents
var agentRegistry = app.Services.GetRequiredService<IAgentRegistry>();
logger.LogInformation("Registered specialized agents:");
foreach (var agentName in agentRegistry.GetRegisteredAgents())
{
    logger.LogInformation($"  - {agentName}");
}

logger.LogInformation("User intent categories:");
logger.LogInformation("  - HelpRequest ? help-agent");
logger.LogInformation("  - DataQuery ? data-query-agent");
logger.LogInformation("  - ActionRequest ? action-agent");
logger.LogInformation("  - Feedback ? feedback-agent");
logger.LogInformation("  - Unknown ? help-agent (fallback)");

// Map BbQ.ChatWidgets endpoints
app.MapBbQChatEndpoints();

// Sample endpoints to start/stop a server-side clock that publishes to SSE streams
app.MapPost("/sample/clock/{streamId}/start", async (string streamId, ClockPublisher clock, ILoggerFactory lf) =>
{
    var logger = lf.CreateLogger("ClockPublisher");
    logger.LogInformation("Starting clock for {streamId}", streamId);
    await clock.StartAsync(streamId);
    return Results.Ok();
});

app.MapPost("/sample/clock/{streamId}/stop", async (string streamId, ClockPublisher clock, ILoggerFactory lf) =>
{
    var logger = lf.CreateLogger("ClockPublisher");
    logger.LogInformation("Stopping clock for {streamId}", streamId);
    await clock.StopAsync(streamId);
    return Results.Ok();
});

// Sample endpoints to start/stop weather publisher that publishes to SSE streams
app.MapPost("/sample/weather/{streamId}/start", async (string streamId, string? city, WeatherPublisher weather, ILoggerFactory lf) =>
{
    var logger = lf.CreateLogger("WeatherPublisher");
    logger.LogInformation("Starting weather publisher for {streamId}, city={city}", streamId, city ?? "London");
    await weather.StartAsync(streamId, city ?? "London");
    return Results.Ok();
});

app.MapPost("/sample/weather/{streamId}/stop", async (string streamId, WeatherPublisher weather, ILoggerFactory lf) =>
{
    var logger = lf.CreateLogger("WeatherPublisher");
    logger.LogInformation("Stopping weather publisher for {streamId}", streamId);
    await weather.StopAsync(streamId);
    return Results.Ok();
});

// Fallback to index.html for SPA routing
app.MapFallbackToFile("index.html");

app.Run();
