namespace BbQ.ChatWidgets.Blazor.Services;

/// <summary>
/// Service for managing BbQ Chat Widgets themes.
/// </summary>
public interface IThemeService
{
    /// <summary>
    /// Gets the available themes.
    /// </summary>
    IReadOnlyList<string> AvailableThemes { get; }

    /// <summary>
    /// Gets the current active theme.
    /// </summary>
    string CurrentTheme { get; }

    /// <summary>
    /// Sets the active theme.
    /// </summary>
    /// <param name="themeName">The name of the theme to activate (e.g., "light", "dark", "corporate").</param>
    Task SetThemeAsync(string themeName);
}

/// <summary>
/// Default implementation of the theme service.
/// </summary>
public class DefaultThemeService : IThemeService
{
    private static readonly IReadOnlyList<string> AvailableThemesCore = new[] { "light", "dark", "corporate" };
    private string _currentTheme = "light";

    /// <inheritdoc />
    public IReadOnlyList<string> AvailableThemes => AvailableThemesCore;

    /// <inheritdoc />
    public string CurrentTheme => _currentTheme;

    /// <inheritdoc />
    public Task SetThemeAsync(string themeName)
    {
        if (!AvailableThemesCore.Contains(themeName, StringComparer.OrdinalIgnoreCase))
        {
            throw new ArgumentException($"Theme '{themeName}' is not available. Available themes: {string.Join(", ", AvailableThemesCore)}", nameof(themeName));
        }

        _currentTheme = themeName.ToLower();
        return Task.CompletedTask;
    }
}
