namespace BbQ.ChatWidgets.Abstractions
{
    /// <summary>
    /// Provides localization support for widget text and labels.
    /// </summary>
    /// <remarks>
    /// Implement this interface to support multiple languages and locales for widget content.
    /// The localizer translates keys to localized strings based on the current culture.
    ///
    /// Common use cases:
    /// - Translating button labels to different languages
    /// - Localizing error messages
    /// - Supporting user-preferred language for widget text
    /// - Regional customization of widget content
    ///
    /// Example implementation:
    /// <code>
    /// public class ResourceFileLocalizer : IWidgetLocalizer
    /// {
    ///     public string Localize(string key, string defaultValue)
    ///     {
    ///         var culture = CultureInfo.CurrentCulture;
    ///         var resourceSet = ResourceManager.GetResourceSet(culture, true, true);
    ///         var value = resourceSet?.GetString(key);
    ///         return value ?? defaultValue;
    ///     }
    /// }
    /// </code>
    /// </remarks>
    public interface IWidgetLocalizer
    {
        /// <summary>
        /// Localizes a key to a string in the current culture.
        /// </summary>
        /// <remarks>
        /// This method looks up a localization key and returns the translated string.
        /// If the key is not found or localization fails, the default value is returned.
        ///
        /// Implementations should handle:
        /// - Missing keys (return default value)
        /// - Missing cultures (fall back to default language)
        /// - Invalid resource sources (return default value)
        /// </remarks>
        /// <param name="key">The localization key to look up (e.g., "button.submit", "error.invalid_input").</param>
        /// <param name="defaultValue">The default value to return if localization fails or key not found.</param>
        /// <returns>The localized string if found, otherwise the default value.</returns>
        string Localize(string key, string defaultValue);
    }
}