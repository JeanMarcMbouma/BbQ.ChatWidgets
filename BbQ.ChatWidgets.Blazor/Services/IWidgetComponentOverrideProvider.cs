using BbQ.ChatWidgets.Blazor.Components;

namespace BbQ.ChatWidgets.Blazor.Services;

/// <summary>
/// Provides globally registered widget component overrides for Blazor rendering.
/// </summary>
public interface IWidgetComponentOverrideProvider
{
    /// <summary>
    /// Gets all globally registered widget component overrides.
    /// </summary>
    IReadOnlyList<WidgetComponentOverride> GetOverrides();
}
