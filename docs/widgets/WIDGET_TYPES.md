# Widget Types Overview - Updated with ThemeSwitcherWidget

## All Widget Types (9 Total)

BbQ.ChatWidgets now includes **9 widget types** covering most common UI needs:

### Interactive Input Widgets (4)

| Widget | Purpose | Output | Example |
|--------|---------|--------|---------|
| **ButtonWidget** | Simple click action | `<button>` | Submit, Cancel, Confirm |
| **InputWidget** | Text input | `<input type="text">` | Name, Email, Search |
| **DropdownWidget** | Selection from list | `<select>` | Choose option |
| **FileUploadWidget** | File selection | `<input type="file">` | Upload document |

### Selection Widgets (2)

| Widget | Purpose | Output | Example |
|--------|---------|--------|---------|
| **ToggleWidget** | Boolean on/off | `<input type="checkbox">` | Enable/disable feature |
| **SliderWidget** | Numeric range | `<input type="range">` | Volume, Rating, Price |

### Content Display Widgets (1)

| Widget | Purpose | Output | Example |
|--------|---------|--------|---------|
| **CardWidget** | Rich content | `<div>` with content | Product card, Result card |

### Specialized Selection Widgets (2)

| Widget | Purpose | Output | Example |
|--------|---------|--------|---------|
| **DropdownWidget** | Categorical choice | `<select>` | Size, Color, Category |
| **ThemeSwitcherWidget** | Theme/preference choice | `<select>` with themes | Light/Dark mode, Color scheme |

## Widget Comparison Matrix

```
┌─────────────────────────────────────────────────────────────────────┐
│ WIDGET TYPE         │ INPUT │ OUTPUT │ INTERACTIVE │ CUSTOMIZABLE   │
├─────────────────────────────────────────────────────────────────────┤
│ Button              │  ✗    │  ✗     │  ✓✓         │  ✗             │
│ Card                │  ✗    │  ✓✓    │  ✓          │  ✓             │
│ Input               │  ✓✓   │  ✗     │  ✓✓         │  ✓             │
│ Dropdown            │  ✓    │  ✗     │  ✓          │  ✓✓            │
│ Slider              │  ✓✓   │  ✓     │  ✓✓         │  ✓             │
│ Toggle              │  ✓    │  ✗     │  ✓          │  ✗             │
│ FileUpload          │  ✓✓   │  ✗     │  ✓✓         │  ✓             │
│ ThemeSwitcher       │  ✓    │  ✗     │  ✓          │  ✓✓            │
└─────────────────────────────────────────────────────────────────────┘
```

## New: ThemeSwitcherWidget

### Overview
ThemeSwitcherWidget is a specialized dropdown for selecting from theme options. It's optimized for:
- Light/dark mode selection
- Color scheme customization
- Visual preference settings
- Application theming

### vs DropdownWidget
While both render as `<select>` elements, `ThemeSwitcherWidget` is semantically specialized:

| Aspect | DropdownWidget | ThemeSwitcherWidget |
|--------|---|---|
| **Purpose** | Generic selection | Theme/preference selection |
| **CSS Classes** | `bbq-dropdown` | `bbq-theme-switcher` |
| **Property Name** | `Options` | `Themes` |
| **Semantics** | Neutral | Theme-specific |
| **UI Pattern** | Any selection | Theme switching |
| **Best For** | Size, Color, Category | Light/Dark, Visual prefs |

### Quick Comparison

```csharp
// Generic dropdown for any selection
var dropdown = new DropdownWidget(
    "Size",
    "select_size",
    ["Small", "Medium", "Large"]
);

// Specialized for theme selection
var themeSwitcher = new ThemeSwitcherWidget(
    "Theme",
    "set_theme",
    ["light", "dark", "auto"]
);
```

## When to Use Each Widget

### ButtonWidget
- Click-based actions
- Confirmations
- Single-step commands

```csharp
new ButtonWidget("Submit", "submit_form")
```

### InputWidget
- Text input
- Short responses
- Searchable content

```csharp
new InputWidget("Search", "search", Placeholder: "Enter search term")
```

### DropdownWidget
- Multiple categorical choices
- Sizes, colors, categories
- Status values

```csharp
new DropdownWidget("Status", "set_status", ["Open", "Closed", "Pending"])
```

### SliderWidget
- Numeric ranges
- Continuous values
- Visual feedback on range

```csharp
new SliderWidget("Price", "filter_price", Min: 0, Max: 1000, Step: 10)
```

### ToggleWidget
- Yes/No questions
- Enable/Disable features
- Boolean preferences

```csharp
new ToggleWidget("Notifications", "toggle_notifications", DefaultValue: true)
```

### FileUploadWidget
- Document upload
- File selection
- Attachment handling

```csharp
new FileUploadWidget("Upload", "upload_file", Accept: ".pdf,.docx")
```

### CardWidget
- Featured content
- Product display
- Rich information

```csharp
new CardWidget(
    Label: "View",
    Action: "view_product",
    Title: "Product Name",
    Description: "Details",
    ImageUrl: "https://..."
)
```

### ThemeSwitcherWidget ⭐ NEW
- Light/Dark mode
- Color scheme selection
- Visual customization

```csharp
new ThemeSwitcherWidget("Theme", "set_theme", ["light", "dark", "auto"])
```

