# BbQ.ChatWidgets CSS Themes - NuGet Integration Guide

## Installation

The CSS themes are automatically included when you install the BbQ.ChatWidgets NuGet package.

### Via NuGet Package Manager

```bash
Install-Package BbQ.ChatWidgets
```

### Via .NET CLI

```bash
dotnet add package BbQ.ChatWidgets
```

### Via Package Manager UI

1. Open Package Manager in Visual Studio
2. Search for "BbQ.ChatWidgets"
3. Click Install

---

## Quick Setup

After installing the NuGet package, the CSS themes are available in:
```
obj\Debug\net8.0\themes\
```

Or after publishing/building:
```
bin\Release\net8.0\themes\
```

### Step 1: Copy Theme Files to Web Project

The easiest way is to copy the theme files to your web project's static files directory:

```
MyProject/
??? wwwroot/
?   ??? themes/
?       ??? bbq-chat-light.css
?       ??? bbq-chat-dark.css
?       ??? bbq-chat-corporate.css
?       ??? README.md
```

### Step 2: Link Theme in HTML

```html
<!DOCTYPE html>
<html>
<head>
    <!-- Include your preferred theme -->
    <link rel="stylesheet" href="/themes/bbq-chat-light.css">
</head>
<body>
    <!-- Your chat widget container -->
    <div id="chat-container"></div>
</body>
</html>
```

### Step 3: Register BbQ.ChatWidgets Services

In your `Program.cs`:

```csharp
using BbQ.ChatWidgets.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Add BbQ ChatWidgets services
builder.Services.AddBbQChatWidgets(options => {
    options.RoutePrefix = "/api/chat";
    options.ChatClientFactory = sp => new YourChatClient();
});

var app = builder.Build();

// Map BbQ ChatWidgets endpoints
app.MapBbQChatEndpoints();

app.Run();
```

### Step 4: Use in JavaScript

```javascript
// Send a message
const response = await fetch('/api/chat/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        message: 'Hello!',
        threadId: null
    })
});

const data = await response.json();
console.log(data.content);      // Clean text content
console.log(data.widgets);      // Array of widgets
```

---

## Accessing Theme Files Programmatically

### Option 1: From Package Installation Directory

```csharp
// Get the themes directory from the package
string packagesPath = Environment.GetFolderPath(
    Environment.SpecialFolder.UserProfile);
string themesPath = Path.Combine(
    packagesPath,
    ".nuget\\packages\\bbq.chatwidgets\\{version}\\contentFiles\\any\\any\\themes"
);

// Copy to wwwroot
if (Directory.Exists(themesPath))
{
    foreach (var file in Directory.GetFiles(themesPath, "*.css"))
    {
        var targetPath = Path.Combine("wwwroot/themes", 
            Path.GetFileName(file));
        File.Copy(file, targetPath, overwrite: true);
    }
}
```

### Option 2: Copy Manually During Build

Add this to your `.csproj`:

```xml
<Target Name="CopyThemesToWwwroot" AfterTargets="Build">
  <ItemGroup>
    <ThemeFiles Include="$(NuGetPackageRoot)bbq.chatwidgets\**\themes\*.css" />
  </ItemGroup>
  
  <Copy SourceFiles="@(ThemeFiles)"
        DestinationFiles="@(ThemeFiles->'wwwroot\themes\%(Filename)%(Extension)')"
        SkipUnchangedFiles="true" />
</Target>
```

### Option 3: Embedded CSS in C#

Serve CSS from C# instead of static files:

```csharp
app.MapGet("/themes/{themeName}.css", (string themeName) => {
    var validThemes = new[] { "light", "dark", "corporate" };
    if (!validThemes.Contains(themeName))
        return Results.NotFound();
    
    var cssContent = GetThemeCss(themeName);
    return Results.Text(cssContent, "text/css");
});

string GetThemeCss(string themeName) {
    return themeName switch {
        "light" => Resources.BbqChatLight,
        "dark" => Resources.BbqChatDark,
        "corporate" => Resources.BbqChatCorporate,
        _ => ""
    };
}
```

---

## Theme Files Included in NuGet Package

The following files are included in the NuGet package:

```
BbQ.ChatWidgets/
??? themes/
?   ??? bbq-chat-light.css      (8 KB)
?   ??? bbq-chat-dark.css       (8.5 KB)
?   ??? bbq-chat-corporate.css  (9 KB)
?   ??? README.md               (Theme documentation)
??? documentation/
    ??? README_WIDGETS.md
    ??? AI_PROMPT_GUIDE.md
    ??? IMPLEMENTATION_SUMMARY.md
```

---

## Package Contents

### CSS Themes
- **bbq-chat-light.css** - Light professional theme
- **bbq-chat-dark.css** - Dark modern theme
- **bbq-chat-corporate.css** - Corporate professional theme

### Documentation
- **README_WIDGETS.md** - Complete widget documentation
- **AI_PROMPT_GUIDE.md** - AI model integration guide
- **IMPLEMENTATION_SUMMARY.md** - Implementation details
- **themes/README.md** - CSS theme guide

---

## Theme Selection Guide

### Use Light Theme When:
- Building modern web applications
- SaaS platforms with light UI
- Default bright interface expected
- Supporting light mode preference

