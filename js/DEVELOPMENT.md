This document has been consolidated into the new documentation structure.

Please refer to `docs/INDEX.md` and `README.md` for the updated documentation.
# Development Guide

## Setup

### Prerequisites

- Node.js 14+
- npm, yarn, or pnpm

### Installation

```bash
cd js
npm install
```

## Scripts

```bash
# Build
npm run build

# Build and watch
npm run build:watch

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Test coverage
npm run test:coverage

# Lint
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type checking
npm run type-check

# Prepare for publication
npm run prepublishOnly
```

## Project Structure

```
js/
├── src/
│   ├── models/
│   │   ├── ChatWidget.ts          # Widget definitions
│   │   └── index.ts
│   ├── renderers/
│   │   ├── SsrWidgetRenderer.ts   # HTML renderer
│   │   ├── WidgetRenderingService.ts
│   │   └── index.ts
│   ├── handlers/
│   │   ├── WidgetEventManager.ts  # Event handling
│   │   └── index.ts
│   └── index.ts
├── scripts/
│   └── build.mjs                  # Build script
├── dist/                          # Compiled output
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .eslintrc.json
└── README.md
```

## Testing

### Run Tests

```bash
npm test
```

### Watch Tests

```bash
npm test -- --watch
```

### Coverage

```bash
npm run test:coverage
```

Tests are located in `src/**/*.spec.ts` files.

## Building

### Development Build

```bash
npm run build
```

### Build Output

- `dist/index.js` - ESM version
- `dist/index.cjs` - CommonJS version
- `dist/index.d.ts` - Type definitions
- `dist/models/`, `dist/renderers/`, `dist/handlers/` - Submodule exports

## Code Style

### Linting

```bash
npm run lint
```

### Fixing Issues

```bash
npm run lint:fix
```

### Formatting

```bash
npm run format
```

### Type Checking

```bash
npm run type-check
```

## Publishing

### Prepare Package

```bash
npm run prepublishOnly
```

This runs:
1. Build
2. Tests
3. Linting

### Publish to npm

```bash
npm publish
```

### Publish with Tag

```bash
npm publish --tag beta
npm publish --tag next
```

## Version Bumping

```bash
# Patch (bug fixes)
npm version patch

# Minor (features)
npm version minor

# Major (breaking changes)
npm version major
```

## Debugging

### Node Debugging

```bash
node --inspect-brk node_modules/vitest/vitest.mjs run
```

### Type Issues

```bash
npm run type-check
```

## Git Workflow

### Before Committing

```bash
# Format code
npm run format

# Lint
npm run lint:fix

# Test
npm test

# Type check
npm run type-check
```

### Commit Messages

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `test:` Tests
- `perf:` Performance
- `refactor:` Code refactoring
- `chore:` Maintenance

## Adding New Widgets

1. Add class to `src/models/ChatWidget.ts`
2. Add to `fromObject()` switch statement
3. Add renderer method to `src/renderers/SsrWidgetRenderer.ts`
4. Add to `renderWidget()` switch statement
5. Add tests in `*.spec.ts` files
6. Update `README.md`

### Example: New Widget

```typescript
// src/models/ChatWidget.ts
export class RatingWidget extends ChatWidget {
  constructor(
    label: string,
    action: string,
    readonly maxRating: number = 5,
    readonly defaultRating: number = 0
  ) {
    super('rating', label, action);
  }

  toObject() {
    return {
      type: this.type,
      label: this.label,
      action: this.action,
      maxRating: this.maxRating,
      defaultRating: this.defaultRating,
    };
  }
}
```

```typescript
// Add to ChatWidget.fromObject()
case 'rating':
  return new RatingWidget(
    obj.label,
    obj.action,
    obj.maxRating,
    obj.defaultRating
  );
```

```typescript
// src/renderers/SsrWidgetRenderer.ts
private renderRating(widget: any): string {
  // Render implementation
}

// Add to renderWidget()
case 'rating':
  return this.renderRating(widget as any);
```

## Performance

### Build Time

Measured with `npm run build`:
- TypeScript compilation: ~2s
- ESBuild bundling: ~1s

### Bundle Size

- ESM: ~15KB (unminified)
- CJS: ~16KB (unminified)
- Gzipped: ~5KB

## Troubleshooting

### Build Fails

1. Clear cache: `rm -rf dist node_modules`
2. Reinstall: `npm install`
3. Rebuild: `npm run build`

### Tests Fail

1. Check Node version: `node --version`
2. Clear cache: `npm cache clean --force`
3. Reinstall: `npm install`
4. Run tests: `npm test`

### Type Errors

```bash
npm run type-check
```

### Lint Errors

```bash
npm run lint:fix
```

## Release Checklist

- [ ] All tests pass
- [ ] No linting errors
- [ ] No type errors
- [ ] README updated
- [ ] Changelog updated
- [ ] Version bumped
- [ ] Build succeeds
- [ ] Package publishes successfully

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)
- [ESBuild Guide](https://esbuild.github.io/)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
