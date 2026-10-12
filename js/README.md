# @bbq-chat/widgets

Turn AI conversations into forms, choices and useful actions. A framework-independent TypeScript library with built-in renderers, custom widget support and live SSE updates. Pair it with `BbQ.ChatWidgets` on .NET or your own backend.

```sh
npm install @bbq-chat/widgets
```

```ts
import { ButtonWidget, WidgetManager } from '@bbq-chat/widgets';
import '@bbq-chat/widgets/styles/light';

const container = document.querySelector('#widgets');
if (container) {
  const manager = new WidgetManager({
    container,
    actionHandler: {
      async handle(action, payload) {
        // Send to your application. Validate permissions and payloads on the server.
        console.log(action, payload);
      },
    },
  });
  manager.renderInto(container, new ButtonWidget('Track my delivery', 'track_delivery'));
  // On disposal: manager.detachHandlers(container);
}
```

Supports native ESM, CommonJS and the `/models`, `/renderers`, `/handlers` subpaths. Import themes from `/styles`, `/styles/light`, `/styles/dark` or `/styles/corporate` through your bundler. Use `ChatWidget.fromObject` to deserialize JSON contracts. Custom renderers are trusted code; escape any untrusted content they emit.

Try booking, support and approval examples in the [local playground](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/blob/master/docs_src/guides/PRODUCTION.md). No API key is needed.

[Getting started](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/blob/master/docs_src/GETTING_STARTED.md) · [Widget gallery](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/blob/master/docs_src/widgets/GALLERY.md) · [Production guide](https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/blob/master/docs_src/guides/PRODUCTION.md)
