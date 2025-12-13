This document has been consolidated into the new documentation structure.

Please refer to `docs/INDEX.md` and `README.md` for the updated documentation.
# Framework Integration Guide

Complete guide for using `@bbq-chat/widgets` with different frameworks.

## Table of Contents

- [Vanilla JavaScript](#vanilla-javascript)
- [React](#react)
- [Vue](#vue)
- [Angular](#angular)
- [Svelte](#svelte)
- [Next.js](#nextjs)

## Vanilla JavaScript

### Installation

```bash
npm install @bbq-chat/widgets
```

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="/themes/bbq-chat-light.css">
</head>
<body>
  <div id="widgets"></div>

  <script type="module">
    import {
      ButtonWidget,
      InputWidget,
      SsrWidgetRenderer,
      WidgetEventManager,
    } from '@bbq-chat/widgets';

    // Create widgets
    const widgets = [
      new ButtonWidget('Submit', 'submit_form'),
      new InputWidget('Name', 'input_name'),
    ];

    // Render
    const container = document.getElementById('widgets');
    const renderer = new SsrWidgetRenderer();
    
    widgets.forEach(widget => {
      const html = renderer.renderWidget(widget);
      container.innerHTML += html;
    });

    // Handle events
    const eventManager = new WidgetEventManager();
    eventManager.attachHandlers(container);
  </script>
</body>
</html>
```

### Custom Styling

```css
/* Override default styles */
.bbq-button {
  background-color: #007bff;
  border-radius: 8px;
  padding: 10px 20px;
}

.bbq-button:hover {
  background-color: #0056b3;
}

.bbq-input-field {
  border: 2px solid #ddd;
}

.bbq-input-field:focus {
  border-color: #007bff;
  box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
}
```

## React

### Installation

```bash
npm install @bbq-chat/widgets react
```

### Hook Component

```jsx
import { useEffect, useRef } from 'react';
import {
  ChatWidget,
  SsrWidgetRenderer,
  WidgetEventManager,
} from '@bbq-chat/widgets';

export function WidgetsContainer({ widgets }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !widgets.length) return;

    const renderer = new SsrWidgetRenderer();
    containerRef.current.innerHTML = widgets
      .map(w => renderer.renderWidget(w))
      .join('');

    const eventManager = new WidgetEventManager();
    eventManager.attachHandlers(containerRef.current);
  }, [widgets]);

  return <div ref={containerRef} />;
}
```

### Class Component

```jsx
import React from 'react';
import {
  SsrWidgetRenderer,
  WidgetEventManager,
} from '@bbq-chat/widgets';

class WidgetsContainer extends React.Component {
  containerRef = React.createRef();

  componentDidMount() {
    this.renderWidgets();
  }

  componentDidUpdate() {
    this.renderWidgets();
  }

  renderWidgets() {
    const { widgets } = this.props;
    if (!this.containerRef.current) return;

    const renderer = new SsrWidgetRenderer();
    this.containerRef.current.innerHTML = widgets
      .map(w => renderer.renderWidget(w))
      .join('');

    const eventManager = new WidgetEventManager();
    eventManager.attachHandlers(this.containerRef.current);
  }

  render() {
    return <div ref={this.containerRef} />;
  }
}

export default WidgetsContainer;
```

### Using in Chat Component

```jsx
import { useState, useRef, useEffect } from 'react';
import { ChatWidget, WidgetEventManager, SsrWidgetRenderer } from '@bbq-chat/widgets';

function ChatApp() {
  const [messages, setMessages] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const eventManager = new WidgetEventManager();
    eventManager.attachHandlers(containerRef.current);
  }, [messages]);

  const handleMessage = async (text) => {
    const response = await fetch('/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });

    const data = await response.json();
    const renderer = new SsrWidgetRenderer();

    setMessages(prev => [...prev, {
      role: 'user',
      content: text,
      widgets: [],
    }, {
      role: 'assistant',
      content: data.content,
      widgets: data.widgets || [],
      widgetHtml: data.widgets?.map(w => renderer.renderWidget(w)).join(''),
    }]);
  };

  return (
    <div className="chat-container">
      <div ref={containerRef} className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <p>{msg.content}</p>
            {msg.widgetHtml && (
              <div
                className="widgets"
                dangerouslySetInnerHTML={{ __html: msg.widgetHtml }}
              />
            )}
          </div>
        ))}
      </div>
      <input
        type="text"
        placeholder="Type message..."
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleMessage(e.target.value);
            e.target.value = '';
          }
        }}
      />
    </div>
  );
}

