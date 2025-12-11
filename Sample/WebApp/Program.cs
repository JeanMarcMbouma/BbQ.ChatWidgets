using Microsoft.Extensions.AI;
using BbQ.ChatWidgets.Extensions;
using BbQ.ChatWidgets.Sample.WebApp.Actions;
using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Services;
using BbQ.ChatWidgets.Sample.WebApp.Models;

/// <summary>
/// BbQ.ChatWidgets Web API Sample Application
/// 
/// This sample demonstrates:
/// - Using OpenAI chat client with BbQ.ChatWidgets
/// - ASP.NET Core Web API with chat endpoints
/// - React frontend consuming the chat API
/// - Widget-based interactive UI
/// - Typed action handlers with IWidgetAction<T>
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
    };
});

// Register typed action handlers
services.AddScoped<GreetingHandler>();
services.AddScoped<FeedbackHandler>();
services.AddScoped<EChartsClickHandler>();

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

// Register typed action handlers with the registry
var actionRegistry = app.Services.GetRequiredService<IWidgetActionRegistry>();
var handlerResolver = app.Services.GetRequiredService<IWidgetActionHandlerResolver>();

// Register greeting action
var greetingAction = new GreetingAction();
actionRegistry.RegisterHandler<GreetingAction, GreetingPayload, GreetingHandler>(handlerResolver, greetingAction);

// Register feedback action
var feedbackAction = new FeedbackAction();
actionRegistry.RegisterHandler<FeedbackAction, FeedbackPayload, FeedbackHandler>(handlerResolver, feedbackAction);

// Register ECharts click action (demonstrates custom widget integration)
var echartsClickAction = new EChartsClickAction();
actionRegistry.RegisterHandler<EChartsClickAction, EChartsClickPayload, EChartsClickHandler>(handlerResolver, echartsClickAction);

// Map BbQ.ChatWidgets endpoints
app.MapBbQChatEndpoints();

// Fallback to index.html for SPA routing
app.MapFallbackToFile("index.html");

app.Run();