## Widget Hierarchy

```
ChatWidget (abstract)
├── ButtonWidget
├── CardWidget
├── InputWidget
├── DropdownWidget
├── SliderWidget
├── ToggleWidget
├── FileUploadWidget
└── ThemeSwitcherWidget ⭐ NEW
```

## HTML Output Reference

### ButtonWidget
```html
<button class="bbq-widget bbq-button" data-action="action">Label</button>
```

### InputWidget
```html
<div class="bbq-widget bbq-input">
  <label class="bbq-input-label">Label</label>
  <input type="text" class="bbq-input-field">
</div>
```

### DropdownWidget
```html
<div class="bbq-widget bbq-dropdown">
  <label class="bbq-dropdown-label">Label</label>
  <select class="bbq-dropdown-select">
    <option>Option</option>
  </select>
</div>
```

### SliderWidget
```html
<div class="bbq-widget bbq-slider">
  <label class="bbq-slider-label">Label</label>
  <input type="range" class="bbq-slider-input">
  <span class="bbq-slider-value">50</span>
</div>
```

### ToggleWidget
```html
<div class="bbq-widget bbq-toggle">
  <label class="bbq-toggle-label">
    <input type="checkbox" class="bbq-toggle-input">
    <span class="bbq-toggle-text">Label</span>
  </label>
</div>
```

### FileUploadWidget
```html
<div class="bbq-widget bbq-file-upload">
  <label class="bbq-file-label">Label</label>
  <input type="file" class="bbq-file-input">
</div>
```

### CardWidget
```html
<div class="bbq-widget bbq-card">
  <h3 class="bbq-card-title">Title</h3>
  <p class="bbq-card-description">Description</p>
  <img class="bbq-card-image" src="...">
  <button class="bbq-card-action">Label</button>
</div>
```

### ThemeSwitcherWidget ⭐
```html
<div class="bbq-widget bbq-theme-switcher">
  <label class="bbq-theme-switcher-label">Label</label>
  <select class="bbq-theme-switcher-select">
    <option>light</option>
    <option>dark</option>
  </select>
</div>
```

## Rendering Path

All widgets follow the same rendering pipeline:

```
ChatWidget (JSON)
    ↓
ChatWidget.FromJson() [Deserialization]
    ↓
ChatWidget instance (Button, Card, ThemeSwitcher, etc.)
    ↓
IChatWidgetRenderer.RenderWidget()
    ↓
HTML string (SSR-ready, safe, escaped)
    ↓
Client Framework (Angular/React) [Hydration]
    ↓
Interactive UI
```

## Creating New Widgets

When adding new widget types, follow this pattern:

```csharp
// 1. Add record class
public sealed record MyWidget(
    string Label,
    string Action,
    string? CustomProperty = null)
    : ChatWidget(Label, Action);

// 2. Register JSON type
[JsonDerivedType(typeof(MyWidget), typeDiscriminator: "mywidget")]

// 3. Add renderer method
private static string RenderMyWidget(MyWidget widget) { }

// 4. Add switch case
MyWidget my => RenderMyWidget(my),

// 5. Add tests
[Fact]
public void RenderWidget_WithMyWidget_GeneratesHtml() { }
```

## CSS Styling Strategy

All widgets use a consistent CSS naming pattern:

```css
.bbq-widget                /* Base class - all widgets */
.bbq-{type}                /* Type-specific - bbq-button, bbq-card */
.bbq-{type}-{element}      /* Element-specific - bbq-button-label */
```

This allows styling at multiple levels:

```css
/* Style all widgets */
.bbq-widget { font-family: sans-serif; }

/* Style all buttons */
.bbq-button { background: blue; }

/* Style specific widget */
.bbq-theme-switcher { margin: 10px; }

/* Style widget element */
.bbq-theme-switcher-select { width: 200px; }
```

## Migration Guide

### Adding ThemeSwitcherWidget to Existing Project

1. **Update Package** — Already included in latest BbQ.ChatWidgets

2. **Use in Code**
   ```csharp
   var widget = new ThemeSwitcherWidget("Theme", "set_theme", ["light", "dark"]);
   ```

3. **Handle Action**
   ```csharp
   [Action("set_theme")]
   public class SetThemeHandler : IWidgetActionHandler<ThemeSelection> { }
   ```

4. **Style**
   ```css
   .bbq-theme-switcher-select { /* your styles */ }
   ```

5. **Test** — See `SsrWidgetRendererTests.cs`

## Summary Table

| # | Widget | Type | Element | Use Case |
|---|--------|------|---------|----------|
| 1 | Button | Action | button | Click actions |
| 2 | Card | Display | div | Rich content |
| 3 | Input | Input | text | Text entry |
| 4 | Dropdown | Selection | select | Category choice |
| 5 | Slider | Input | range | Numeric range |
| 6 | Toggle | Input | checkbox | Boolean |
| 7 | FileUpload | Input | file | File selection |
| 8 | ThemeSwitcher | Selection | select | Theme choice ⭐ |

---

**Need help choosing?** See the "When to Use Each Widget" section above.

**Want to add a widget?** Follow the "Creating New Widgets" pattern.

**Full documentation:** [docs/widgets/](../widgets/)
