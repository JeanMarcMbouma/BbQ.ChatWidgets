namespace BbQ.ChatWidgets.Endpoints;

/// <summary>
/// Data transfer object for user message requests.
/// </summary>
/// <remarks>
/// This DTO is used for the POST /api/chat/message endpoint.
/// It contains the user's message and optional conversation thread ID.
/// </remarks>
public sealed record UserMessageDto(
    /// <summary>
    /// The message text from the user.
    /// </summary>
    string Message, 

    /// <summary>
    /// Optional conversation thread ID. If null, a new thread is created.
    /// </summary>
    string? ThreadId);

/// <summary>
/// Data transfer object for widget action requests.
/// </summary>
/// <remarks>
/// This DTO is used for the POST /api/chat/action endpoint.
/// It contains the action identifier, optional payload data, and conversation thread ID.
/// </remarks>
public sealed record WidgetActionDto(
    /// <summary>
    /// The action identifier from the widget (e.g., "submit", "delete", "select_option").
    /// </summary>
    string Action, 

    /// <summary>
    /// Optional payload data associated with the action (e.g., form values, selected options).
    /// Dictionary keys are parameter names, values are the data.
    /// </summary>
    Dictionary<string, object?>? Payload, 

    /// <summary>
    /// The conversation thread ID for maintaining context across turns.
    /// </summary>
    string ThreadId);