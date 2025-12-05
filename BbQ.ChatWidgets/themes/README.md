/**
 * BbQ ChatWidgets - CSS Theme Guide
 * Comprehensive documentation for all available themes
 */

# CSS Themes for BbQ ChatWidgets

This directory contains professional CSS theme files for styling BbQ ChatWidgets with different visual designs.

## Available Themes

### 1. **Light Theme** (`bbq-chat-light.css`)
A clean, professional light theme perfect for modern applications.

**Features:**
- Clean white backgrounds
- Soft gray accents
- Blue action buttons
- Hover effects with subtle shadows
- Full dark mode support via `@media (prefers-color-scheme: dark)`

**Use Case:** Default theme, modern web applications, SaaS platforms

**Color Scheme:**
- Primary Button: `#3b82f6` (Blue)
- Background: White
- Text: `#2c3e50` (Dark Gray)
- Borders: `#cbd5e1` (Light Gray)

### 2. **Dark Theme** (`bbq-chat-dark.css`)
A modern dark theme with vibrant gradient accents.

**Features:**
- Dark backgrounds (`#1e293b`)
- Vibrant purple-indigo gradients
- Enhanced contrast for readability
- Smooth shadow effects
- Optimized for night viewing

**Use Case:** Dark mode applications, gaming platforms, modern dashboards

**Color Scheme:**
- Primary Button: Gradient `#8b5cf6` ? `#6366f1` (Purple-Indigo)
- Background: `#1e293b` (Dark Slate)
- Text: `#e2e8f0` (Light Gray)
- Borders: `#475569` (Medium Gray)

### 3. **Corporate Theme** (`bbq-chat-corporate.css`)
A professional corporate theme suitable for business applications.

**Features:**
- Minimal, clean design
- Professional typography
- Subtle borders and shadows
- Uppercase labels with letter spacing
- Print-friendly styles

**Use Case:** Enterprise applications, corporate dashboards, business software

**Color Scheme:**
- Primary Button: `#1f2937` (Charcoal Black)
- Background: White
- Text: `#1f2937` (Dark Gray)
- Borders: `#d1d5db` (Medium Gray)

## How to Use

### Basic HTML Setup

```html
<!DOCTYPE html>
<html>
<head>
    <!-- Include the theme CSS -->
    <link rel="stylesheet" href="/themes/bbq-chat-light.css">
</head>
<body>
    <div id="chat-container">
        <!-- Widgets will be rendered here -->
    </div>
</body>
</html>
```

### Switching Themes at Runtime

```javascript
// Light theme
document.querySelector('link[href*="bbq-chat"]').href = '/themes/bbq-chat-light.css';

// Dark theme
document.querySelector('link[href*="bbq-chat"]').href = '/themes/bbq-chat-dark.css';

// Corporate theme
document.querySelector('link[href*="bbq-chat"]').href = '/themes/bbq-chat-corporate.css';
```

### Theme Switching with Media Preference

```html
<!-- Automatically uses dark theme if system prefers dark mode -->
<link rel="stylesheet" href="/themes/bbq-chat-light.css" media="(prefers-color-scheme: light)">
<link rel="stylesheet" href="/themes/bbq-chat-dark.css" media="(prefers-color-scheme: dark)">
```

## Widget Class Reference

### Base Class
- `.bbq-widget` - Applied to all widgets

### Button Widget
- `.bbq-button` - Button element
- `.bbq-button:hover` - Hover state
- `.bbq-button:active` - Active state
- `.bbq-button:disabled` - Disabled state
- `.bbq-button:focus-visible` - Focus state

### Dropdown Widget
- `.bbq-dropdown-label` - Label element
- `.bbq-dropdown` - Select element
- `.bbq-dropdown:hover` - Hover state
- `.bbq-dropdown:focus` - Focus state
- `.bbq-dropdown option` - Option element

### Slider Widget
- `.bbq-slider-label` - Label element
- `.bbq-slider` - Input range element
- `.bbq-slider::-webkit-slider-thumb` - Slider thumb (Webkit)
- `.bbq-slider::-moz-range-thumb` - Slider thumb (Firefox)

### Input Widget
- `.bbq-input-label` - Label element
- `.bbq-input` - Text input element
- `.bbq-input::placeholder` - Placeholder text

### Toggle Widget
- `.bbq-toggle` - Label wrapper
- `.bbq-toggle input[type="checkbox"]` - Checkbox element

### File Upload Widget
- `.bbq-file-label` - Label element
- `.bbq-file` - File input element

### Card Widget
- `.bbq-card` - Card container
- `.bbq-card h3` - Card title
- `.bbq-card p` - Card description
- `.bbq-card img` - Card image
- `.bbq-card .bbq-button` - Card action button

### Unsupported Widget
- `.bbq-unsupported` - Unsupported widget message

## Customization

### Creating a Custom Theme

1. Copy an existing theme file as a starting point
2. Replace the color variables with your brand colors
3. Customize transition times, shadows, and spacing
4. Test with all widget types

