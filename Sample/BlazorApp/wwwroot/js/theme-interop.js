// Theme interop helper for Blazor
export function applyThemeClass(themeName) {
    const htmlElement = document.documentElement;
    
    // Remove all theme classes
    htmlElement.classList.remove('theme-light', 'theme-dark', 'theme-corporate');
    
    // Add the new theme class
    if (themeName && themeName !== 'light') {
        htmlElement.classList.add(`theme-${themeName}`);
    }
    
    // Also update the body for nested styling
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-corporate');
    if (themeName && themeName !== 'light') {
        document.body.classList.add(`theme-${themeName}`);
    }
    
    // Save to localStorage for persistence
    try {
        localStorage.setItem('bbq-theme', themeName);
    } catch (e) {
        console.warn('Could not save theme to localStorage:', e);
    }
}

// Initialize theme on page load
export function initializeTheme() {
    try {
        const savedTheme = localStorage.getItem('bbq-theme');
        if (savedTheme) {
            applyThemeClass(savedTheme);
            return;
        }
    } catch (e) {
        console.warn('Could not read theme from localStorage:', e);
    }
    
    // Check for system preference for dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        applyThemeClass('dark');
        return;
    }
    
    // Default to light theme
    applyThemeClass('light');
}

// Initialize on module load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTheme);
} else {
    initializeTheme();
}