### Use Dark Theme When:
- Building dark mode applications
- Gaming or entertainment platforms
- Night-optimized dashboards
- Supporting dark mode preference

### Use Corporate Theme When:
- Building enterprise applications
- Corporate dashboards
- Professional business software
- Print-friendly interfaces

---

## Integrating with Your Design System

### Override Theme Colors

Create your own CSS file that imports and overrides a theme:

```css
/* custom-theme.css */
@import url('/themes/bbq-chat-light.css');

/* Override colors for your brand */
:root {
    --your-brand-primary: #your-color;
}

.bbq-button {
    background-color: var(--your-brand-primary);
}

.bbq-button:hover {
    background-color: color-mix(in srgb, var(--your-brand-primary) 80%, black);
}
```

### Extend with Tailwind CSS

```html
<!-- Use Tailwind with BbQ ChatWidgets -->
<link rel="stylesheet" href="/themes/bbq-chat-light.css">
<script src="https://cdn.tailwindcss.com"></script>

<style>
  /* Tailwind overrides BbQ styles -->
  @layer components {
    .bbq-button {
      @apply rounded-lg transition-all duration-300;
    }
  }
</style>
```

### Use with Bootstrap

```html
<!-- Bootstrap + BbQ ChatWidgets -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="/themes/bbq-chat-light.css">

<style>
  /* Override BbQ styles with Bootstrap classes -->
  .bbq-button {
    @extend .btn, .btn-primary;
  }
</style>
```

---

## Troubleshooting

### Themes Not Found After Installation

1. **Rebuild the project**
   ```bash
   dotnet clean
   dotnet build
   ```

2. **Check NuGet Cache**
   ```bash
   dotnet nuget locals all --clear
   dotnet build
   ```

3. **Manually Copy Files**
   - Find the NuGet package in your local packages folder
   - Copy `themes/` directory to your `wwwroot/`

### Styles Not Applied

1. **Verify file path** - Check HTML href matches actual file location
2. **Clear cache** - Clear browser cache and hard refresh (Ctrl+Shift+R)
3. **Check console** - Look for 404 errors in browser developer tools
4. **Verify CSS loads** - Use browser inspector to check CSS is applied

### CSS Specificity Issues

If your styles override BbQ styles unintentionally:

```css
/* Increase specificity if needed */
html .bbq-button {
    background-color: your-color;
}

/* Or use !important as last resort */
.bbq-button {
    background-color: your-color !important;
}
```

---

## NuGet Package Structure

```
BbQ.ChatWidgets.{version}.nupkg
??? lib/
?   ??? net8.0/
?       ??? BbQ.ChatWidgets.dll
?       ??? BbQ.ChatWidgets.xml
??? contentFiles/
?   ??? any/any/
?       ??? themes/
?           ??? bbq-chat-light.css
?           ??? bbq-chat-dark.css
?           ??? bbq-chat-corporate.css
?           ??? README.md
??? documentation/
?   ??? README_WIDGETS.md
?   ??? AI_PROMPT_GUIDE.md
?   ??? IMPLEMENTATION_SUMMARY.md
??? package.nuspec
??? [Content_Types].xml
```

---

## Best Practices

### 1. Always Use Consistent Theme
```javascript
// Good - Same theme throughout session
const theme = 'light';
document.querySelector('link[href*="bbq-chat"]').href = 
    `/themes/bbq-chat-${theme}.css`;
```

### 2. Respect User Preferences
```javascript
// Respect system dark mode preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const theme = prefersDark ? 'dark' : 'light';
document.querySelector('link[href*="bbq-chat"]').href = 
    `/themes/bbq-chat-${theme}.css`;
```

### 3. Load Themes Efficiently
```html
<!-- Preload theme -->
<link rel="preload" href="/themes/bbq-chat-light.css" as="style">
<link rel="stylesheet" href="/themes/bbq-chat-light.css">
```

### 4. Cache Busting
```html
<!-- Add version parameter for cache busting -->
<link rel="stylesheet" href="/themes/bbq-chat-light.css?v=1.0.0">
```

---

## Distribution

The NuGet package includes everything needed:

? **Included in Package:**
- CSS theme files
- Documentation
- Code library
- XML documentation comments

? **Ready to Use:**
- Copy files to wwwroot
- Link in HTML
- Configure services
- Use immediately

? **No Additional Dependencies:**
- Pure CSS (no build tools required)
- Works with any .NET web framework
- Compatible with any frontend framework

---

## Support

For issues or questions:

1. **Check Documentation**
   - themes/README.md
   - README_WIDGETS.md
   - IMPLEMENTATION_SUMMARY.md

2. **Common Issues**
   - See Troubleshooting section above
   - Check browser console for errors
   - Verify file paths are correct

3. **Report Issues**
   - GitHub Issues
   - Include theme being used
   - Include browser and .NET version

---

## Version Compatibility

| BbQ.ChatWidgets | .NET Version | Theme Version |
|-----------------|--------------|---------------|
| 1.0.0+ | .NET 8 | 1.0 |

---

**Status**: ? Ready for NuGet Distribution

The CSS themes are fully packaged and ready to be distributed via NuGet!
