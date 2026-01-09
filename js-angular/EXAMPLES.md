# Usage Examples

## Understanding Widget Rendering

The `@bbq-chat/widgets-angular` package uses the **AngularWidgetRenderer** to render all built-in widgets as native Angular components. This provides better performance, type safety, and full Angular framework integration compared to HTML string rendering.

### Automatic Angular Rendering

When you use `WidgetRendererComponent`, it automatically uses `AngularWidgetRenderer` for all built-in widget types:

- ✅ **Built-in widgets** (button, card, form, etc.) → Rendered as Angular components
- ✅ **Custom component renderers** → Your Angular components
- ✅ **Custom template renderers** → Your Angular templates
- ✅ **HTML function renderers** → Your custom HTML strings
- ✅ **Fallback** → SSR renderer for compatibility

No configuration needed - it just works!

## Basic Usage

### 1. Install the package

```bash
npm install @bbq-chat/widgets-angular @bbq-chat/widgets
```

### 2. Import styles in your global styles file

In `styles.css` or `styles.scss`:

```css
@import '@bbq-chat/widgets/styles';
```

### 3. Create a chat component

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetRendererComponent } from '@bbq-chat/widgets-angular';
import type { ChatWidget } from '@bbq-chat/widgets-angular';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, WidgetRendererComponent],
  template: `
    <div class="chat-container">
      <div class="messages">
        @for (message of messages; track message.id) {
          <div class="message">
            <div class="message-content">{{ message.content }}</div>
            <bbq-widget-renderer 
              [widgets]="message.widgets" 
              (widgetAction)="handleWidgetAction($event)">
            </bbq-widget-renderer>
          </div>
        }
      </div>
      
      <div class="input-area">
        <input 
          type="text" 
          [(ngModel)]="userInput"
          (keyup.enter)="sendMessage()"
          placeholder="Type a message..."
        />
        <button (click)="sendMessage()">Send</button>
      </div>
    </div>
  `,
  styles: [`
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      max-width: 800px;
      margin: 0 auto;
    }

    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }

    .message {
      margin-bottom: 1rem;
    }

    .message-content {
      margin-bottom: 0.5rem;
    }

    .input-area {
      display: flex;
      gap: 0.5rem;
      padding: 1rem;
      border-top: 1px solid #ccc;
    }

    input {
      flex: 1;
      padding: 0.5rem;
    }
  `]
})
export class ChatComponent {
  messages: Array<{ id: number; content: string; widgets?: ChatWidget[] }> = [];
  userInput = '';
  private messageId = 0;

  async sendMessage() {
    if (!this.userInput.trim()) return;

    // Add user message
    this.messages.push({
      id: this.messageId++,
      content: this.userInput,
    });

    const userMessage = this.userInput;
    this.userInput = '';

    // Send to backend
    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      // Add assistant response with widgets
      this.messages.push({
        id: this.messageId++,
        content: data.content || '',
        widgets: data.widgets || [],
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  async handleWidgetAction(event: { actionName: string; payload: any }) {
    console.log('Widget action:', event);

    try {
      const response = await fetch('/api/chat/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: event.actionName,
          payload: event.payload,
        }),
      });

      const data = await response.json();

      // Add response with new widgets
      this.messages.push({
        id: this.messageId++,
        content: data.content || '',
        widgets: data.widgets || [],
      });
    } catch (error) {
      console.error('Failed to handle widget action:', error);
    }
  }
}
```

## Using Custom Widgets

### 1. Define your custom widget

```typescript
// custom-widgets/weather-widget.ts
import { ChatWidget } from '@bbq-chat/widgets-angular';

export class WeatherWidget extends ChatWidget {
  override type = 'weather';

  constructor(
    public label: string,
    public action: string,
    public city: string,
    public temperature: number,
    public condition: string
  ) {
    super(label, action);
  }
}
```

### 2. Register the custom widget

```typescript
// app.config.ts or component
import { Component, OnInit } from '@angular/core';
import { WidgetRegistryService } from '@bbq-chat/widgets-angular';
import { WeatherWidget } from './custom-widgets/weather-widget';

@Component({
  selector: 'app-root',
  template: '...'
})
export class AppComponent implements OnInit {
  constructor(private widgetRegistry: WidgetRegistryService) {}

  ngOnInit() {
    // Register custom widget factory
    this.widgetRegistry.registerFactory('weather', (obj: any) => {
      if (obj.type === 'weather') {
        return new WeatherWidget(
          obj.label,
          obj.action,
          obj.city,
          obj.temperature,
          obj.condition
        );
      }
      return null;
    });
  }
}
```

### 3. Create custom renderers

The library now supports three types of custom renderers:

#### Option A: HTML Function Renderer

Use a function that returns HTML strings:

```typescript
import { Component, OnInit } from '@angular/core';
import { WidgetRegistryService } from '@bbq-chat/widgets-angular';
import { WeatherWidget } from './custom-widgets/weather-widget';

@Component({
  selector: 'app-root',
  template: '...'
})
export class AppComponent implements OnInit {
  constructor(private widgetRegistry: WidgetRegistryService) {}

  ngOnInit() {
    // Register custom widget factory
    this.widgetRegistry.registerFactory('weather', (obj: any) => {
      if (obj.type === 'weather') {
        return new WeatherWidget(
          obj.label,
          obj.action,
          obj.city,
          obj.temperature,
          obj.condition
        );
      }
      return null;
    });

    // Register HTML renderer
    this.widgetRegistry.registerRenderer('weather', (widget) => {
      const w = widget as WeatherWidget;
      return `
        <div class="weather-widget">
          <h3>${w.city}</h3>
          <p>${w.temperature}°C - ${w.condition}</p>
        </div>
      `;
    });
  }
}
```

#### Option B: Angular Component Renderer (Recommended)

Create an Angular component for better type safety and data binding:

```typescript
// weather-widget.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomWidgetComponent } from '@bbq-chat/widgets-angular';
import { WeatherWidget } from './custom-widgets/weather-widget';