export default ChatApp;
```

## Vue

### Installation

```bash
npm install @bbq-chat/widgets vue
```

### Vue 3 Composition API

```vue
<template>
  <div ref="containerRef" class="widgets-container"></div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import {
  ButtonWidget,
  SsrWidgetRenderer,
  WidgetEventManager,
} from '@bbq-chat/widgets';

const containerRef = ref(null);

onMounted(() => {
  const widgets = [
    new ButtonWidget('Click Me', 'submit'),
  ];

  if (containerRef.value) {
    const renderer = new SsrWidgetRenderer();
    containerRef.value.innerHTML = widgets
      .map(w => renderer.renderWidget(w))
      .join('');

    const eventManager = new WidgetEventManager();
    eventManager.attachHandlers(containerRef.value);
  }
});
</script>
```

### Vue 3 Options API

```vue
<template>
  <div ref="container" class="widgets-container"></div>
</template>

<script>
import {
  SsrWidgetRenderer,
  WidgetEventManager,
} from '@bbq-chat/widgets';

export default {
  name: 'WidgetsContainer',
  props: ['widgets'],
  mounted() {
    this.renderWidgets();
  },
  updated() {
    this.renderWidgets();
  },
  methods: {
    renderWidgets() {
      const renderer = new SsrWidgetRenderer();
      this.$refs.container.innerHTML = this.widgets
        .map(w => renderer.renderWidget(w))
        .join('');

      const eventManager = new WidgetEventManager();
      eventManager.attachHandlers(this.$refs.container);
    },
  },
};
</script>
```

### Chat Component Example

```vue
<template>
  <div class="chat-app">
    <div ref="messagesRef" class="messages">
      <div v-for="(msg, i) in messages" :key="i" :class="`message ${msg.role}`">
        <p>{{ msg.content }}</p>
        <div v-if="msg.widgetHtml" v-html="msg.widgetHtml"></div>
      </div>
    </div>
    <input
      type="text"
      placeholder="Type message..."
      @keyup.enter="sendMessage"
    />
  </div>
</template>

<script>
import { SsrWidgetRenderer, WidgetEventManager } from '@bbq-chat/widgets';

export default {
  name: 'ChatApp',
  data() {
    return {
      messages: [],
    };
  },
  methods: {
    async sendMessage(e) {
      const text = e.target.value;
      e.target.value = '';

      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json();
      const renderer = new SsrWidgetRenderer();

      this.messages.push({
        role: 'user',
        content: text,
        widgetHtml: '',
      });

      this.messages.push({
        role: 'assistant',
        content: data.content,
        widgetHtml: data.widgets
          ?.map(w => renderer.renderWidget(w))
          .join('') || '',
      });

      this.$nextTick(() => {
        const eventManager = new WidgetEventManager();
        eventManager.attachHandlers(this.$refs.messagesRef);
      });
    },
  },
};
</script>
```

## Angular

### Installation

```bash
npm install @bbq-chat/widgets @angular/common
```

### Component

```typescript
import {
  Component,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {
  ChatWidget,
  SsrWidgetRenderer,
  WidgetEventManager,
} from '@bbq-chat/widgets';

@Component({
  selector: 'app-widgets',
  template: '<div #container></div>',
})
export class WidgetsComponent implements OnInit, OnDestroy, OnChanges {
  @Input() widgets: ChatWidget[] = [];
  @ViewChild('container') container!: ElementRef;

  private eventManager!: WidgetEventManager;

  ngOnInit() {
    this.render();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['widgets']) {
      this.render();
    }
  }

  ngOnDestroy() {
    if (this.container) {
      this.container.nativeElement.innerHTML = '';
    }
  }

  private render() {
    if (!this.container) return;

    const renderer = new SsrWidgetRenderer();
    this.container.nativeElement.innerHTML = this.widgets
      .map(w => renderer.renderWidget(w))
      .join('');

    this.eventManager = new WidgetEventManager();
    this.eventManager.attachHandlers(this.container.nativeElement);
  }
}
```

## Svelte

### Installation

```bash
npm install @bbq-chat/widgets svelte
```

### Svelte Component

```svelte
<script>
  import {
    ButtonWidget,
    SsrWidgetRenderer,
    WidgetEventManager,
  } from '@bbq-chat/widgets';
  import { onMount } from 'svelte';

  let container;
  const widgets = [new ButtonWidget('Click', 'action')];
  const renderer = new SsrWidgetRenderer();

  onMount(() => {
    container.innerHTML = widgets
      .map(w => renderer.renderWidget(w))
      .join('');

    const eventManager = new WidgetEventManager();
    eventManager.attachHandlers(container);
  });
