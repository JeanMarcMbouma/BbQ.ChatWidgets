# @bbq-chat/widgets

Framework-agnostic widget library for AI chat UIs. Build interactive chat applications with TypeScript and JavaScript.

[![npm version](https://img.shields.io/npm/v/@bbq-chat/widgets.svg)](https://www.npmjs.com/package/@bbq-chat/widgets)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

## Features

- **📦 Framework-Agnostic** - Works with vanilla JS, React, Vue, Angular, Svelte, etc.
- **🎨 11 Widget Types** - Button, Card, Input, Dropdown, Slider, Toggle, FileUpload, DatePicker, MultiSelect, ProgressBar, ThemeSwitcher
- **✅ TypeScript Support** - Full type safety with complete `.d.ts` definitions
- **🔒 XSS Protection** - Built-in HTML escaping and sanitization
- **📱 Responsive** - Mobile-first design approach
- **🎯 Event-Driven** - Simple action handling with automatic event binding
- **🔄 SSR Compatible** - Server-side rendering ready
- **🎭 Theme-Ready** - CSS-based theming system
- **📚 Well-Documented** - Comprehensive examples and API documentation
- **✨ Zero Dependencies** - Minimal footprint, no external dependencies

## Installation

### npm

```bash
npm install @bbq-chat/widgets
```

### yarn

```bash
yarn add @bbq-chat/widgets
```

### pnpm

```bash
pnpm add @bbq-chat/widgets
```

## Quick Start

### Vanilla JavaScript

```javascript
import { ButtonWidget, SsrWidgetRenderer, WidgetEventManager } from '@bbq-chat/widgets';

// Create a widget
const widget = new ButtonWidget('Click Me', 'submit_form');

// Render it to HTML
const renderer = new SsrWidgetRenderer();
const html = renderer.renderWidget(widget);

// Insert into DOM
document.getElementById('container').innerHTML = html;

// Attach event handlers
const eventManager = new WidgetEventManager();
eventManager.attachHandlers(document.getElementById('container'));
```

### React

```jsx
import { ButtonWidget, SsrWidgetRenderer, WidgetEventManager } from '@bbq-chat/widgets';
import { useEffect, useRef } from 'react';

function ChatWidget() {
  const containerRef = useRef(null);
  
  useEffect(() => {
    const widget = new ButtonWidget('Click Me', 'submit_form');
    const renderer = new SsrWidgetRenderer();
    const html = renderer.renderWidget(widget);
    
    if (containerRef.current) {
      containerRef.current.innerHTML = html;
      
      const eventManager = new WidgetEventManager();
      eventManager.attachHandlers(containerRef.current);
    }
  }, []);

  return <div ref={containerRef} />;
}

export default ChatWidget;
```

### Vue

```vue
<template>
  <div ref="container"></div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { ButtonWidget, SsrWidgetRenderer, WidgetEventManager } from '@bbq-chat/widgets';

const container = ref(null);

onMounted(() => {
  const widget = new ButtonWidget('Click Me', 'submit_form');
  const renderer = new SsrWidgetRenderer();
  const html = renderer.renderWidget(widget);
  
  container.value.innerHTML = html;
  
  const eventManager = new WidgetEventManager();
  eventManager.attachHandlers(container.value);
});
</script>
```

### Angular

```typescript
import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { ButtonWidget, SsrWidgetRenderer, WidgetEventManager } from '@bbq-chat/widgets';

@Component({
  selector: 'app-widget',
  template: '<div #container></div>',
})
export class WidgetComponent implements OnInit {
  @ViewChild('container') container!: ElementRef;

  ngOnInit() {
    const widget = new ButtonWidget('Click Me', 'submit_form');
    const renderer = new SsrWidgetRenderer();
    const html = renderer.renderWidget(widget);
    
    this.container.nativeElement.innerHTML = html;
    
    const eventManager = new WidgetEventManager();
    eventManager.attachHandlers(this.container.nativeElement);
  }
}
```

## Available Widgets

### 1. Button Widget

```typescript
const widget = new ButtonWidget('Click Me', 'submit');
```

### 2. Card Widget

```typescript
const widget = new CardWidget(
  'View Details',
  'view_product',
  'Product Name',
  'Product description',
  'https://example.com/image.jpg'
);
```

### 3. Input Widget

```typescript
const widget = new InputWidget(
  'Your Name',
  'input_name',
  'Enter your name',
  50 // maxLength
);
```

### 4. Dropdown Widget

```typescript
const widget = new DropdownWidget(
  'Select Size',
  'select_size',
  ['Small', 'Medium', 'Large']
);
```

### 5. Slider Widget

```typescript
const widget = new SliderWidget(
  'Volume',
  'set_volume',
  0,    // min
  100,  // max
  5,    // step
  50    // default
);
```

### 6. Toggle Widget

```typescript
const widget = new ToggleWidget(
  'Enable Notifications',
  'toggle_notifications',
  true  // defaultValue
);
```

### 7. File Upload Widget

```typescript
const widget = new FileUploadWidget(
  'Upload Document',
  'upload_file',
  '.pdf,.docx',  // accept
  5000000        // maxBytes
);
```

### 8. Date Picker Widget

```typescript
const widget = new DatePickerWidget(
  'Select Date',
  'pick_date',
  '2024-01-01',   // minDate
  '2024-12-31'    // maxDate
);
```

### 9. Multi-Select Widget

```typescript
const widget = new MultiSelectWidget(
  'Select Items',
  'select_items',
  ['Item1', 'Item2', 'Item3']
);
```

### 10. Progress Bar Widget

```typescript
const widget = new ProgressBarWidget(
  'Upload Progress',
  'upload_progress',
  65,   // value
  100   // max
);
```

### 11. Theme Switcher Widget

```typescript
const widget = new ThemeSwitcherWidget(
  'Choose Theme',
  'set_theme',
  ['light', 'dark', 'system']
);
```

## Serialization

### JSON Serialization

```typescript
// Serialize to JSON
const json = widget.toJson();

// Deserialize from JSON
const widget = ChatWidget.fromJson(json);

// Handle lists
const widgets = ChatWidget.listFromJson('[{...}, {...}]');
```

## Custom Event Handling

```typescript
import { DefaultWidgetActionHandler } from '@bbq-chat/widgets';

class CustomActionHandler extends DefaultWidgetActionHandler {
  async handle(action: string, payload: any) {
    console.log(`Action: ${action}`, payload);
    
    // Custom logic here
    
    // Call parent for default behavior
    super.handle(action, payload);
  }
}

const handler = new CustomActionHandler();
const eventManager = new WidgetEventManager(handler);
```

## Styling

All widgets use BEM-based CSS classes:

```css
/* All widgets */
.bbq-widget { ... }

/* Specific widget type */
.bbq-button { ... }
.bbq-input { ... }
.bbq-dropdown { ... }

/* Widget elements */
.bbq-button-label { ... }
.bbq-input-field { ... }
.bbq-dropdown-select { ... }
```

## TypeScript Support

Full TypeScript support with strict types:

```typescript
import type {
  ChatWidget,
  ButtonWidget,
  CardWidget,
  // ... other widget types
} from '@bbq-chat/widgets';

import {
  SsrWidgetRenderer,
  WidgetEventManager,
  WidgetRenderingService,
} from '@bbq-chat/widgets';
```

## API Reference

### ChatWidget

Base class for all widgets.

```typescript
// Serialization
toJson(): string
toObject(): Record<string, any>

// Static methods
static fromJson(json: string): ChatWidget | null
static fromObject(obj: any): ChatWidget | null
static listFromJson(json: string): ChatWidget[] | null

// Properties
readonly type: ChatWidgetType
readonly label: string
readonly action: string
```

### SsrWidgetRenderer

Renders widgets to HTML.

```typescript
renderWidget(widget: ChatWidget): string
readonly framework: string
```

### WidgetEventManager

Manages widget event listeners.

```typescript
attachHandlers(container: Element): void
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/blob/master/.github/CONTRIBUTING.md) for guidelines.

## License

MIT © BbQ ChatWidgets Contributors

## Support

- **Documentation**: [GitHub Wiki](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/wiki)
- **Issues**: [GitHub Issues](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/issues)
- **Discussions**: [GitHub Discussions](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/discussions)

## Related Projects

- [BbQ.ChatWidgets](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets) - .NET Backend
- [@bbq-chat/react](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets) - React Integration
- [@bbq-chat/vue](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets) - Vue Integration
- [@bbq-chat/angular](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets) - Angular Integration
