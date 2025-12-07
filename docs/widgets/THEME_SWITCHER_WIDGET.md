# ThemeSwitcherWidget

## Overview

The `ThemeSwitcherWidget` is a new interactive widget that enables users to select from multiple theme options. It renders as a dropdown (`<select>`) element, making it ideal for theme selection, color scheme switching, and application customization.

## Use Cases

- **Light/Dark Mode Toggle** — Switch between light, dark, and auto (system preference) themes
- **Color Scheme Selection** — Allow users to choose from multiple predefined color schemes
- **Application Theming** — Customize application appearance without page reload
- **Accessibility Options** — Provide contrast or visual adjustment options

## Basic Usage

### C# Backend

```csharp
// Create a theme switcher widget
var themeWidget = new ThemeSwitcherWidget(
    Label: "Choose Theme",
    Action: "set_theme",
    Themes: ["light", "dark", "auto"]
);

// Render to HTML using SsrWidgetRenderer
var renderer = new SsrWidgetRenderer();
var html = renderer.RenderWidget(themeWidget);

// Or include in an AI response with widgets
var chatTurn = new ChatTurn(
    ChatRole.Assistant,
    "Would you like to change the application theme?",
    new[] { themeWidget },
    threadId
);
```

### JSON Format

```json
{
  "type": "themeswitcher",
  "label": "Choose Theme",
  "action": "set_theme",
  "themes": ["light", "dark", "auto"]
}
```

### Generated HTML (SSR)

```html
<div class="bbq-widget bbq-theme-switcher" data-widget-id="bbq-set_theme" data-widget-type="themeswitcher">
  <label class="bbq-theme-switcher-label" for="bbq-set_theme-select">Choose Theme</label>
  <select id="bbq-set_theme-select" class="bbq-theme-switcher-select" data-action="set_theme" aria-labelledby="bbq-set_theme-select">
    <option value="light">light</option>
    <option value="dark">dark</option>
    <option value="auto">auto</option>
  </select>
</div>
```

## Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `Label` | `string` | Yes | Display label for the theme switcher |
| `Action` | `string` | Yes | Action identifier triggered when theme is selected |
| `Themes` | `IReadOnlyList<string>` | Yes | List of available theme options (e.g., `["light", "dark", "auto"]`) |

## CSS Classes

| Class | Purpose |
|-------|---------|
| `bbq-widget` | Applied to all widgets for generic styling |
| `bbq-theme-switcher` | Main container for the theme switcher |
| `bbq-theme-switcher-label` | Label element styling |
| `bbq-theme-switcher-select` | Select dropdown element styling |

## Data Attributes

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `data-widget-id` | `bbq-{action}` | Unique identifier for the widget |
| `data-widget-type` | `themeswitcher` | Widget type identifier |
| `data-action` | Action string | The action to trigger when selection changes |

## Client-Side Integration

### Angular Example

```typescript
import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-theme-switcher',
  template: `<div [innerHTML]="widgetHtml"></div>`
})
export class ThemeSwitcherComponent implements OnInit {
  widgetHtml: SafeHtml;

  constructor(private sanitizer: DomSanitizer, private themeService: ThemeService) {}

  ngOnInit() {
    // Get widget from backend
    this.api.getWidgets().subscribe(response => {
      const widget = response.widgets.find(w => w.type === 'themeswitcher');
      
      // Sanitize and render HTML
      this.widgetHtml = this.sanitizer.sanitize(
        1, // SecurityContext.HTML
        widget.html
      );

      // Attach listener after render
      setTimeout(() => {
        const select = document.querySelector('[data-widget-type="themeswitcher"] select');
        select?.addEventListener('change', (e: Event) => {
          const theme = (e.target as HTMLSelectElement).value;
          this.themeService.applyTheme(theme);
          this.handleAction('set_theme', { theme });
        });
      }, 0);
    });
  }

  handleAction(action: string, payload: any) {
    this.api.handleAction(action, payload).subscribe(response => {
      // Handle response
    });
  }
}
```

### React Example

```jsx
import React, { useEffect } from 'react';
import DOMPurify from 'dompurify';

export function ThemeSwitcher({ widget, onThemeChange }) {
  useEffect(() => {
    const select = document.querySelector('[data-widget-type="themeswitcher"] select');
    
    const handleChange = (e) => {
      const theme = e.target.value;
      onThemeChange(theme);
      
      // Send to backend
      fetch('/api/chat/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: widget.action,
          payload: { theme },
          threadId: widget.threadId
        })
      });
    };

    select?.addEventListener('change', handleChange);

    return () => {
      select?.removeEventListener('change', handleChange);
    };
  }, [widget]);

  const html = DOMPurify.sanitize(widget.html);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```

## Styling Examples

### Minimal Styling

```css
.bbq-theme-switcher {
  margin: 10px 0;
}

.bbq-theme-switcher-select {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.bbq-theme-switcher-select:hover {
  border-color: #999;
}
```

### Bootstrap Styling