@Component({
  selector: 'app-weather-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="weather-widget">
      <h3>{{ weatherWidget.city }}</h3>
      <div class="weather-info">
        <p class="temperature">{{ weatherWidget.temperature }}°C</p>
        <p class="condition">{{ weatherWidget.condition }}</p>
      </div>
      <button (click)="onRefresh()">Refresh</button>
    </div>
  `,
  styles: [`
    .weather-widget {
      padding: 1rem;
      border: 1px solid #ccc;
      border-radius: 8px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .temperature {
      font-size: 2rem;
      font-weight: bold;
    }
  `]
})
export class WeatherWidgetComponent implements CustomWidgetComponent {
  @Input() widget!: ChatWidget;
  widgetAction?: (actionName: string, payload: unknown) => void;

  get weatherWidget(): WeatherWidget {
    return this.widget as WeatherWidget;
  }

  onRefresh() {
    if (this.widgetAction) {
      this.widgetAction('refresh_weather', { 
        city: this.weatherWidget.city 
      });
    }
  }
}
```

Then register the component:

```typescript
import { Component, OnInit } from '@angular/core';
import { WidgetRegistryService } from '@bbq-chat/widgets-angular';
import { WeatherWidget } from './custom-widgets/weather-widget';
import { WeatherWidgetComponent } from './weather-widget.component';

@Component({
  selector: 'app-root',
  template: '...'
})
export class AppComponent implements OnInit {
  constructor(private widgetRegistry: WidgetRegistryService) {}

  ngOnInit() {
    // Register custom widget factory
    this.widgetRegistry.registerFactory('weather', (obj: any) => {
      if (obj.type === 'weather') {
        return new WeatherWidget(
          obj.label,
          obj.action,
          obj.city,
          obj.temperature,
          obj.condition
        );
      }
      return null;
    });

    // Register component renderer - enables full Angular features
    this.widgetRegistry.registerRenderer('weather', WeatherWidgetComponent);
  }
}
```

#### Option C: Angular Template Renderer

Use Angular templates for inline rendering with data binding:

```typescript
import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { WidgetRegistryService, WidgetTemplateContext } from '@bbq-chat/widgets-angular';
import { WeatherWidget } from './custom-widgets/weather-widget';

@Component({
  selector: 'app-root',
  template: `
    <ng-template #weatherTemplate let-widget let-emitAction="emitAction">
      <div class="weather-widget">
        <h3>{{ widget.city }}</h3>
        <p>{{ widget.temperature }}°C - {{ widget.condition }}</p>
        <button (click)="emitAction('refresh_weather', { city: widget.city })">
          Refresh
        </button>
      </div>
    </ng-template>

    <bbq-widget-renderer 
      [widgets]="widgets" 
      (widgetAction)="handleWidgetAction($event)">
    </bbq-widget-renderer>
  `
})
export class AppComponent implements OnInit {
  @ViewChild('weatherTemplate', { static: true })
  weatherTemplate!: TemplateRef<WidgetTemplateContext>;

  widgets: ChatWidget[] = [];

  constructor(private widgetRegistry: WidgetRegistryService) {}

  ngOnInit() {
    // Register custom widget factory
    this.widgetRegistry.registerFactory('weather', (obj: any) => {
      if (obj.type === 'weather') {
        return new WeatherWidget(
          obj.label,
          obj.action,
          obj.city,
          obj.temperature,
          obj.condition
        );
      }
      return null;
    });

    // Register template renderer - enables inline Angular templates
    this.widgetRegistry.registerRenderer('weather', this.weatherTemplate);
  }

  handleWidgetAction(event: { actionName: string; payload: any }) {
    console.log('Widget action:', event);
  }
}
```

### Benefits of Component-Based Renderers

Using Angular components for custom widgets provides several advantages:

1. **Type Safety**: Full TypeScript support with interfaces and types
2. **Data Binding**: Use Angular's powerful two-way data binding
3. **Lifecycle Hooks**: Access to Angular lifecycle hooks (ngOnInit, ngOnDestroy, etc.)
4. **Change Detection**: Automatic UI updates when data changes
5. **Dependency Injection**: Inject services directly into widget components
6. **Animations**: Use Angular animations for smooth transitions
7. **Reactive Forms**: Integrate with Angular reactive forms
8. **Testing**: Easier unit testing with Angular TestBed

## Integration with Forms

The package automatically handles form submissions. Example:

```typescript
handleWidgetAction(event: { actionName: string; payload: any }) {
  if (event.actionName === 'submit_form') {
    console.log('Form data:', event.payload);
    // payload contains all form field values
    // { name: 'John', email: 'john@example.com', ... }
  }
}
```

## Theming

Import different themes:

```css
/* Light theme (default) */
@import '@bbq-chat/widgets/styles/light';

/* Dark theme */
@import '@bbq-chat/widgets/styles/dark';

/* Corporate theme */
@import '@bbq-chat/widgets/styles/corporate';
```

Or customize with CSS variables:

```css
:root {
  --bbq-primary-color: #007bff;
  --bbq-secondary-color: #6c757d;
  --bbq-border-radius: 8px;
  /* ... other variables */
}
```