### Example: Custom Theme

```css
/* Custom Brand Theme */
.bbq-button,
button.bbq-button {
    background-color: #your-brand-color;
    /* ... rest of styles ... */
}

.bbq-dropdown:focus,
.bbq-input:focus {
    border-color: #your-brand-color;
}

.bbq-card:hover {
    border-color: #your-brand-color;
}
```

### Using CSS Variables (Optional)

```css
:root {
    --bbq-primary-color: #3b82f6;
    --bbq-primary-hover: #2563eb;
    --bbq-primary-active: #1d4ed8;
    --bbq-text-color: #2c3e50;
    --bbq-border-color: #cbd5e1;
    --bbq-background-color: white;
}

.bbq-button {
    background-color: var(--bbq-primary-color);
}

.bbq-button:hover {
    background-color: var(--bbq-primary-hover);
}
```

## Responsive Design

All themes include responsive breakpoints:

- **Desktop** (769px+): Full-size widgets
- **Tablet** (641px - 768px): Optimized spacing
- **Mobile** (? 640px): Full-width buttons, larger text for touch

## Accessibility Features

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Focus states are clearly visible
- Tab order follows logical flow

### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
    /* All transitions disabled */
}
```

### Color Contrast
- Text: WCAG AA compliant contrast ratios
- Buttons: Sufficient color contrast for visibility
- Focus indicators: Clear and distinct

### Screen Readers
- Proper semantic HTML structure
- Labels associated with form inputs
- ARIA attributes where appropriate

## Performance Optimization

### Tips for Better Performance

1. **Minimize CSS**
   ```bash
   # Use a CSS minifier before deploying
   cssnano input.css -o output.min.css
   ```

2. **Load CSS Efficiently**
   - Inline critical CSS
   - Defer non-critical CSS
   - Use media queries for responsive CSS

3. **Optimize Images**
   - Compress card images
   - Use appropriate image formats
   - Implement lazy loading

## Browser Support

- **Chrome/Edge**: Full support (latest 2 versions)
- **Firefox**: Full support (latest 2 versions)
- **Safari**: Full support (latest 2 versions)
- **Mobile Browsers**: Full support (iOS Safari, Chrome Mobile)

### CSS Features Used

- Flexbox
- CSS Grid (card layouts)
- CSS Gradients
- CSS Transitions
- CSS Custom Properties (optional)
- Media Queries
- Pseudo-elements (::before, ::after)
- CSS Variables (optional)

## Extending the Themes

### Adding Dark Mode Toggle

```javascript
function toggleDarkMode() {
    document.documentElement.classList.toggle('dark-mode');
}

// CSS adjustment
.dark-mode .bbq-widget {
    color: #e2e8f0;
    /* Update all colors for dark mode */
}
```

### Theme Inheritance

```css
/* Base styles */
@import 'bbq-chat-light.css';

/* Override specific styles */
.bbq-button {
    border-radius: 8px; /* More rounded */
    font-weight: 700; /* Bolder text */
}
```

## File Structure

```
themes/
??? bbq-chat-light.css      /* Light theme */
??? bbq-chat-dark.css       /* Dark theme */
??? bbq-chat-corporate.css  /* Corporate theme */
??? README.md               /* This file */
```

## Common Customizations

### Change Button Color

```css
.bbq-button {
    background-color: #your-color;
}

.bbq-button:hover {
    background-color: #darker-shade;
}
```

### Adjust Border Radius

```css
.bbq-button,
.bbq-dropdown,
.bbq-input,
.bbq-file,
.bbq-card {
    border-radius: 8px; /* More rounded */
}
```

### Modify Spacing

```css
.bbq-button {
    padding: 12px 20px; /* Larger padding */
    margin: 10px 6px 10px 0; /* More space */
}
```

### Change Shadows

```css
.bbq-card {
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15); /* Stronger shadow */
}
```

## Troubleshooting

### Styles Not Applying

1. Verify CSS file path is correct
2. Check for CSS specificity conflicts
3. Ensure no CSS minification issues
4. Clear browser cache
5. Check browser console for errors

### Colors Look Different

1. Check device color profile
2. Verify no browser extensions affecting CSS
3. Ensure proper color space (sRGB)
4. Test in different browsers

### Responsive Issues

1. Verify viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1">`
2. Check media query breakpoints
3. Test on actual devices, not just emulation
4. Verify no fixed widths

## Theme Performance Metrics

| Theme | File Size | Gzip Size |
|-------|-----------|-----------|
| Light | ~8KB | ~2.5KB |
| Dark | ~8.5KB | ~2.7KB |
| Corporate | ~9KB | ~2.8KB |

## License

These CSS themes are part of the BbQ.ChatWidgets library and follow the same license.

## Support

For issues or questions about themes:
1. Check the troubleshooting section
2. Review browser console for errors
3. Test with a different theme
4. File an issue on GitHub

---

**Last Updated**: 2024
**Version**: 1.0
