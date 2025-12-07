# API Reference

## Models

### ChatWidget

Base abstract class for all widgets.

#### Methods

```typescript
// Serialization
toJson(): string
toObject(): Record<string, any>

// Static methods
static fromJson(json: string): ChatWidget | null
static fromObject(obj: any): ChatWidget | null
static listFromJson(json: string): ChatWidget[] | null
```

#### Properties

```typescript
readonly type: ChatWidgetType
readonly label: string
readonly action: string
```

### ButtonWidget

Clickable button that triggers an action.

```typescript
class ButtonWidget extends ChatWidget {
  constructor(label: string, action: string)
}
```

**Example:**
```typescript
const widget = new ButtonWidget('Click Me', 'submit_form');
```

### CardWidget

Rich content card with optional image.

```typescript
class CardWidget extends ChatWidget {
  constructor(
    label: string,
    action: string,
    title: string,
    description?: string,
    imageUrl?: string
  )
}
```

**Properties:**
- `title: string` - Card title
- `description?: string` - Card description
- `imageUrl?: string` - Card image URL

### InputWidget

Text input field.

```typescript
class InputWidget extends ChatWidget {
  constructor(
    label: string,
    action: string,
    placeholder?: string,
    maxLength?: number
  )
}
```

**Properties:**
- `placeholder?: string` - Placeholder text
- `maxLength?: number` - Maximum character length

### DropdownWidget

Single-select dropdown.

```typescript
class DropdownWidget extends ChatWidget {
  constructor(
    label: string,
    action: string,
    options: string[]
  )
}
```

**Properties:**
- `options: string[]` - List of selectable options

### SliderWidget

Numeric range slider.

```typescript
class SliderWidget extends ChatWidget {
  constructor(
    label: string,
    action: string,
    min: number,
    max: number,
    step: number,
    default?: number
  )
}
```

**Properties:**
- `min: number` - Minimum value
- `max: number` - Maximum value
- `step: number` - Step increment
- `default?: number` - Default value

### ToggleWidget

Boolean on/off toggle.

```typescript
class ToggleWidget extends ChatWidget {
  constructor(
    label: string,
    action: string,
    defaultValue?: boolean
  )
}
```

**Properties:**
- `defaultValue?: boolean` - Initial state (default: false)

### FileUploadWidget

File input with restrictions.

```typescript
class FileUploadWidget extends ChatWidget {
  constructor(
    label: string,
    action: string,
    accept?: string,
    maxBytes?: number
  )
}
```

**Properties:**
- `accept?: string` - File type filter (e.g., ".pdf,.docx")
- `maxBytes?: number` - Maximum file size in bytes

### DatePickerWidget

Date selection input.

```typescript
class DatePickerWidget extends ChatWidget {
  constructor(
    label: string,
    action: string,
    minDate?: string,
    maxDate?: string
  )
}
```

**Properties:**
- `minDate?: string` - Minimum date (YYYY-MM-DD)
- `maxDate?: string` - Maximum date (YYYY-MM-DD)

### MultiSelectWidget

Multiple-select dropdown.

```typescript
class MultiSelectWidget extends ChatWidget {
  constructor(
    label: string,
    action: string,
    options: string[]
  )
}
```

**Properties:**
- `options: string[]` - List of selectable options

### ProgressBarWidget

Progress indicator.

```typescript
class ProgressBarWidget extends ChatWidget {
  constructor(
    label: string,
    action: string,
    value: number,
    max: number
  )
}
```

**Properties:**
- `value: number` - Current progress value
- `max: number` - Maximum value (100%)

### ThemeSwitcherWidget

Theme selection dropdown.

```typescript
class ThemeSwitcherWidget extends ChatWidget {
  constructor(
    label: string,
    action: string,
    themes: string[]
  )
}
```

**Properties:**
- `themes: string[]` - Available theme options

## Renderers

### IWidgetRenderer

Interface for widget renderers.

```typescript
interface IWidgetRenderer {
  framework: string;
  renderWidget(widget: ChatWidget): string;
}
```

### SsrWidgetRenderer

Server-side rendering implementation.

```typescript
class SsrWidgetRenderer implements IWidgetRenderer {
  readonly framework: string; // "SSR"
  renderWidget(widget: ChatWidget): string;
}
```

**Example:**
```typescript
const renderer = new SsrWidgetRenderer();
const html = renderer.renderWidget(widget);
```

### WidgetRenderingService

Service for managing multiple renderers.

```typescript
class WidgetRenderingService {
  registerRenderer(renderer: IWidgetRenderer): void;
  renderWidget(widget: ChatWidget, framework?: string): string;
  renderWidgets(widgets: ChatWidget[], framework?: string): string;
  getAvailableFrameworks(): string[];
}
```

**Example:**
```typescript
const service = new WidgetRenderingService();
const html = service.renderWidget(widget, 'SSR');
```

## Handlers

### IWidgetActionHandler

Interface for action handlers.

```typescript
interface IWidgetActionHandler {
  handle(action: string, payload: any): Promise<void>;
}
```

### DefaultWidgetActionHandler

Default implementation using fetch API.

```typescript
class DefaultWidgetActionHandler implements IWidgetActionHandler {
  constructor(apiUrl?: string); // default: "/api/chat/action"
  async handle(action: string, payload: any): Promise<void>;
}
```

**Example:**
```typescript
const handler = new DefaultWidgetActionHandler('/api/custom');
await handler.handle('submit', { name: 'John' });
```

### WidgetEventManager

Manages widget event listeners.

```typescript
class WidgetEventManager {
  constructor(actionHandler?: IWidgetActionHandler);
  attachHandlers(container: Element): void;
}
```

**Example:**
```typescript
const container = document.getElementById('widgets');
const manager = new WidgetEventManager();
manager.attachHandlers(container);
```

## Types

### ChatWidgetType

```typescript
type ChatWidgetType =
  | 'button'
  | 'card'
  | 'input'
  | 'dropdown'
  | 'slider'
  | 'toggle'
  | 'fileupload'
  | 'themeswitcher'
  | 'datepicker'
  | 'multiselect'
  | 'progressbar';
```

## Constants

### VERSION

```typescript
const VERSION: string; // Current package version
```

## Complete Example

```typescript
import {
  ButtonWidget,
  CardWidget,
  InputWidget,
  ChatWidget,
  SsrWidgetRenderer,
  WidgetEventManager,
} from '@bbq-chat/widgets';

// Create widgets
const widgets = [
  new ButtonWidget('Submit', 'submit_form'),
  new CardWidget(
    'View',
    'view_details',
    'Product',
    'A great product',
    'https://example.com/image.jpg'
  ),
  new InputWidget('Name', 'input_name', 'Enter name', 50),
];

// Render to HTML
const renderer = new SsrWidgetRenderer();
const container = document.getElementById('widgets');
container.innerHTML = widgets.map(w => renderer.renderWidget(w)).join('');

// Attach event handlers
const eventManager = new WidgetEventManager();
eventManager.attachHandlers(container);

// Serialize/deserialize
const json = JSON.stringify(widgets.map(w => w.toObject()));
const restored = ChatWidget.listFromJson(json);
```
