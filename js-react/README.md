# @bbq-chat/widgets-react

Native React 18/19 components for BbQ ChatWidgets, with the same supported widget and extension features as `@bbq-chat/widgets-angular`.

```sh
npm install @bbq-chat/widgets-react @bbq-chat/widgets react react-dom
```

```tsx
import { WidgetProvider, WidgetRenderer, type WidgetData } from '@bbq-chat/widgets-react';
import '@bbq-chat/widgets/styles/light';

const widgets: WidgetData[] = [
  { type: 'button', label: 'Continue', action: 'continue' },
  { type: 'form', label: 'Profile', action: 'save', fields: [
    { name: 'name', type: 'input', label: 'Name', required: true },
  ], actions: [{ type: 'submit', label: 'Save' }] },
];

export function App() {
  return <WidgetProvider>
    <WidgetRenderer widgets={widgets} onWidgetAction={(action, payload) => {
      console.log(action, payload); // Forward to your application's action endpoint.
    }} />
  </WidgetProvider>;
}
```

## Angular feature equivalents

| Angular feature | React API |
| --- | --- |
| Native widget renderer and 15 built-in components | `WidgetRenderer`, `Widget`, `BUILT_IN_WIDGET_COMPONENTS`, individual `*WidgetComponent` exports |
| Component, template, HTML overrides | `WidgetRegistryService.registerComponent`, `.registerTemplate`, `.registerHtml` |
| Custom model factories/classes | `WidgetRegistryService.registerFactory`, `.registerClass`; shared core registry |
| Dependency injection and renderer overrides | `WidgetProvider`, `useWidgetServices`, `ReactWidgetRenderer`, renderer/event-manager factories |
| Form field overrides | `WidgetProvider fieldComponents={{ ... }}` with `FormFieldProps` |
| Form validation events and listener | `onValidationState`, `FormValidationService`, `useFormValidation`, `FormValidationListener` |
| Schema-first stream consumer | `ReactSchemaFirstWidgetConsumer`; native React store and `useWidgetStream` |
| Core models, themes, HTML fallback | Core exports re-exported; theme imports from `@bbq-chat/widgets/styles/*` |

The native types are button, card, input, textarea, dropdown, slider, toggle, fileupload, themeswitcher, datepicker, multiselect, progressbar, form, image and imagecollection. Forms support text/input, email, password, number, textarea, dropdown/select, slider, toggle/checkbox/radio, datepicker/date, multiselect, fileupload/file and theme fields. The radio alias is a boolean control, matching Angular's mapping.

## Forms and actions

Forms initialize from field `defaultValue`, validate required fields and native constraints, and submit a dictionary keyed by field name. A successful submission disables the form and prevents duplicate submission. Cancel emits `{ actionType: 'cancel' }`. Checkbox values are booleans, numbers/ranges are numbers, multiple selections are arrays, and files are `File` objects. Required toggles must be checked. Reset a completed form by mounting a new React key or a new `instanceId`.

Standalone controls emit `{ value }`, except toggle (`{ checked }`), date (`{ date }`), theme (`{ theme }`), multiselect (`{ items }`) and file (`{ file }`). Buttons/cards emit `{}`. File size limits use `maxBytes`. Theme selection emits an action; the application decides how to apply its theme.

Use `onValidationState` for local events, or place the renderer and `FormValidationListener` inside the same provider for shared events. Validation `formId` is `instanceId` when provided, otherwise the form action. Give repeated forms unique instance IDs when filtering events. Labels use React-generated unique IDs even when actions repeat.

```tsx
<WidgetProvider fieldComponents={{
  rating: ({ id, value, onChange, disabled }) =>
    <input id={id} type="range" min={1} max={5} value={Number(value || 1)}
      disabled={disabled} onChange={e => onChange(Number(e.target.value))} />,
}}>
  <WidgetRenderer widgets={widgets} onValidationState={event => console.log(event)} />
  <FormValidationListener />
</WidgetProvider>
```

Custom fields receive `field`, `id`, `value`, `onChange`, `disabled` and `invalid`; honor these props to participate in form state and accessibility. Import `FormValidationListener` in the example above.

## Custom renderers and services

Create a registry once per application/tree (for example, with `useState`), register overrides, and supply it through `WidgetProvider`. Component/template rendering uses normal React escaping and lifecycle behavior.

```tsx
const registry = new WidgetRegistryService();
registry.registerComponent('button', ({ widget, onWidgetAction, disabled }) =>
  <button disabled={disabled} onClick={() => onWidgetAction?.(widget.action, {})}>
    {widget.label}
  </button>);
registry.registerTemplate('notice', ({ widget }) => <aside>{widget.label}</aside>);
// <WidgetProvider registry={registry}>...</WidgetProvider>
```

Explicit `kind` descriptors are also accepted by `registerRenderer`. HTML renderers are trusted application code: sanitize any untrusted HTML before returning it. Their DOM events are scoped to the rendered HTML and detached on replacement/unmount. Unsupported types fall back to the core HTML renderer. A provider can override `registry`, `renderer`, `htmlRenderer`, `validation`, `eventManagerFactory` and `fieldComponents`; nested providers inherit unspecified services. Register changes before rendering, or trigger an application render after changing the registry.

## Streaming

```tsx
import { useState } from 'react';
import { WidgetStreamStore, useWidgetStream, WidgetRenderer } from '@bbq-chat/widgets-react';

function Stream() {
  const [store] = useState(() => new WidgetStreamStore(reason => {
    console.log('Request a fresh snapshot:', reason);
  }));
  const widgets = useWidgetStream(store);
  // Feed each parsed WidgetStreamEvent from your transport into store.consume(event).
  return <WidgetRenderer widgets={widgets} />;
}
```

Create a store per stream. Snapshots, patches, removal, duplicate events and revision gaps use the same reducer and fixture as Angular. Instance IDs retain component state across unrelated updates; removal unmounts the component. Transport ownership and reconnection belong to the application. `ReactSchemaFirstWidgetConsumer` is available for integrations already using the core `WidgetManager` lifecycle.

## Build, validation and release

Build the core (`cd ../js && npm ci && npm run build`), then run `npm ci`, `npm run build`, `npm test` and `npm run test:package` here. The package check installs real tarballs against React 18 and 19 and verifies ESM/CommonJS SSR, shared model identity and TypeScript declarations with `moduleResolution: "Bundler"` (the core package's current declaration convention).

The React demo consumes this package. CI runs the native behavior tests on both React versions and the demo browser tests on desktop/mobile. Future `npm-v*` releases publish React after core using the production environment's `NPM_TOKEN`. For the initial React 1.1.0 release, run **NPM Publish React** manually from the merged release commit: this publishes only React and leaves existing core/Angular versions and tags intact. Do not run the aggregate workflow to republish an already released version.