</script>

<div bind:this={container}></div>

<style>
  :global(.bbq-button) {
    background: #007bff;
    color: white;
  }
</style>
```

## Next.js

### Installation

```bash
npm install @bbq-chat/widgets next react
```

### Component

```typescript
// components/Widgets.tsx
'use client';

import { useEffect, useRef } from 'react';
import {
  ChatWidget,
  SsrWidgetRenderer,
  WidgetEventManager,
} from '@bbq-chat/widgets';

interface WidgetsProps {
  widgets: ChatWidget[];
}

export function Widgets({ widgets }: WidgetsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = new SsrWidgetRenderer();
    containerRef.current.innerHTML = widgets
      .map(w => renderer.renderWidget(w))
      .join('');

    const eventManager = new WidgetEventManager();
    eventManager.attachHandlers(containerRef.current);
  }, [widgets]);

  return <div ref={containerRef} />;
}
```

### Usage in Page

```typescript
// app/page.tsx
import { Widgets } from '@/components/Widgets';
import { ButtonWidget, InputWidget } from '@bbq-chat/widgets';

export default function Home() {
  const widgets = [
    new ButtonWidget('Submit', 'submit'),
    new InputWidget('Name', 'input_name'),
  ];

  return (
    <main>
      <h1>Chat</h1>
      <Widgets widgets={widgets} />
    </main>
  );
}
```

## Common Patterns

### Custom Action Handler

```typescript
import { DefaultWidgetActionHandler } from '@bbq-chat/widgets';

class CustomActionHandler extends DefaultWidgetActionHandler {
  async handle(action: string, payload: any) {
    console.log(`Handling ${action}:`, payload);
    
    // Custom logic
    if (action === 'special_action') {
      // Do something special
    }
    
    // Call parent for default behavior
    await super.handle(action, payload);
  }
}
```

### Error Handling

```typescript
try {
  const widget = ChatWidget.fromJson(jsonString);
  if (!widget) {
    console.error('Failed to deserialize widget');
    return;
  }
  // Use widget
} catch (error) {
  console.error('Widget error:', error);
}
```

### Dynamic Widget Loading

```typescript
async function loadWidgets() {
  const response = await fetch('/api/widgets');
  const json = await response.json();
  return ChatWidget.listFromJson(JSON.stringify(json));
}
```

## Styling

All frameworks can use the same CSS classes for styling:

```css
.bbq-widget { }
.bbq-button { }
.bbq-input { }
/* etc. */
```

Link theme file in your HTML or CSS:

```html
<link rel="stylesheet" href="/themes/bbq-chat-light.css">
```

## Performance Tips

1. **Memoize widgets** - Avoid recreating widget objects
2. **Lazy render** - Only render visible widgets
3. **Event delegation** - Use a single event manager for many widgets
4. **Debounce actions** - Prevent rapid duplicate actions

## Troubleshooting

### Widget not rendering

- Check HTML is injected correctly
- Verify CSS classes are present
- Inspect element in DevTools

### Events not firing

- Ensure `WidgetEventManager.attachHandlers()` is called
- Check action attribute exists in HTML
- Verify API endpoint is correct

### Type errors

- Use TypeScript for better IDE support
- Check widget constructor parameters
- Import types from package

## Support

- [GitHub Issues](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/issues)
- [Documentation](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/wiki)
