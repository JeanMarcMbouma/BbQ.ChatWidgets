# Angular Custom Widget Renderer Enhancements

This document summarizes the enhancements made to the `@bbq-chat/widgets-angular` npm library to support Angular templates and components as custom widget renderers.

## Overview

The library now supports **three types of custom widget renderers**, giving developers flexibility in how they implement custom widgets:

1. **HTML Function Renderer** - Returns HTML strings (simple, no Angular features)
2. **Angular Component Renderer** - Uses Angular components (full framework features, recommended)
3. **Angular Template Renderer** - Uses inline Angular templates (good for simple cases)

## Key Benefits

### Component-Based Renderers
- ✅ **Type Safety** - Full TypeScript support with interfaces
- ✅ **Data Binding** - One-way and two-way Angular data binding
- ✅ **Lifecycle Hooks** - Access to `ngOnInit`, `ngOnDestroy`, etc.
- ✅ **Change Detection** - Automatic UI updates
- ✅ **Dependency Injection** - Inject services directly
- ✅ **Animations** - Use Angular animations
- ✅ **Testing** - Easy unit testing with TestBed

## Usage Examples

### 1. HTML Function Renderer (Existing Pattern)

```typescript
widgetRegistry.registerRenderer('myWidget', (widget) => {
  return `<div class="my-widget">${widget.label}</div>`;
});
```

### 2. Angular Component Renderer (NEW - Recommended)

```typescript
// Define the component
@Component({
  selector: 'app-my-widget',
  standalone: true,
  template: `
    <div class="my-widget">
      <h3>{{ myWidget.title }}</h3>
      <button (click)="onClick()">Action</button>
    </div>
  `
})
export class MyWidgetComponent implements CustomWidgetComponent {
  @Input() widget!: ChatWidget;
  widgetAction?: (actionName: string, payload: unknown) => void;

  get myWidget(): MyCustomWidget {
    return this.widget as MyCustomWidget;
  }

  onClick() {
    this.widgetAction?.('my_action', { data: 'example' });
  }
}

// Register the component
widgetRegistry.registerRenderer('myWidget', MyWidgetComponent);
```

### 3. Angular Template Renderer (NEW)

```typescript
@Component({
  template: `
    <ng-template #myTemplate let-widget let-emitAction="emitAction">
      <div class="my-widget">
        <h3>{{ widget.title }}</h3>
        <button (click)="emitAction('my_action', { data: 'example' })">
          Action
        </button>
      </div>
    </ng-template>
  `
})
export class AppComponent implements OnInit {
  @ViewChild('myTemplate', { static: true }) myTemplate!: TemplateRef<any>;

  ngOnInit() {
    widgetRegistry.registerRenderer('myWidget', this.myTemplate);
  }
}
```

## API Reference

### WidgetRegistryService

#### `registerRenderer(type: string, renderer: CustomWidgetRenderer): void`
Register a custom renderer for a widget type.

**Parameters:**
- `type` - Widget type identifier
- `renderer` - HTML function, Angular Component class, or TemplateRef

#### `getRenderer(type: string): CustomWidgetRenderer | undefined`
Get the registered renderer for a widget type.

#### `hasRenderer(type: string): boolean`
Check if a renderer is registered for a widget type.

#### `unregisterRenderer(type: string): boolean`
Remove a registered renderer.

### CustomWidgetComponent Interface

Components used as custom renderers should implement this interface:

```typescript
interface CustomWidgetComponent {
  widget: ChatWidget;
  widgetAction?: (actionName: string, payload: unknown) => void;
}
```

### WidgetTemplateContext

Context provided to template-based renderers:

```typescript
interface WidgetTemplateContext {
  $implicit: ChatWidget;  // The widget (default binding)
  widget: ChatWidget;     // The widget (explicit binding)
  emitAction: (actionName: string, payload: unknown) => void;
}
```

## Migration Guide

### Existing HTML Renderers
No changes needed - existing HTML function renderers continue to work.

### Moving to Component Renderers

**Before:**
```typescript
// Override in extended component
protected override updateWidgetHtml() {
  this.widgetHtmlList = this.widgets.map((widget) => {
    if (widget.type === 'myWidget') {
      return myCustomRenderFunction(widget);
    }
    return this.renderer.renderWidget(widget);
  });
}
```

**After:**
```typescript
// Register component in ngOnInit
ngOnInit() {
  this.widgetRegistry.registerRenderer('myWidget', MyWidgetComponent);
}
```

## Demo

A full demo page showcasing all three renderer types is available in:
`Sample/BbQ.ChatWidgets.Sample.Angular/ClientApp/src/app/pages/custom-widget-demo/`

To run the demo:
1. Navigate to the Angular sample app
2. Select "Custom Widget Renderers" from the home page
3. Explore the interactive examples

## Implementation Details

### Dynamic Component Creation
Components are created using Angular's `createComponent()` API:

```typescript
const componentRef = createComponent(componentType, {
  environmentInjector: this.environmentInjector,
  elementInjector: this.injector,
});
```

### Template Rendering
Templates are rendered using `createEmbeddedView()`:

```typescript
const viewRef = templateRef.createEmbeddedView(context);
viewRef.rootNodes.forEach((node: Node) => {
  targetElement.appendChild(node);
});
```

### Lifecycle Management
- Components and views are stored in arrays
- Cleanup is performed in `ngOnDestroy`
- Change detection is manually triggered after creation

## Type Safety

The implementation includes:
- Type guards for detecting renderer types
- Runtime checks when setting component properties
- Proper DOM node typing
- TypeScript interfaces for all public APIs

## Documentation

Comprehensive documentation is available in:
- `js-angular/README.md` - Quick start and overview
- `js-angular/EXAMPLES.md` - Detailed examples for all approaches
- API comments in source code

## Future Enhancements

Potential improvements for future releases:
- Support for Angular standalone components with inputs
- Integration with Angular signals
- Support for lazy-loaded components
- Performance optimizations for large widget lists
- Built-in examples library

## Support

For issues or questions:
- GitHub Issues: https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/issues
- Documentation: See EXAMPLES.md for detailed examples
