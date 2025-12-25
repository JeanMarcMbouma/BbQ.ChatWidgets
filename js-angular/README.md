# @bbq-chat/widgets-angular

Angular components and services for BbQ ChatWidgets. This package provides Angular-native wrappers for the core [@bbq-chat/widgets](https://www.npmjs.com/package/@bbq-chat/widgets) library.

## Installation

```bash
npm install @bbq-chat/widgets-angular @bbq-chat/widgets
```

## Peer Dependencies

This package requires:
- `@angular/common` >= 17.0.0
- `@angular/core` >= 17.0.0
- `@bbq-chat/widgets` ^1.0.0

## Quick Start

### 1. Import the component

```typescript
import { Component } from '@angular/core';
import { WidgetRendererComponent } from '@bbq-chat/widgets-angular';
import type { ChatWidget } from '@bbq-chat/widgets-angular';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [WidgetRendererComponent],
  template: `
    <bbq-widget-renderer 
      [widgets]="widgets" 
      (widgetAction)="handleWidgetAction($event)">
    </bbq-widget-renderer>
  `
})
export class ChatComponent {
  widgets: ChatWidget[] = [];

  handleWidgetAction(event: { actionName: string; payload: any }) {
    console.log('Widget action:', event.actionName, event.payload);
    // Handle the action (e.g., send to backend)
  }
}
```

### 2. Import styles

In your `styles.css` or `styles.scss`:

```css
@import '@bbq-chat/widgets/styles';
```

Or import a specific theme:

```css
@import '@bbq-chat/widgets/styles/light';
@import '@bbq-chat/widgets/styles/dark';
@import '@bbq-chat/widgets/styles/corporate';
```

## Components

### WidgetRendererComponent

The main component for rendering chat widgets.

**Inputs:**
- `widgets: ChatWidget[] | null | undefined` - Array of widgets to render

**Outputs:**
- `widgetAction: EventEmitter<{ actionName: string; payload: any }>` - Emits when a widget action is triggered

**Example:**

```typescript
<bbq-widget-renderer 
  [widgets]="messageWidgets" 
  (widgetAction)="onWidgetAction($event)">
</bbq-widget-renderer>
```

## Services

### WidgetRegistryService

Service for registering custom widget types.

**Example:**

```typescript
import { Component, OnInit } from '@angular/core';
import { WidgetRegistryService } from '@bbq-chat/widgets-angular';

export class MyCustomWidget {
  type = 'myCustomWidget';
  constructor(public label: string, public action: string) {}
}

@Component({
  selector: 'app-root',
  template: '...'
})
export class AppComponent implements OnInit {
  constructor(private widgetRegistry: WidgetRegistryService) {}

  ngOnInit() {
    // Register custom widget factory
    this.widgetRegistry.registerFactory('myCustomWidget', (obj) => {
      if (obj.type === 'myCustomWidget') {
        return new MyCustomWidget(obj.label, obj.action);
      }
      return null;
    });
  }
}
```

## Widget Types

All standard widget types from `@bbq-chat/widgets` are supported:

- `ButtonWidget` - Clickable buttons
- `CardWidget` - Information cards
- `FormWidget` - Form containers
- `InputWidget` - Text input fields
- `TextAreaWidget` - Multi-line text input
- `DropdownWidget` - Dropdown selects
- `SliderWidget` - Range sliders
- `ToggleWidget` - Toggle switches
- `FileUploadWidget` - File upload controls
- `DatePickerWidget` - Date pickers
- `MultiSelectWidget` - Multi-select dropdowns
- `ThemeSwitcherWidget` - Theme switcher controls
- `ProgressBarWidget` - Progress indicators
- `ImageWidget` - Image displays
- `ImageCollectionWidget` - Image galleries

## Advanced Usage

### Handling Widget Actions

Widget actions are emitted when users interact with widgets. Handle these actions in your component:

```typescript
async handleWidgetAction(event: { actionName: string; payload: any }) {
  const { actionName, payload } = event;

  try {
    const response = await fetch('/api/chat/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: actionName, payload })
    });

    const data = await response.json();
    // Update widgets with response
    this.widgets = data.widgets;
  } catch (error) {
    console.error('Failed to handle widget action:', error);
  }
}
```

### Custom Widget Renderers

For complex custom widgets, you may need to create custom renderers. See the [core package documentation](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets) for details.

## License

MIT

## Repository

https://github.com/JeanMarcMbouma/BbQ.ChatWidgets
