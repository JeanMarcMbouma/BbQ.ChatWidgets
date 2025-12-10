# ChatTurn Types Added to JS Library

## Summary

Added TypeScript types for `ChatTurn` and `ChatRole` to the JavaScript library, enabling full type safety for chat conversations in the React sample app.

## Changes

### 1. Created `js/src/models/ChatTurn.ts`

**New File**: Defines core chat conversation types

```typescript
export enum ChatRole {
  User = 'user',
  Assistant = 'assistant',
}

export interface ChatTurn {
  role: ChatRole | string;
  content: string;
  widgets?: ChatWidget[] | null;
  threadId?: string;
}
```

**Features**:
- `ChatRole` enum for type-safe role values (User, Assistant)
- `ChatTurn` interface matching .NET library's record definition
- Optional widgets array for interactive UI elements
- Optional threadId for conversation tracking
- Full JSDoc documentation

### 2. Updated `js/src/models/index.ts`

**Added Export**: 
```typescript
export * from './ChatTurn';
```

Now exports ChatRole and ChatTurn alongside ChatWidget and CustomWidgetRegistry.

### 3. Fixed `Sample/WebApp/ClientApp/src/components/WidgetRenderer.tsx`

**Updated Widget Rendering**:
- Instantiate SsrWidgetRenderer: `new SsrWidgetRenderer()`
- Call instance method: `renderer.renderWidget(widget)`
- Generate unique key: `${widget.type}-${widget.action}-${index}`

Before:
```typescript
const html = SsrWidgetRenderer.renderWidget(widget);
key={`${widget.id}-${index}`}
```

After:
```typescript
const renderer = new SsrWidgetRenderer();
const html = renderer.renderWidget(widget);
const widgetId = `${widget.type}-${widget.action}-${index}`;
key={widgetId}
```

## Build Status

✅ **JavaScript Library**
- TypeScript compilation: PASS (exit code 0)
- npm run build: COMPLETE
- dist files generated with proper type definitions

✅ **Sample Web App**
- TypeScript check: PASS (exit code 0)
- All imports resolved
- useChat hook properly typed with ChatTurn
- Components correctly use ChatRole and ChatTurn types

## Exports from `@bbq/chatwidgets`

The library now exports:

```typescript
// Chat types
export { ChatRole, ChatTurn } from './models/ChatTurn';

// Widgets
export { ChatWidget, ButtonWidget, InputWidget, ... } from './models/ChatWidget';

// Registry
export { customWidgetRegistry, CustomWidgetRegistry } from './models/CustomWidgetRegistry';

// Renderers
export { SsrWidgetRenderer } from './renderers/SsrWidgetRenderer';
```

## Usage in Sample App

**In useChat hook**:
```typescript
import type { ChatTurn, ChatRole } from '@bbq/chatwidgets';

const response = (await response.json()) as ChatTurn;
```

**In MessageList component**:
```typescript
import type { ChatTurn } from '@bbq/chatwidgets';

export interface ChatMessage extends ChatTurn {
  id: string;
}
```

**In App**:
```typescript
<ChatWindow {...chat} />
// chat is of type UseChat which includes ChatTurn[]
```

## Type Safety Benefits

1. **Frontend-Backend Alignment**: Types match .NET library's ChatTurn record
2. **IDE Support**: Full autocomplete and type checking
3. **API Response Typing**: useChat hook properly types API responses
4. **Component Props**: ChatTurn interface ensures correct data flows through components
5. **Custom Widgets**: Support for custom widget types via ChatWidgetType string literal

## Files Modified

| File | Change |
|------|--------|
| `js/src/models/ChatTurn.ts` | Created (new file) |
| `js/src/models/index.ts` | Added ChatTurn export |
| `js/dist/models/ChatTurn.d.ts` | Auto-generated |
| `js/dist/models/index.d.ts` | Auto-updated |
| `Sample/WebApp/ClientApp/src/components/WidgetRenderer.tsx` | Fixed renderer instantiation |

## Verification

```bash
# JS Library
cd js
npx tsc --noEmit  # ✓ PASS
npm run build      # ✓ PASS

# Sample App
cd Sample/WebApp/ClientApp
npx tsc --noEmit   # ✓ PASS
```

## Next Steps

The Sample Web App now has full type safety:
1. Backend returns properly typed ChatTurn objects
2. Frontend receives and processes with ChatRole and ChatTurn types
3. Components have full IDE support and type checking
4. Custom widgets can extend ChatWidgetType at runtime while maintaining types

Ready for development and deployment!
