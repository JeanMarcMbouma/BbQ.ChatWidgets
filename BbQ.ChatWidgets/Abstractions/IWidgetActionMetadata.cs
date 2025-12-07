namespace BbQ.ChatWidgets.Abstractions;

/// <summary>
/// Metadata for a widget action.
/// </summary>
public interface IWidgetActionMetadata
{
    /// <summary>
    /// Gets the unique name of the action (e.g., "submit_form").
    /// </summary>
    string Name { get; }

    /// <summary>
    /// Gets a human-readable description of the action.
    /// </summary>
    string Description { get; }

    /// <summary>
    /// Gets the JSON schema for the payload type.
    /// </summary>
    string PayloadSchema { get; }

    /// <summary>
    /// Gets the payload type for deserialization.
    /// </summary>
    Type PayloadType { get; }
}
