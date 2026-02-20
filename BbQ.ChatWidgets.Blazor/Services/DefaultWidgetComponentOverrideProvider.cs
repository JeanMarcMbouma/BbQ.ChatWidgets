using BbQ.ChatWidgets.Blazor.Components;
using Microsoft.Extensions.Options;

namespace BbQ.ChatWidgets.Blazor.Services;

internal sealed class DefaultWidgetComponentOverrideProvider(IOptions<WidgetComponentOverrideOptions> options) : IWidgetComponentOverrideProvider
{
    private readonly IReadOnlyList<WidgetComponentOverride> _overrides = options.Value.Overrides.ToArray();

    public IReadOnlyList<WidgetComponentOverride> GetOverrides() => _overrides;
}
