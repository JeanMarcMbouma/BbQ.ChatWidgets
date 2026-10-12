using Microsoft.Extensions.AI;

namespace BbQ.ChatWidgets.Models;


/// <summary>
/// Represents a single turn in a chat conversation.
/// </summary>
/// <param name="ThreadId">The conversation thread ID this turn belongs to.</param>
/// <param name="Content">The text content of this turn's message.</param>
/// <param name="Role">The role of the message sender (User or Assistant).</param>
/// <param name="Widgets">Optional interactive widgets embedded in this turn's content.</param>
/// <remarks>
/// A chat turn encapsulates a message in the conversation, either from the user or the assistant.
/// It includes:
/// - The role (who sent the message: User or Assistant)
/// - The content (the text of the message)
/// - Optional widgets (interactive UI elements embedded in the response)
/// - The thread ID (for tracking multi-turn conversations)
/// 
/// Chat turns are immutable records that form the history of a conversation thread.
/// </remarks>
public record ChatTurn(
    ChatRole Role,
    string Content,
    IReadOnlyList<ChatWidget>? Widgets = null,
    string ThreadId = ""
)
{
    /// <summary>Strict-mode widget outcome, independent of the model's prose.</summary>
    [System.Text.Json.Serialization.JsonIgnore(Condition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull)]
    public WidgetGenerationOutcome? WidgetGeneration { get; init; }
}

/// <summary>Actual widget outcome: emitted, none, rejected, or not_called.</summary>
public sealed record WidgetGenerationOutcome(string Status, IReadOnlyList<WidgetValidationDiagnostic>? Diagnostics = null);


/// <summary>
/// Represents a single turn in a chat conversation with an additional delta flag.
/// </summary>
/// <param name="Role">The role of the message sender (User or Assistant).</param>
/// <param name="Content">The text content of this turn's message.</param>
/// <param name="ThreadId">The conversation thread ID this turn belongs to.</param>
/// <param name="IsDelta">Indicates whether the response is a delta (partial update) or a complete message.</param>
/// <inheritdoc cref="ChatTurn"/>
public record StreamChatTurn(
    ChatRole Role,
    string Content,
    string ThreadId,
    bool IsDelta = false) : ChatTurn(Role, Content, [], ThreadId);
