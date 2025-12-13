using BbQ.ChatWidgets.Abstractions;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// Default implementation of <see cref="IWidgetActionMetadata"/>.
/// </summary>
/// <remarks>
/// This class stores metadata about widget actions, including their name, description,
/// payload schema, and the CLR type for deserialization. This metadata is used for:
/// - Registering actions in the action registry
/// - Deserializing action payloads to the correct type
/// - Providing documentation about available actions
/// </remarks>
public sealed class WidgetActionMetadata : IWidgetActionMetadata
{
    /// <summary>
    /// Gets the unique name of the widget action.
    /// </summary>
    /// <remarks>
    /// This name is used to identify the action when it is triggered by a widget interaction.
    /// Action names must be unique within the system.
    /// </remarks>
    public string Name { get; }

    /// <summary>
    /// Gets the human-readable description of what the action does.
    /// </summary>
    /// <remarks>
    /// This description can be used in documentation, UI, or for debugging purposes.
    /// </remarks>
    public string Description { get; }

    /// <summary>
    /// Gets the JSON schema describing the structure of the action's payload.
    /// </summary>
    /// <remarks>
    /// This schema can be in JSON Schema format and describes the expected structure
    /// of the data sent when the action is triggered. Used for validation and documentation.
    /// </remarks>
    public string PayloadSchema { get; }

    /// <summary>
    /// Gets the CLR type of the action payload.
    /// </summary>
    /// <remarks>
    /// Used to deserialize the payload JSON to the correct type before passing to the handler.
    /// </remarks>
    public Type PayloadType { get; }

    /// <summary>
    /// Initializes a new instance of the <see cref="WidgetActionMetadata"/> class.
    /// </summary>
    /// <remarks>
    /// All parameters except name are optional and will be set to empty string or object type if not provided.
    /// </remarks>
    /// <param name="name">The unique name of the action. Cannot be null or empty.</param>
    /// <param name="description">Optional human-readable description of the action.</param>
    /// <param name="payloadSchema">Optional JSON schema describing the payload structure.</param>
    /// <param name="payloadType">Optional CLR type of the payload for deserialization.</param>
    /// <exception cref="ArgumentException">Thrown if name is null, empty, or whitespace.</exception>
    public WidgetActionMetadata(string name, string description, string payloadSchema, Type payloadType)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name cannot be null or empty.", nameof(name));

        Name = name;
        Description = description ?? "";
        PayloadSchema = payloadSchema ?? "{}";
        PayloadType = payloadType ?? typeof(object);
    }
}
