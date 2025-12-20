namespace BbQ.ChatWidgets.Abstractions;

/// <summary>
/// Interface for widgets that need to perform cleanup or resource deallocation.
/// </summary>
/// <remarks>
/// Implement this interface on custom widgets that manage resources (file handles, connections, etc.)
/// or need to perform cleanup operations after being added to the conversation history.
///
/// The <see cref="Recycle"/> method is called after a widget is appended to a thread,
/// allowing it to perform cleanup such as:
/// - Closing file handles
/// - Closing database connections
/// - Releasing temporary resources
/// - Performing audit logging
/// - Triggering cleanup routines
///
/// Example usage:
/// <code>
/// public record MyCustomWidget(string Label, string Action) 
///     : ChatWidget(Label, Action), IRecyclableWidget
/// {
///     private readonly IResourceManager _resourceManager = null;
///
///     public void Recycle()
///     {
///         _resourceManager?.CleanupResources();
///     }
/// }
/// </code>
/// </remarks>
public interface IRecyclableWidget
{
    /// <summary>
    /// Performs cleanup or resource deallocation for this widget.
    /// </summary>
    /// <remarks>
    /// This method is called by the thread service after the widget is appended to a thread's history.
    /// Implement this to perform any necessary cleanup operations.
    /// 
    /// Implementations should:
    /// - Not throw exceptions (log instead)
    /// - Complete quickly (don't do heavy processing)
    /// - Be idempotent (safe to call multiple times)
    /// </remarks>
    void Recycle();
}
