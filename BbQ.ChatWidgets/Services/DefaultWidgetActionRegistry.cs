using BbQ.ChatWidgets.Abstractions;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// Default implementation of <see cref="IWidgetActionRegistry"/>.
/// </summary>
internal class DefaultWidgetActionRegistry : IWidgetActionRegistry
{
    private readonly Dictionary<string, IWidgetActionMetadata> _actions = [];

    public IEnumerable<IWidgetActionMetadata> GetActions() => _actions.Values;

    public IWidgetActionMetadata? GetAction(string actionName)
    {
        _actions.TryGetValue(actionName, out var action);
        return action;
    }

    public void RegisterAction(IWidgetActionMetadata action)
    {
        if (string.IsNullOrWhiteSpace(action.Name))
            throw new ArgumentException("Action name cannot be null or empty.", nameof(action));

        _actions[action.Name] = action;
    }
}
