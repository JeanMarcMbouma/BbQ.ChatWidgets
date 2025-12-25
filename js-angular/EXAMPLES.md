# Usage Examples

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

### 3. Create a custom renderer (optional)

If you need custom rendering logic, extend the WidgetRendererComponent:

```typescript
import { Component } from '@angular/core';
import { WidgetRendererComponent } from '@bbq-chat/widgets-angular';
import { WeatherWidget } from './custom-widgets/weather-widget';

@Component({
  selector: 'app-custom-widget-renderer',
  template: `
    <div #widgetContainer class="bbq-widgets-container">
      @for (widget of widgets; track $index) {
        @if (widget.type === 'weather') {
          <div class="weather-widget">
            <h3>{{ (widget as WeatherWidget).city }}</h3>
            <p>{{ (widget as WeatherWidget).temperature }}°C</p>
            <p>{{ (widget as WeatherWidget).condition }}</p>
          </div>
        } @else {
          <div [innerHTML]="renderWidget(widget)"></div>
        }
      }
    </div>
  `
})
export class CustomWidgetRendererComponent extends WidgetRendererComponent {
  // You can override methods or add custom logic here
  WeatherWidget = WeatherWidget; // Make available in template
  
  renderWidget(widget: any): string {
    return this['renderer'].renderWidget(widget);
  }
}
```

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
