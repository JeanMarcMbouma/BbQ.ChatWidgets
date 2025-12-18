# Theme Integration in BbQ.ChatWidgets.Blazor Library

## Overview

The BbQ.ChatWidgets Blazor library now includes three professionally designed CSS themes embedded in the library package. These themes can be easily referenced and used in any Blazor application without needing external dependencies or files.

## What's Included

The embedded themes provide a complete design system for all BbQ Chat Widgets:

1. **Light Theme** (`bbq-chat-light.css`)
   - Clean, modern design with blue accents (#3b82f6)
   - Perfect for daytime viewing and professional environments
   - Default system color scheme

2. **Dark Theme** (`bbq-chat-dark.css`)
   - Modern dark design with purple-indigo gradient (#8b5cf6 → #6366f1)
   - Reduces eye strain in low-light environments
   - Includes automatic dark mode support

3. **Corporate Theme** (`bbq-chat-corporate.css`)
   - Professional enterprise styling with slate blues (#1f2937)
   - Suitable for formal business applications
   - Emphasizes professionalism and trust

## Getting Started

### Step 1: Basic Setup

In your Blazor app's `Program.cs`:

```csharp
// Register the Blazor library with theme service support
services.AddBbQChatWidgetsBlazor();
```

### Step 2: Add Theme Reference in App.razor

In your `Components/App.razor`, add the theme stylesheet:

```razor
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- ... other head elements ... -->
    
    <!-- Add the theme stylesheet -->
    <link rel="stylesheet" id="bbq-theme-link" href="_content/BbQ.ChatWidgets.Blazor/themes/bbq-chat-light.css" />
</head>
<body>
    <!-- ... app content ... -->
</body>
</html>
```

### Step 3: Optional - Add Theme Switcher

Add the `ThemeSwitcher` component to your layout for easy theme switching:

```razor
@* In Components/Layout/MainLayout.razor *@
<ThemeSwitcher />
```

That's it! Your Blazor app now has full theme support with three beautiful themes to choose from.

## Using the Theme Service

The `IThemeService` interface allows programmatic theme management:

```csharp
@inject IThemeService ThemeService

@code {
    protected override async Task OnInitializedAsync()
    {
        // Get available themes
        var themes = ThemeService.AvailableThemes; 
        // Returns: ["light", "dark", "corporate"]
        
        // Get the current theme
        var current = ThemeService.CurrentTheme;
        
        // Switch themes programmatically
        await ThemeService.SetThemeAsync("dark");
    }
}
```

## Features

### ✨ Out-of-the-Box Styling
All built-in widgets are styled:
- Buttons with hover/active states
- Forms with focus indicators
- Input fields with validation states
- Cards with shadows and transitions
- Dropdowns with smooth animations
- Sliders with gradient progress
- File uploads with drag-drop areas
- Toggles with modern styling

### 📱 Responsive Design
- Mobile-first approach
- Touch-friendly controls (20px minimum)
- Tablet optimization
- Desktop optimizations

### ♿ Accessibility
- WCAG 2.1 AA compliant contrast ratios
- Keyboard navigation support
- Focus indicators visible
- Reduced motion preferences supported
- Screen reader friendly

### 🌓 Dark Mode Support
- Automatic system dark mode detection
- CSS media queries for `prefers-color-scheme`
- Custom dark variations in each theme

### 💾 Persistent Selection
- Theme preference saved to localStorage
- Restored on page reload
- User selection takes priority

### ⚡ Dynamic Switching
- No page reload required
- Smooth theme transitions
- Automatic DOM class updates

## Architecture

### File Structure

```
BbQ.ChatWidgets.Blazor/
├── Services/
│   ├── IThemeService.cs          # Theme service interface
│   ├── ServiceCollectionExtensions.cs
│   └── DefaultThemeService.cs    # Default implementation
├── wwwroot/
│   ├── themes/
│   │   ├── bbq-chat-light.css
│   │   ├── bbq-chat-dark.css
│   │   └── bbq-chat-corporate.css
│   └── js/
│       └── theme-switcher.js     # JavaScript interop module
└── Components/
    └── ThemeSwitcher.razor       # Theme switcher component
```

### Service Registration

When you call `AddBbQChatWidgetsBlazor()`, it:
1. Registers `IThemeService` as a scoped service
2. Provides the default `DefaultThemeService` implementation
3. Makes the theme service available for dependency injection

### JavaScript Interop

The `theme-switcher.js` module handles:
- Dynamic CSS link updating
- Theme persistence via localStorage
- CSS class management on document root
- Safe error handling

## Customization

### Option 1: Override with Custom CSS

Add your custom CSS after the theme link:

```css
/* In your app.css */
.bbq-button {
    border-radius: 8px;  /* Override rounded corners */
    padding: 12px 24px;  /* Override padding */
}

.bbq-form {
    max-width: 600px;    /* Add constraints */
    margin: 0 auto;
}
```

### Option 2: Create a Custom Theme

Create a new CSS file and register it:

```css
/* In wwwroot/themes/custom-theme.css */
.bbq-widget {
    font-family: 'Your Font', sans-serif;
    color: #your-color;
}

/* ... style all widget classes ... */
```

Then reference it in `App.razor`:

```razor
<link rel="stylesheet" href="_content/BbQ.ChatWidgets.Blazor/themes/bbq-chat-light.css" />
<link rel="stylesheet" href="themes/custom-theme.css" />
```

### Option 3: Custom Theme Service

Implement your own theme logic:

```csharp
public class CustomThemeService : IThemeService
{
    public IReadOnlyList<string> AvailableThemes => 
        new[] { "brand-light", "brand-dark" };
    
    public string CurrentTheme { get; private set; } = "brand-light";
    
    public async Task SetThemeAsync(string themeName)
    {
        // Custom implementation
        CurrentTheme = themeName;
        // Notify UI of change, etc.
        await Task.CompletedTask;
    }
}

// Register in Program.cs
services.AddBbQChatWidgetsBlazor(sp => new CustomThemeService());
```

## CSS Class Reference

All widgets use consistent class names for targeting:

### Container & Structure
- `.bbq-widget` - Base widget container
- `.bbq-form` - Form container
- `.bbq-form-fieldset` - Form fieldset
- `.bbq-form-field` - Individual form field

### Form Controls
- `.bbq-input` - Text input
- `.bbq-textarea` - Text area
- `.bbq-button` - Button
- `.bbq-dropdown` - Select dropdown
- `.bbq-slider` - Range slider
- `.bbq-toggle` - Checkbox/toggle
- `.bbq-file` - File upload
- `.bbq-form-checkbox` - Checkbox in form
- `.bbq-form-radio` - Radio button

### Labels & Text
- `.bbq-input-label` - Input label
- `.bbq-form-field-label` - Form field label
- `.bbq-form-required` - Required indicator
- `.bbq-form-title` - Form title

### Cards & Content
- `.bbq-card` - Card widget
- `.bbq-unsupported` - Unsupported widget message

### Form Actions
- `.bbq-form-actions` - Form action buttons container
- `.bbq-form-button` - Generic form button
- `.bbq-form-submit` - Submit button
- `.bbq-form-cancel` - Cancel button

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome | Latest 2 versions |
| Firefox | Latest 2 versions |
| Safari | Latest 2 versions |
| Edge | Latest 2 versions |
| iOS Safari | 12+ |
| Chrome Android | Latest |

## Performance Considerations

- All themes are minifiable (~15KB each uncompressed)
- Themes are included in the NuGet package (no external CDN needed)
- CSS is statically linked (no runtime overhead)
- Theme switching uses efficient CSS link swapping
- localStorage for persistence is optional

## Troubleshooting

### Theme Not Loading
```html
<!-- Ensure the correct path in your App.razor -->
<link rel="stylesheet" href="_content/BbQ.ChatWidgets.Blazor/themes/bbq-chat-light.css" />
```

### Theme Switching Not Working
```csharp
// Ensure IThemeService is registered
services.AddBbQChatWidgetsBlazor();

// And ensure JS module is properly imported
@inject IJSRuntime JS
```

### Styles Not Applying
- Check browser DevTools to verify CSS is loaded
- Ensure theme link has correct `id="bbq-theme-link"`
- Check for CSS specificity conflicts with your custom CSS
- Verify no CSS caching issues (hard refresh: Ctrl+Shift+R)

## Examples

### Complete Example: Theme Switching Component

```razor
@page "/theme-demo"
@inject IThemeService ThemeService

<div class="demo-container">
    <h1>BbQ Chat Widgets Theme Demo</h1>
    
    <div class="theme-selection">
        <label>Select a theme:</label>
        <select @onchange="SwitchTheme">
            @foreach (var theme in ThemeService.AvailableThemes)
            {
                <option value="@theme">
                    @(char.ToUpper(theme[0]) + theme.Substring(1))
                </option>
            }
        </select>
    </div>
    
    <div class="widget-showcase">
        <!-- Showcase your widgets here -->
        <button class="bbq-button">Click Me</button>
        <input class="bbq-input" type="text" placeholder="Enter text..." />
        <div class="bbq-card">
            <h3>Widget Card</h3>
            <p>Styled with the current theme</p>
        </div>
    </div>
</div>

@code {
    private async Task SwitchTheme(ChangeEventArgs e)
    {
        var theme = e.Value?.ToString();
        if (!string.IsNullOrEmpty(theme))
        {
            await ThemeService.SetThemeAsync(theme);
        }
    }
}
```

## Next Steps

1. Add the library to your Blazor app
2. Reference a theme in your `App.razor`
3. Use widgets and see them automatically styled
4. Optionally add the `ThemeSwitcher` component for dynamic switching
5. Customize with your own CSS as needed

## Support

For issues or questions:
- Check the THEMES.md file in the library
- Review the sample BlazorApp implementation
- Refer to the copilot-instructions.md for architecture details

Happy theming! 🎨
