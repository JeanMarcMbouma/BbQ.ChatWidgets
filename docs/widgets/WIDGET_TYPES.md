# Widget Types Overview - Complete Catalog

## All Widget Types (9 Total)

BbQ.ChatWidgets now includes **9 widget types** covering all common UI interactions:

### Interactive Input Widgets (5)

| Widget | Purpose | Output | Example |
|--------|---------|--------|---------|
| **ButtonWidget** | Simple click action | `<button>` | Submit, Cancel, Confirm |
| **InputWidget** | Text input | `<input type="text">` | Name, Email, Search |
| **DropdownWidget** | Selection from list | `<select>` | Choose option |
| **FileUploadWidget** | File selection | `<input type="file">` | Upload document |
| **DatePickerWidget** | Date selection | `<input type="date">` | Appointment, Deadline |

### Selection Widgets (3)

| Widget | Purpose | Output | Example |
|--------|---------|--------|---------|
| **ToggleWidget** | Boolean on/off | `<input type="checkbox">` | Enable/disable |
| **SliderWidget** | Numeric range | `<input type="range">` | Volume, Rating, Price |
| **MultiSelectWidget** | Multiple selection | `<select multiple>` | Categories, Items |

### Specialized Selection Widgets (1)

| Widget | Purpose | Output | Example |
|--------|---------|--------|---------|
| **ThemeSwitcherWidget** | Theme selection | `<select>` | Light/Dark mode |

### Content Display Widgets (2)

| Widget | Purpose | Output | Example |
|--------|---------|--------|---------|
| **CardWidget** | Rich content | `<div>` with content | Product card, Result card |
| **ProgressBarWidget** | Progress indication | `<progress>` | Upload, Task completion |

---

## Complete Widget Hierarchy

```
ChatWidget (abstract)
├── ButtonWidget
├── CardWidget
├── InputWidget
├── DropdownWidget
├── SliderWidget
├── ToggleWidget
├── FileUploadWidget
├── ThemeSwitcherWidget
├── DatePickerWidget
├── MultiSelectWidget
└── ProgressBarWidget
```

---

## Quick Selection Guide

### For Data Input
- **InputWidget** → Text entry (name, email, search)
- **DatePickerWidget** → Date selection
- **SliderWidget** → Numeric range selection
- **FileUploadWidget** → File upload

### For Selection
- **DropdownWidget** → Single choice from predefined list
- **MultiSelectWidget** → Multiple choices from list
- **ToggleWidget** → Yes/No or on/off
- **ThemeSwitcherWidget** → Theme/preference choice

### For Actions
- **ButtonWidget** → Trigger action
- **CardWidget** → Featured content with action

### For Status/Progress
- **ProgressBarWidget** → Show task progress

---

## Property Comparison

| Widget | Properties | Required | Optional |
|--------|-----------|----------|----------|
| Button | Label, Action | 2 | 0 |
| Card | Label, Action, Title | 3 | Description, ImageUrl |
| Input | Label, Action | 2 | Placeholder, MaxLength |
| Dropdown | Label, Action, Options | 3 | 0 |
| Slider | Label, Action, Min, Max, Step | 5 | Default |
| Toggle | Label, Action, DefaultValue | 3 | 0 |
| FileUpload | Label, Action | 2 | Accept, MaxBytes |
| ThemeSwitcher | Label, Action, Themes | 3 | 0 |
| DatePicker | Label, Action | 2 | MinDate, MaxDate |
| MultiSelect | Label, Action, Options | 3 | 0 |
| ProgressBar | Label, Action, Value, Max | 4 | 0 |

---

## HTML Element Mapping

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

### ThemeSwitcherWidget
```html
<div class="bbq-widget bbq-theme-switcher">
  <label class="bbq-theme-switcher-label">Label</label>
  <select class="bbq-theme-switcher-select">
    <option>light</option>
    <option>dark</option>
  </select>
</div>
```

### DatePickerWidget
```html
<div class="bbq-widget bbq-date-picker">
  <label class="bbq-date-picker-label">Label</label>
  <input type="date" class="bbq-date-picker-input">
</div>
```

### MultiSelectWidget
```html
<div class="bbq-widget bbq-multi-select">
  <label class="bbq-multi-select-label">Label</label>
  <select class="bbq-multi-select-input" multiple>
    <option>Option 1</option>
    <option>Option 2</option>
  </select>
</div>
```

### ProgressBarWidget
```html
<div class="bbq-widget bbq-progress-bar">
  <label class="bbq-progress-bar-label">Label</label>
  <progress class="bbq-progress-bar-input" value="50" max="100"></progress>
</div>
```

---

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
| 8 | ThemeSwitcher | Selection | select | Theme choice |
| 9 | DatePicker | Input | date | Date selection |
| 10 | MultiSelect | Selection | select | Multiple choices |
| 11 | ProgressBar | Display | progress | Progress indication |

---

**Need help choosing?** See the "Quick Selection Guide" section above.

**Want to add a widget?** Follow the "Creating New Widgets" pattern.

**Full documentation:** [docs/widgets/](../widgets/)
