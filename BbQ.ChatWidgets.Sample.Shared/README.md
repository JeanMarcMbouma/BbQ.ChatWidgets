# BbQ.ChatWidgets.Sample.Shared Library

## Overview
`BbQ.ChatWidgets.Sample.Shared` is a centralized library containing shared sample code used by both the **WebApp** (React/ASP.NET Core) and **BlazorApp** (Blazor Web App) sample applications.

This eliminates code duplication and provides a single source of truth for:
- Custom widget models (ECharts, Clock, Weather)
- Widget action definitions and handlers
- Triage agent system (classifiers and specialized agents)
- SSE publishers for real-time updates

## Project Structure

```
BbQ.ChatWidgets.Sample.Shared/
├── BbQ.ChatWidgets.Sample.Shared.csproj    # Project file
├── SampleActions.cs                         # Widget actions & handlers
├── EChartsWidget.cs                         # Custom ECharts widget
├── ClockWidget.cs                           # SSE-driven clock widget
├── WeatherWidget.cs                         # SSE-driven weather widget
├── Agents/                                  # Triage agent system
│   ├── UserIntent.cs                        # Intent classification enum
│   ├── UserIntentClassifier.cs              # AI-based classifier
│   ├── SpecializedAgents.cs                 # Help, DataQuery, Action, Feedback agents
│   └── SharedTriageSetup.cs                 # Service registration extension
└── Services/                                # SSE publishers
    ├── ClockPublisher.cs                    # Server-side clock updates
    └── WeatherPublisher.cs                  # Server-side weather updates
```

## Key Components

### 1. **Widgets** (Widget Models)

#### EChartsWidget
- Custom chart widget using Apache ECharts
- Supports bar, line, pie, and other chart types
- Accepts raw ECharts JSON configuration
- Demonst rates extensibility without modifying core library

#### ClockWidget
- SSE-driven server time display
- Updates via Server-Sent Events stream
- Configurable timezone support
- Real-time clock updates from server

#### WeatherWidget
- SSE-driven weather data display
- Simulated weather cycling for multiple cities
- Updates via Server-Sent Events stream
- Demonstrates long-running SSE streams

### 2. **Actions & Handlers** (SampleActions.cs)

All action types implement `IWidgetAction<TPayload>` with type-safe handlers:

- **GreetingAction/GreetingPayload/GreetingHandler**
  - Simple user greeting with name capture

- **FeedbackAction/FeedbackPayload/FeedbackHandler**
  - User feedback submission

- **EChartsClickAction/EChartsClickPayload/EChartsClickHandler**
  - Handles chart click events from ECharts widget
  - Payload: `{ Index: int, Value: double }`

- **ClockTickAction/ClockPayload/ClockTickHandler**
  - SSE-driven clock update handler
  - Payload: `{ Time: string }`

- **WeatherUpdateAction/WeatherPayload/WeatherUpdateHandler**
  - SSE-driven weather update handler
  - Payload: `{ City: string, Condition: string, Temperature: int, ... }`

### 3. **Triage Agent System** (Agents/)

#### UserIntent Enum
Five classification categories:
- `HelpRequest` - User needs support or assistance
- `DataQuery` - User asking for information
- `ActionRequest` - User wants something executed
- `Feedback` - User providing suggestions
- `Unknown` - Intent unclassifiable

#### UserIntentClassifier
- AI-based intent detection using OpenAI ChatClient
- Classifies incoming messages without tool calls
- Returns classified `UserIntent` category
- Includes error handling for robustness

#### Specialized Agents
Four agents handle different intent categories:
- **HelpAgent** - Provides support responses
- **DataQueryAgent** - Responds with information
- **ActionAgent** - Requests action confirmation
- **FeedbackAgent** - Thanks user for feedback

#### SharedTriageSetup
Extension method `AddSharedTriageAgents()` registers:
- Classifier (IClassifier<UserIntent>)
- Agent registry with 4 specialized agents
- Triage agent with automatic routing
- Maps classification → agent routing

### 4. **SSE Publishers** (Services/)

#### ClockPublisher
- Background service publishing server time
- Updates every 1 second (configurable)
- JSON payload: `{ widgetId, time (ISO), timeLocal }`
- Automatic stream cancellation on stop

#### WeatherPublisher
- Background service cycling through weather conditions
- Updates every 5 seconds (configurable)
- Supports multiple cities (London, New York, Tokyo)
- JSON payload: `{ widgetId, city, condition, temperature, humidity, windDirection, windSpeed, timestamp }`

## Usage

### In WebApp (React/ASP.NET Core)
```csharp
// Program.cs
using BbQ.ChatWidgets.Sample.Shared;
using BbQ.ChatWidgets.Sample.Shared.Agents;
using BbQ.ChatWidgets.Sample.Shared.Services;

// Register all shared components
services.AddSharedTriageAgents();
services.AddSingleton<ClockPublisher>();
services.AddSingleton<WeatherPublisher>();

// Custom widgets in registry configurator
bbqOptions.WidgetRegistryConfigurator = registry =>
{
    registry.Register(new EChartsWidget(...));
    registry.Register(new ClockWidget(...));
    registry.Register(new WeatherWidget(...));
};

// Action handlers
bbqOptions.WidgetActionRegistryFactory = (sp, registry, resolver) =>
{
    registry.RegisterHandler<GreetingAction, GreetingPayload, GreetingHandler>(resolver);
    registry.RegisterHandler<FeedbackAction, FeedbackPayload, FeedbackHandler>(resolver);
    // ... other actions
};
```

### In BlazorApp (Blazor Web App)
```csharp
// Identical usage - same shared library
```

## Benefits

1. **Single Source of Truth**
   - No duplicate action definitions across apps
   - Changes propagate to both apps automatically

2. **Maintainability**
   - Action payloads defined once
   - Handlers implemented once
   - Reduces testing burden

3. **Reusability**
   - Other projects can reference BbQ.ChatWidgets.Sample.Shared
   - Shared patterns available to community

4. **Extensibility**
   - Add new actions without modifying sample apps
   - Agents can be specialized per app if needed

5. **Testing**
   - Unit tests can target shared components
   - Integration tests validate cross-app consistency

## Project Dependencies

- **BbQ.ChatWidgets** - Core widget library
- **Microsoft.Extensions.DependencyInjection** - Service registration
- **.NET 8.0**

## Files Modified for Integration

### WebApp.csproj
```xml
<ProjectReference Include="..\..\BbQ.ChatWidgets.Sample.Shared\BbQ.ChatWidgets.Sample.Shared.csproj" />
```

### BlazorApp.csproj
```xml
<ProjectReference Include="../../BbQ.ChatWidgets.Sample.Shared/BbQ.ChatWidgets.Sample.Shared.csproj" />
```

### Program.cs Files (Both Apps)
- Changed imports from `Sample.WebApp.*` to `Sample.Shared.*`
- Call `AddSharedTriageAgents()` instead of app-specific method
- Reference shared service registrations

## Build Status
✅ **Build Success**: All projects compile without errors
- BbQ.ChatWidgets
- BbQ.ChatWidgets.Sample.Shared
- BbQ.ChatWidgets.Blazor
- Sample/WebApp
- Sample/BlazorApp
