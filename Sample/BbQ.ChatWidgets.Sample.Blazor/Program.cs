using Microsoft.Extensions.AI;
using BbQ.ChatWidgets.Blazor;
using BbQ.ChatWidgets.Extensions;
using BbQ.ChatWidgets.Sample.Shared;
using BbQ.ChatWidgets.Sample.Shared.Agents;
using BbQ.ChatWidgets.Sample.Shared.Services;
using BbQ.ChatWidgets.Sample.Blazor.Components.CustomWidgets;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseDefaultServiceProvider(options =>
{
    options.ValidateScopes = false;
    options.ValidateOnBuild = true;
});

// Add services to the container.
var configuration = builder.Configuration;
var services = builder.Services;

services
    .AddRazorComponents()
    .AddInteractiveServerComponents();

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
    bbqOptions.EnablePersona = true;
    bbqOptions.WidgetRegistryConfigurator = registry =>
    {
        // Register custom ECharts widget
        registry.Register(new EChartsWidget("Sales Chart", "on_chart_click", "bar", "{\"xAxis\": {\"type\": \"category\", \"data\": [\"Jan\", \"Feb\", \"Mar\"]}, \"yAxis\": {\"type\": \"value\"}, \"series\": [{\"data\": [100, 200, 150], \"type\": \"bar\"}]}"));
       
        // Register a server-side Weather widget template used for SSE weather updates demo.
        registry.Register(new WeatherWidget("Weather", "weather_update", "London", "weather-stream"), "weather");
    };
    bbqOptions.WidgetActionRegistryFactory = (sp, actionRegistry, handlerResolver) =>
    {
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

// Register a server-side Clock widget template used by the SSE demo.
services.AddWidget(sp => new ClockWidget("Server Clock", "clock_tick", "UTC", "default-stream"), "clock");
services.AddWidgetActionHandler<GreetingAction, GreetingPayload, GreetingHandler>();

services.AddBbQChatWidgetsBlazor(options =>
{
        // Example of overriding a default/custom widget with a custom Blazor component
        options.Add<ClockWidget, ClockWidgetComponent>("clock");
});

// Register triage agent system with specialized agents
services.AddSharedTriageAgents();

// Register typed action handlers
services.AddScoped<GreetingHandler>();
services.AddScoped<FeedbackHandler>();
services.AddScoped<EChartsClickHandler>();
services.AddScoped<ClockTickHandler>();
services.AddScoped<WeatherUpdateHandler>();

// Register sample clock publisher for SSE demo
services.AddSingleton<ClockPublisher>();

// Register sample weather publisher for SSE demo
services.AddSingleton<WeatherPublisher>();

// Register HttpClient for API communication
services.AddHttpClient();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseAntiforgery();

// Map BbQ Chat Widget endpoints
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
app.MapRazorComponents<BbQ.ChatWidgets.Sample.Blazor.Components.App>()
    .AddInteractiveServerRenderMode();

app.Run();
