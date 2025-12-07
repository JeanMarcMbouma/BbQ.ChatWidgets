# @bbq-chat/widgets - Quick Reference Card

## 📦 Installation

```bash
npm install @bbq-chat/widgets
```

## 🚀 Quick Start

### Vanilla JS
```javascript
import { ButtonWidget, SsrWidgetRenderer, WidgetEventManager } from '@bbq-chat/widgets';

const widget = new ButtonWidget('Click', 'action');
const html = new SsrWidgetRenderer().renderWidget(widget);
document.getElementById('app').innerHTML = html;
new WidgetEventManager().attachHandlers(document.getElementById('app'));
```

### React
```jsx
import { useEffect, useRef } from 'react';
import { ButtonWidget, SsrWidgetRenderer, WidgetEventManager } from '@bbq-chat/widgets';

export function Widgets() {
  const ref = useRef();
  useEffect(() => {
    const widget = new ButtonWidget('Click', 'action');
    ref.current.innerHTML = new SsrWidgetRenderer().renderWidget(widget);
    new WidgetEventManager().attachHandlers(ref.current);
  }, []);
  return <div ref={ref} />;
}
```

## 🎨 Available Widgets

### 1. Button
```typescript
new ButtonWidget(label, action)
// Example: new ButtonWidget('Submit', 'submit_form')
```

### 2. Card
```typescript
new CardWidget(label, action, title, description?, imageUrl?)
// Example: new CardWidget('View', 'view', 'Title', 'Desc', 'url')
```

### 3. Input
```typescript
new InputWidget(label, action, placeholder?, maxLength?)
// Example: new InputWidget('Name', 'input_name', 'Enter name', 50)
```

### 4. Dropdown
```typescript
new DropdownWidget(label, action, options)
// Example: new DropdownWidget('Size', 'size', ['S', 'M', 'L'])
```

### 5. Slider
```typescript
new SliderWidget(label, action, min, max, step, default?)
// Example: new SliderWidget('Volume', 'vol', 0, 100, 5, 50)
```

### 6. Toggle
```typescript
new ToggleWidget(label, action, defaultValue?)
// Example: new ToggleWidget('Notify', 'notify', true)
```

### 7. File Upload
```typescript
new FileUploadWidget(label, action, accept?, maxBytes?)
// Example: new FileUploadWidget('Doc', 'upload', '.pdf,.docx', 5000000)
```

### 8. Date Picker
```typescript
new DatePickerWidget(label, action, minDate?, maxDate?)
// Example: new DatePickerWidget('Date', 'date', '2024-01-01', '2024-12-31')
```

### 9. Multi-Select
```typescript
new MultiSelectWidget(label, action, options)
// Example: new MultiSelectWidget('Items', 'items', ['A', 'B', 'C'])
```

### 10. Progress Bar
```typescript
new ProgressBarWidget(label, action, value, max)
// Example: new ProgressBarWidget('Upload', 'upload', 75, 100)
```

### 11. Theme Switcher
```typescript
new ThemeSwitcherWidget(label, action, themes)
// Example: new ThemeSwitcherWidget('Theme', 'theme', ['light', 'dark'])
```

## 📋 Core Classes

### ChatWidget (Base Class)
```typescript
// Serialization
widget.toJson(): string
widget.toObject(): Record<string, any>

// Static methods
ChatWidget.fromJson(json): ChatWidget | null
ChatWidget.fromObject(obj): ChatWidget | null
ChatWidget.listFromJson(json): ChatWidget[] | null
```

### SsrWidgetRenderer
```typescript
renderer.renderWidget(widget): string
renderer.framework: string // "SSR"
```

### WidgetEventManager
```typescript
eventManager.attachHandlers(container): void
```

### DefaultWidgetActionHandler
```typescript
handler.handle(action, payload): Promise<void>

// Custom implementation
class MyHandler extends DefaultWidgetActionHandler {
  async handle(action, payload) {
    console.log(action, payload);
    await super.handle(action, payload);
  }
}
```

## 🎯 Common Patterns

### Create Multiple Widgets
```typescript
const widgets = [
  new ButtonWidget('A', 'action1'),
  new InputWidget('B', 'action2'),
  new DropdownWidget('C', 'action3', ['X', 'Y'])
];

const html = widgets
  .map(w => renderer.renderWidget(w))
  .join('');
```