```css
.bbq-theme-switcher {
  margin-bottom: 1rem;
}

.bbq-theme-switcher-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.bbq-theme-switcher-select {
  width: 100%;
  padding: 0.375rem 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
  background-color: #fff;
}
```

### Tailwind Styling

```css
.bbq-theme-switcher {
  @apply mb-4;
}

.bbq-theme-switcher-label {
  @apply block mb-2 font-medium text-gray-700;
}

.bbq-theme-switcher-select {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500;
}
```

## Backend Handler Implementation

When the user selects a theme, the action is sent to your backend:

```csharp
[Action("set_theme")]
public class SetThemeHandler : IWidgetActionHandler<SetThemePayload>
{
    private readonly IThemeService _themeService;

    public SetThemeHandler(IThemeService themeService)
    {
        _themeService = themeService;
    }

    public async Task<ChatTurn> HandleActionAsync(
        SetThemePayload payload,
        string threadId,
        IServiceProvider serviceProvider)
    {
        // Apply theme
        _themeService.SetUserTheme(payload.Theme);

        // Return confirmation response
        return new ChatTurn(
            ChatRole.Assistant,
            $"Theme changed to {payload.Theme}",
            Array.Empty<ChatWidget>(),
            threadId
        );
    }
}

public class SetThemePayload
{
    public string Theme { get; set; } = default!;
}
```

## Serialization and Deserialization

The `ThemeSwitcherWidget` supports full JSON serialization/deserialization:

```csharp
// Serialize
var widget = new ThemeSwitcherWidget("Theme", "set_theme", ["light", "dark"]);
var json = widget.ToJson();
// Output: {"type":"themeswitcher","label":"Theme","action":"set_theme","themes":["light","dark"]}

// Deserialize
var deserialized = ChatWidget.FromJson(json);
if (deserialized is ThemeSwitcherWidget ts)
{
    Console.WriteLine($"Selected theme action: {ts.Action}");
}
```

## Server-Side Rendering Details

The `SsrWidgetRenderer` generates:
- **Semantic HTML** — Standard `<select>` element with accessibility attributes
- **Data Attributes** — `data-action`, `data-widget-id`, `data-widget-type` for client-side binding
- **ARIA Labels** — Proper `aria-labelledby` for screen readers
- **Escaped Content** — All user-provided strings are HTML-escaped to prevent XSS

## Accessibility

The rendered HTML includes:
- `<label>` elements with proper `for` attributes
- `aria-labelledby` attributes on the select element
- Semantic HTML structure
- Proper ID generation for form element association

## Testing

Unit tests are provided in `BbQ.ChatWidgets.Tests/Renderers/SsrWidgetRendererTests.cs`:

```csharp
[Fact]
public void RenderWidget_WithThemeSwitcherWidget_GeneratesSelectHtml()
{
    // Arrange
    var widget = new ThemeSwitcherWidget(
        Label: "Choose Theme",
        Action: "set_theme",
        Themes: ["light", "dark", "auto"]
    );

    // Act
    var html = _renderer.RenderWidget(widget);

    // Assert
    Assert.Contains("bbq-theme-switcher", html);
    Assert.Contains("data-widget-type=\"themeswitcher\"", html);
    Assert.Contains("<option value=\"light\">light</option>", html);
}
```

## Best Practices

1. **Use Predefined Themes** — Provide a fixed list of theme options
2. **Persist Selection** — Store the user's theme preference in localStorage or database
3. **Sanitize HTML** — Always sanitize the rendered HTML on the client before displaying
4. **Handle Selection** — Implement a backend handler to process theme selection
5. **Provide Feedback** — Show visual feedback when the theme changes
6. **Test Accessibility** — Verify the widget works with screen readers

## Example: Complete Theme Switching Flow

```csharp
// Backend: Create and send theme widget
var themeWidget = new ThemeSwitcherWidget(
    "Choose your theme",
    "change_theme",
    ["light", "dark", "high-contrast"]
);

// Frontend: User selects a theme
// Backend receives: { action: "change_theme", payload: { theme: "dark" } }

// Backend handler processes and responds
[Action("change_theme")]
public class ChangeThemeHandler : IWidgetActionHandler<ThemeSelection>
{
    public async Task<ChatTurn> HandleActionAsync(
        ThemeSelection payload,
        string threadId,
        IServiceProvider serviceProvider)
    {
        // Apply theme to user's session
        var userService = serviceProvider.GetRequiredService<IUserService>();
        await userService.SetThemeAsync(payload.Theme);

        return new ChatTurn(
            ChatRole.Assistant,
            $"I've applied the {payload.Theme} theme. The change will take effect immediately.",
            Array.Empty<ChatWidget>(),
            threadId
        );
    }
}
```

## See Also

- [Widget Types Overview](../widgets/WIDGET_TYPES.md)
- [Server-Side Rendering Guide](../guides/SERVER_SIDE_RENDERING.md)
- [SsrWidgetRenderer Documentation](../api/RENDERER_API.md)
- [Custom Renderers](../guides/CUSTOM_RENDERERS.md)

---

**Questions?** [GitHub Discussions](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/discussions)
