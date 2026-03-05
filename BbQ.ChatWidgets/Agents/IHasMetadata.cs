namespace BbQ.ChatWidgets.Agents;

/// <summary>
/// Optional interface that agent response types may implement to expose arbitrary
/// key/value metadata to the <c>/api/chat/agent</c> HTTP endpoint.
/// </summary>
/// <remarks>
/// When the endpoint receives a <see cref="BbQ.ChatWidgets.Models.ChatTurn"/> that also
/// implements this interface, it includes the metadata in the JSON response so that
/// clients can display diagnostic information (e.g. intent classification, routed-agent name).
/// </remarks>
public interface IHasMetadata
{
    /// <summary>
    /// Gets the metadata associated with this response.
    /// </summary>
    IReadOnlyDictionary<string, object> Metadata { get; }
}
