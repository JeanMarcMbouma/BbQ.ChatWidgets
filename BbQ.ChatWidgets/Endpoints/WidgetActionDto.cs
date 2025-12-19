namespace BbQ.ChatWidgets.Endpoints;

/// <summary>
/// Data transfer object for user message requests.
/// </summary>
/// <param name="Message">The user's message text.</param>
/// <param name="ThreadId">Optional conversation thread ID.</param>
/// <remarks>
/// This DTO is used for the POST /api/chat/message endpoint.
/// It contains the user's message and optional conversation thread ID.
/// </remarks>
public sealed record UserMessageDto(
    string Message, 
    string? ThreadId);

/// <summary>
/// Data transfer object for widget action requests.
/// </summary>
/// <param name="ThreadId">The conversation thread ID.</param>
/// <param name="Action">The action identifier from the widget.</param>
/// <param name="Payload">Optional payload data associated with the action.</param>
/// <remarks>
/// This DTO is used for the POST /api/chat/action endpoint.
/// It contains the action identifier, optional payload data, and conversation thread ID.
/// </remarks>
public sealed record WidgetActionDto(
    string Action, 
    Dictionary<string, object?>? Payload,
    string ThreadId);