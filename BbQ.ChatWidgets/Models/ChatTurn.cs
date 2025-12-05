using Microsoft.Extensions.AI;

namespace BbQ.ChatWidgets.Models;

/// <summary>
/// Represents a single turn in a chat conversation.
/// </summary>
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
    /// <summary>
    /// The role of the message sender (User or Assistant).
    /// </summary>
    ChatRole Role,
    
    /// <summary>
    /// The text content of this turn's message.
    /// </summary>
    string Content,
    
    /// <summary>
    /// Optional interactive widgets embedded in this turn's content.
    /// </summary>
    IReadOnlyList<ChatWidget>? Widgets = null,
    
    /// <summary>
    /// The conversation thread ID this turn belongs to.
    /// </summary>
    string ThreadId = ""
);
