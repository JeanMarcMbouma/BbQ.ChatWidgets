namespace BbQ.ChatWidgets.Models;

/// <summary>
/// Represents a structured response from the AI chat client with content and optional widgets.
/// </summary>
/// <remarks>
/// This record is used as the generic type parameter when calling the AI chat client:
/// <c>chat.GetResponseAsync&lt;BbQStructuredResponse&gt;(...)</c>
/// 
/// It encapsulates:
/// - <c>Content</c>: The text response from the AI
/// - <c>Widgets</c>: Optional pre-parsed widget definitions embedded in the response
/// 
/// The structured response format allows the AI client to return both text and structured data,
/// enabling rich interactive responses.
/// </remarks>
public sealed record BbQStructuredResponse(
    /// <summary>
    /// The text content of the AI's response.
    /// </summary>
    string Content, 
    
    /// <summary>
    /// Optional list of widget definitions extracted from the response.
    /// </summary>
    List<ChatWidget>? Widgets = null);