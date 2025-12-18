# BbQ Chat Widgets Blazor - Theme Support

The BbQ Chat Widgets Blazor library includes three professionally designed themes that are embedded in the library and ready to use.

## Available Themes

### 1. Light Theme (`bbq-chat-light.css`)
A clean, light theme with soft grays and blue accents. Perfect for modern applications with a professional appearance.
- Primary Color: Blue (#3b82f6)
- Background: White with light grays
- Best for: Daytime use, professional settings

### 2. Dark Theme (`bbq-chat-dark.css`)
A modern dark theme with vibrant purple-blue gradient accents. Ideal for applications with dark mode support.
- Primary Color: Purple-to-Indigo gradient (#8b5cf6 → #6366f1)
- Background: Dark slate with subtle gradients
- Best for: Nighttime use, modern aesthetics

### 3. Corporate Theme (`bbq-chat-corporate.css`)
A professional corporate theme with slate blues and business-oriented styling.
- Primary Color: Dark gray/blue (#1f2937)
- Background: Clean white with professional accents
- Best for: Enterprise applications, formal environments

## Usage

### Basic Setup

1. Add the Blazor library to your Blazor application:

```csharp
// In Program.cs
services.AddBbQChatWidgetsBlazor();
```

2. Reference the theme in your `App.razor`:

```razor
@* In Components/App.razor *@
<link rel="stylesheet" href="_content/BbQ.ChatWidgets.Blazor/themes/bbq-chat-light.css" />
```

### Using the Theme Service

The `IThemeService` allows you to programmatically manage themes:

```csharp
@inject IThemeService ThemeService

@code {
    protected override async Task OnInitializedAsync()
    {
        // Get available themes
        var themes = ThemeService.AvailableThemes; // ["light", "dark", "corporate"]
        
        // Get current theme
        var current = ThemeService.CurrentTheme;
        
        // Set a theme
        await ThemeService.SetThemeAsync("dark");
    }
}
```

### Dynamic Theme Switching

Use the `ThemeSwitcher` component for easy theme switching:

```razor
@* In your layout or page *@
<ThemeSwitcher />
```

The component automatically:
- Displays available themes in a dropdown
- Switches themes dynamically
- Persists theme selection in localStorage
- Provides visual feedback during switching

### Custom Theme Service

You can provide a custom theme service implementation:

```csharp
// In Program.cs
services.AddBbQChatWidgetsBlazor(sp => new CustomThemeService());
```

## JavaScript Interop

The library includes a `theme-switcher.js` module for dynamic CSS switching:

```javascript
import { switchTheme, initializeTheme } from '_content/BbQ.ChatWidgets.Blazor/js/theme-switcher.js';

// Switch to a theme
switchTheme('dark');

// Initialize with saved preference or default
initializeTheme();
```

## Features

- **Embedded Themes**: All three themes are included in the library package
- **Responsive Design**: Themes adapt to mobile and desktop viewports
- **Accessibility**: Includes reduced-motion preferences and proper contrast ratios
- **Dark Mode Support**: Native CSS media query support for system preferences
- **Persistent Selection**: Theme preference is saved to localStorage
- **Dynamic Switching**: Themes can be switched without page reload
- **Consistent Styling**: All widgets use consistent design language per theme

## Customization

### Adding a Custom Theme

Create your own CSS file and register it with the theme service:

1. Create a custom theme CSS file following the same selectors as existing themes
2. Place it in your app's `wwwroot/themes/` folder
3. Reference it in your `App.razor`

### Overriding Theme Styles

Add custom CSS after the theme link to override styles:

```css
/* In your app.css */
.bbq-button {
    border-radius: 8px; /* Override rounded corners */
    /* ... other customizations ... */
}
```

## Theme Files Location

In the NuGet package, themes are located at:
```
_content/BbQ.ChatWidgets.Blazor/themes/
  ├── bbq-chat-light.css
  ├── bbq-chat-dark.css
  └── bbq-chat-corporate.css
```

## CSS Variables

All themes use consistent CSS class names for easy targeting:

### Common Classes
- `.bbq-widget` - Base widget container
- `.bbq-button` - Button styling
- `.bbq-input` - Text input styling
- `.bbq-form` - Form container
- `.bbq-card` - Card widget styling
- `.bbq-dropdown` - Select/dropdown styling
- `.bbq-textarea` - Textarea styling
- `.bbq-toggle` - Checkbox/toggle styling
- `.bbq-slider` - Range input styling
- `.bbq-file` - File upload styling

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 12+, Chrome Android

## Accessibility

All themes include:
- WCAG 2.1 AA contrast ratios
- Focus indicators for keyboard navigation
- Reduced motion preferences support
- Semantic HTML markup
- Screen reader friendly labels

## Examples

See the sample BlazorApp for complete examples of theme usage and the ThemeSwitcher component in action.
