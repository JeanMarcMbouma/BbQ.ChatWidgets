using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// Options for configuring the widget registry via dependency injection.
/// </summary>
/// <remarks>
/// Use <see cref="Extensions.WidgetServiceCollectionExtensions.AddWidget{TWidget}"/> to populate
/// these options by registering widgets as factory functions resolved from the DI container.
/// </remarks>
public sealed class WidgetRegistryOptions
{
    /// <summary>
    /// Gets the list of registered widget factories.
    /// </summary>
    /// <remarks>
    /// Each entry contains a type identifier and a factory function that creates the widget instance
    /// using the provided <see cref="IServiceProvider"/>. These widgets are applied to the
    /// widget registry during service initialization.
    /// </remarks>
    public List<(string TypeId, Func<IServiceProvider, ChatWidget> Factory)> Widgets { get; } = [];
}
