// Theme switcher JavaScript interop for BbQ Chat Widgets
// Handles dynamic switching between available themes

const themeMap = {
    'light': '_content/BbQ.ChatWidgets.Blazor/themes/bbq-chat-light.css',
    'dark': '_content/BbQ.ChatWidgets.Blazor/themes/bbq-chat-dark.css',
    'corporate': '_content/BbQ.ChatWidgets.Blazor/themes/bbq-chat-corporate.css'
};

export function switchTheme(themeName) {
    const themeUrl = themeMap[themeName];
    
    if (!themeUrl) {
        console.error(`Theme "${themeName}" not found. Available themes: ${Object.keys(themeMap).join(', ')}`);
        return;
    }

    // Find existing theme link or create a new one
    let themeLink = document.getElementById('bbq-theme-link');
    
    if (!themeLink) {
        themeLink = document.createElement('link');
        themeLink.id = 'bbq-theme-link';
        themeLink.rel = 'stylesheet';
        themeLink.type = 'text/css';
        document.head.appendChild(themeLink);
    }

    // For theme switching, we need to handle CSS caching and ensure it reloads
    // Add a cache-busting query parameter
    const cacheBuster = new Date().getTime();
    const urlWithCacheBuster = themeUrl + '?t=' + cacheBuster;
    
    // Update the href to load the new theme
    themeLink.href = urlWithCacheBuster;

    // Wait for CSS to load before updating classes
    themeLink.onload = function() {
        updateThemeClasses(themeName);
    };
    
    // Also update immediately for browsers that may not trigger onload for stylesheets
    updateThemeClasses(themeName);

    // Store the selected theme in localStorage for persistence
    try {
        localStorage.setItem('bbq-theme', themeName);
    } catch (e) {
        console.warn('Could not save theme preference to localStorage:', e);
    }
}

function updateThemeClasses(themeName) {
    // Update document class for additional styling
    document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-corporate');
    document.documentElement.classList.add(`theme-${themeName}`);
    
    // Also update the body for nested component styling
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-corporate');
    document.body.classList.add(`theme-${themeName}`);
    
    // Trigger a resize event to notify any components listening for layout changes
    window.dispatchEvent(new Event('resize'));
    
    // Dispatch a custom event for theme change
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: themeName } }));
}

export function initializeTheme() {
    // Try to restore theme from localStorage
    try {
        const savedTheme = localStorage.getItem('bbq-theme');
        if (savedTheme && themeMap[savedTheme]) {
            switchTheme(savedTheme);
            return;
        }
    } catch (e) {
        console.warn('Could not restore theme from localStorage:', e);
    }

    // Check for system preference for dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        switchTheme('dark');
        return;
    }

    // Default to light theme
    switchTheme('light');
}

// Initialize theme on module load
initializeTheme();

// Also watch for system theme preference changes
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        // Only auto-switch if user hasn't set a preference
        try {
            const savedTheme = localStorage.getItem('bbq-theme');
            if (!savedTheme) {
                switchTheme(e.matches ? 'dark' : 'light');
            }
        } catch (e) {
            console.warn('Could not check saved theme:', e);
        }
    });
}
