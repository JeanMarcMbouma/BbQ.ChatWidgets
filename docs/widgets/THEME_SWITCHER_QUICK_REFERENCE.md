This document has been consolidated into the new documentation structure.

Refer to `docs/guides/` and `docs/USAGE.md` for theming quick reference information.
# ThemeSwitcherWidget Quick Reference

## Creation

```csharp
var widget = new ThemeSwitcherWidget(
    Label: "Choose Theme",
    Action: "set_theme",
    Themes: ["light", "dark", "auto"]
);
```

## JSON

```json
{
  "type": "themeswitcher",
  "label": "Choose Theme",
  "action": "set_theme",
  "themes": ["light", "dark", "auto"]
}
```

## HTML Output

```html
<div class="bbq-widget bbq-theme-switcher" data-widget-id="bbq-set_theme" data-widget-type="themeswitcher">
  <label class="bbq-theme-switcher-label" for="bbq-set_theme-select">Choose Theme</label>
  <select id="bbq-set_theme-select" class="bbq-theme-switcher-select" data-action="set_theme">
    <option value="light">light</option>
    <option value="dark">dark</option>
    <option value="auto">auto</option>
  </select>
</div>
```

## Backend Rendering

```csharp
var renderer = new SsrWidgetRenderer();
var html = renderer.RenderWidget(widget);
```

## Event Handling

### JavaScript
```javascript
const select = document.querySelector('[data-widget-type="themeswitcher"] select');
select.addEventListener('change', (e) => {
  const theme = e.target.value;
  fetch('/api/chat/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'set_theme', payload: { theme } })
  });
});
```

## Styling

```css
.bbq-theme-switcher {
  margin: 10px 0;
}

.bbq-theme-switcher-select {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}
```

## Action Handler

```csharp
[Action("set_theme")]
public class SetThemeHandler : IWidgetActionHandler<SetThemePayload>
{
    public async Task<ChatTurn> HandleActionAsync(
        SetThemePayload payload,
        string threadId,
        IServiceProvider serviceProvider)
    {
        // Apply theme
        // Return response
        return new ChatTurn(ChatRole.Assistant, "Theme applied", [], threadId);
    }
}

public class SetThemePayload
{
    public string Theme { get; set; } = default!;
}
```

## CSS Classes

| Class | Purpose |
|-------|---------|
| `bbq-widget` | All widgets |
| `bbq-theme-switcher` | Container |
| `bbq-theme-switcher-label` | Label |
| `bbq-theme-switcher-select` | Select dropdown |

## Data Attributes

| Attribute | Example |
|-----------|---------|
| `data-widget-id` | `bbq-set_theme` |
| `data-widget-type` | `themeswitcher` |
| `data-action` | `set_theme` |

## Angular Integration

```typescript
this.widgetHtml = this.sanitizer.sanitize(1, widget.html);

setTimeout(() => {
  const select = document.querySelector('[data-widget-type="themeswitcher"] select');
  select?.addEventListener('change', (e) => {
    const theme = (e.target as HTMLSelectElement).value;
    this.api.handleAction('set_theme', { theme });
  });
}, 0);
```

## React Integration

```jsx
const html = DOMPurify.sanitize(widget.html);

useEffect(() => {
  const select = document.querySelector('[data-widget-type="themeswitcher"] select');
  select?.addEventListener('change', (e) => {
    fetch('/api/chat/action', {
      method: 'POST',
      body: JSON.stringify({
        action: widget.action,
        payload: { theme: e.target.value }
      })
    });
  });
}, []);

return <div dangerouslySetInnerHTML={{ __html: html }} />;
```

## Serialization

```csharp
// To JSON
var json = widget.ToJson();

// From JSON
var deserialized = ChatWidget.FromJson(json);

// List operations
var list = new[] { widget1, widget2 };
var json = list.ToJson();
var widgets = ChatWidget.ListFromJson(json);
```

## Testing

```csharp
[Fact]
public void TestThemeSwitcher()
{
    var widget = new ThemeSwitcherWidget("Theme", "set_theme", ["light", "dark"]);
    var renderer = new SsrWidgetRenderer();
    var html = renderer.RenderWidget(widget);
    
    Assert.Contains("bbq-theme-switcher", html);
    Assert.Contains("data-widget-type=\"themeswitcher\"", html);
}
```

## Properties

| Property | Type | Required |
|----------|------|----------|
| `Label` | `string` | ✓ |
| `Action` | `string` | ✓ |
| `Themes` | `IReadOnlyList<string>` | ✓ |

## Type Discriminator

`"themeswitcher"`

## See Also

- [Full Documentation](docs/widgets/THEME_SWITCHER_WIDGET.md)
- [SSR Guide](docs/guides/SERVER_SIDE_RENDERING.md)
- [All Widget Types](docs/widgets/WIDGET_TYPES.md)
