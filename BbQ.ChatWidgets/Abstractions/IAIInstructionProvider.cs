namespace BbQ.ChatWidgets.Abstractions;

/// <summary>
/// Provides system instructions for the AI chat client.
/// </summary>
/// <remarks>
/// System instructions guide the behavior of the AI model by:
/// - Defining the AI's role and personality
/// - Explaining available tools and widgets
/// - Providing guidelines for response generation
/// - Specifying constraints or requirements
///
/// Implementations can provide static instructions, dynamic instructions based on context,
/// or instructions that change based on configuration.
///
/// The default implementation generates instructions that:
/// - Describe all available widgets
/// - List registered actions
/// - Provide widget formatting guidelines
/// - Explain best practices for widget usage
///
/// Example custom implementation:
/// <code>
/// public class CustomInstructionProvider : IAIInstructionProvider
/// {
///     public string? GetInstructions()
///     {
///         return @"You are a helpful customer service assistant.
///                 You have access to order management tools and can create widgets
///                 for order status, refunds, and shipment tracking.
///                 Always be professional and helpful.";
///     }
/// }
/// </code>
/// </remarks>
public interface IAIInstructionProvider
{
    /// <summary>
    /// Gets the system instructions for the AI chat client.
    /// </summary>
    /// <remarks>
    /// This method is called before sending messages to the AI, allowing the instructions
    /// to be dynamic based on current state. The instructions are passed to the chat client
    /// in the ChatOptions.Instructions property.
    ///
    /// The instruction string can include:
    /// - Role description
    /// - Tool and widget documentation
    /// - Guidelines and constraints
    /// - Examples of desired behavior
    /// - Format specifications for responses
    ///
    /// Returning null or empty string means no special instructions are provided,
    /// and the AI client will use its default behavior.
    /// </remarks>
    /// <returns>System instructions for the AI, or null if none are needed.</returns>
    string? GetInstructions();
}