### Custom Action Handler
```typescript
class MyHandler extends DefaultWidgetActionHandler {
  constructor() {
    super('/api/custom-action');
  }
  
  async handle(action: string, payload: any) {
    // Custom logic
    console.log(`${action}:`, payload);
    await super.handle(action, payload);
  }
}

new WidgetEventManager(new MyHandler()).attachHandlers(container);
```

### JSON Serialization
```typescript
// To JSON
const json = widget.toJson();

// From JSON
const restored = ChatWidget.fromJson(json);

// List from JSON
const widgets = ChatWidget.listFromJson(jsonArray);
```

## 🎨 CSS Classes

```css
/* All widgets */
.bbq-widget { }

/* Specific widgets */
.bbq-button { }
.bbq-card { }
.bbq-input { }
.bbq-dropdown { }
.bbq-slider { }
.bbq-toggle { }
.bbq-file-upload { }
.bbq-datepicker { }
.bbq-multi-select { }
.bbq-progress-bar { }
.bbq-theme-switcher { }

/* Widget elements */
.bbq-input-label { }
.bbq-input-field { }
.bbq-dropdown-select { }
.bbq-card-title { }
.bbq-card-description { }
.bbq-card-image { }
```

## 🔧 Development Commands

```bash
cd js

# Install
npm install

# Build
npm run build                # One-time build
npm run build:watch        # Watch mode

# Test
npm test                   # Run all
npm test -- --watch       # Watch
npm run test:coverage     # Coverage

# Code Quality
npm run lint              # Check
npm run lint:fix          # Fix
npm run format            # Format
npm run type-check        # Types

# Publish
npm version patch         # Bump version
npm publish              # Publish to npm
```

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| README.md | Package overview |
| API.md | Complete API reference |
| DEVELOPMENT.md | Development guide |
| INTEGRATION.md | Framework guides |
| GETTING_STARTED.md | Quick start |
| PACKAGE_SUMMARY.md | Package info |
| NPM_PACKAGE_CREATION.md | Creation summary |

## 🌐 Framework Integration

See **INTEGRATION.md** for:
- React (hooks & class components)
- Vue (Composition & Options API)
- Angular
- Svelte
- Next.js

## 💡 Tips

1. **Always use TypeScript** - Better IDE support
2. **Check API.md** - Complete reference
3. **Review INTEGRATION.md** - Framework examples
4. **Handle errors** - Check for null returns
5. **Test serialization** - JSON roundtrip

## 📦 Exports

### Main
```typescript
import * from '@bbq-chat/widgets'
```

### Submodules
```typescript
import * from '@bbq-chat/widgets/models'
import * from '@bbq-chat/widgets/renderers'
import * from '@bbq-chat/widgets/handlers'
```

## ❌ Common Mistakes

❌ Forgetting to call `attachHandlers()`
```typescript
// Bad - events won't work
const html = renderer.renderWidget(widget);
container.innerHTML = html;

// Good - events will work
const html = renderer.renderWidget(widget);
container.innerHTML = html;
new WidgetEventManager().attachHandlers(container);
```

❌ Not handling null returns
```typescript
// Bad - might crash
const widget = ChatWidget.fromJson(json);
console.log(widget.label);

// Good - safe
const widget = ChatWidget.fromJson(json);
if (widget) {
  console.log(widget.label);
}
```

❌ Ignoring TypeScript
```typescript
// Bad - no type safety
const widget = new ButtonWidget('a', 'b') as any;

// Good - full type safety
const widget = new ButtonWidget('a', 'b');
```

## 🚀 Next Steps

1. Read **README.md** - Overview
2. Check **API.md** - Full reference
3. See **INTEGRATION.md** - Your framework
4. Start coding!

## 📞 Support

- 🐛 Issues: https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/issues
- 💬 Discussions: https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/discussions
- 📖 Wiki: https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/wiki

---

**Quick Links:**
- [npm Package](https://www.npmjs.com/package/@bbq-chat/widgets)
- [GitHub Repo](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets)
- [Type Definitions](https://www.npmjs.com/package/@bbq-chat/widgets)
