namespace BbQ.ChatWidgets.Agents.Abstractions;

/// <summary>
/// Interface for classifying input into predefined categories.
/// </summary>
/// <remarks>
/// Classifiers are used to categorize user input or messages into specific enum-based categories.
/// This is useful for:
/// - Routing requests to appropriate handlers
/// - Intent detection
/// - Message categorization
/// - Request classification
///
/// Example usage:
/// <code>
/// public enum UserIntent
/// {
///     Hello,
///     Help,
///     Delete,
///     Search
/// }
///
/// public class IntentClassifier : IClassifier&lt;UserIntent&gt;
/// {
///     public async Task&lt;UserIntent&gt; ClassifyAsync(string input, CancellationToken ct)
///     {
///         // Use AI or rules to classify the input
///         return UserIntent.Hello;
///     }
/// }
/// </code>
/// </remarks>
/// <typeparam name="TCategory">The enum type representing possible categories.</typeparam>
public interface IClassifier<TCategory> where TCategory : Enum
{
    /// <summary>
    /// Classifies the given input text into one of the specified categories.
    /// </summary>
    /// <remarks>
    /// Implementations should analyze the input and determine which category it belongs to.
    /// This could use:
    /// - AI/LLM-based classification
    /// - Rule-based classification
    /// - Machine learning models
    /// - Pattern matching
    /// </remarks>
    /// <param name="input">The text input to classify.</param>
    /// <param name="ct">Token to cancel the async operation.</param>
    /// <returns>The category that best matches the input.</returns>
    Task<TCategory> ClassifyAsync(string input, CancellationToken ct = default);
}
