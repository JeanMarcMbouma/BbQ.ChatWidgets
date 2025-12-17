# Custom Widgets Guide

Creating custom widgets allows you to extend the chat interface with specialized UI components tailored to your application's needs. This guide covers the end-to-end process of creating and registering a custom widget.

## 1. Server-Side Implementation (.NET)

A widget on the server is a class that implements the `IChatWidget` interface (or inherits from `ChatWidget`). It defines the data structure that will be sent to the client and described to the LLM.

### Create the Widget Class

```csharp
using BbQ.ChatWidgets.Models;

public class WeatherWidget : ChatWidget
{
    public string City { get; set; }
    public double Temperature { get; set; }
    public string Condition { get; set; }

    public WeatherWidget(string city, double temp, string condition) 
        : base("weather") // "weather" is the unique type identifier
    {
        City = city;
        Temperature = temp;
        Condition = condition;
    }
}
```

### Register the Widget Template

You must register an instance of your widget as a "template" in the `WidgetRegistry`. This template is used to generate the tool definition for the LLM.

```csharp
builder.Services.AddBbQChatWidgets(options =>
{
    options.WidgetRegistryConfigurator = registry =>
    {
        // Register a template instance
        registry.Register(new WeatherWidget("London", 20, "Sunny"), "weather");
    };
});
```

## 2. Client-Side Implementation (JavaScript/TypeScript)

On the client, you need to tell the `WidgetManager` how to render the "weather" widget type.

### Create a Renderer

A renderer is a function (or a component in frameworks like React) that takes the widget data and returns a DOM element or JSX.

```javascript
// Vanilla JS Example
function renderWeatherWidget(widget, container) {
    const el = document.createElement('div');
    el.className = 'weather-widget';
    el.innerHTML = `
        <h3>Weather in ${widget.data.city}</h3>
        <p>${widget.data.temperature}°C - ${widget.data.condition}</p>
    `;
    container.appendChild(el);
}
```

### Register the Renderer

```javascript
import { WidgetManager } from '@bbq-chat/widgets';

const manager = new WidgetManager();

// Register the renderer for the "weather" type
manager.registerRenderer('weather', renderWeatherWidget);
```

## 3. LLM Interaction

Once registered, the LLM will automatically see the `weather` widget as an available tool. It can "call" this tool by including a widget hint in its response:

```xml
<widget type="weather" city="Paris" temperature="22" condition="Cloudy" />
```

The `ChatWidgetService` will parse this hint, instantiate your `WeatherWidget` class, and include it in the `ChatTurn` sent to the client.

## Best Practices

- **Keep Data Simple**: Only send the data necessary for rendering.
- **Use Descriptive Names**: Choose clear type identifiers and property names to help the LLM understand the widget's purpose.
- **Handle Actions**: If your widget is interactive (e.g., has buttons), see the [Action Handlers Guide](CUSTOM_ACTION_HANDLERS.md) to learn how to handle user input on the server.
