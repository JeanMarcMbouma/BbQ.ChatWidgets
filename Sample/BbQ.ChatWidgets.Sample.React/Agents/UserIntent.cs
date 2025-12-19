namespace BbQ.ChatWidgets.Sample.WebApp.Agents;

/// <summary>
/// User intent categories for request classification.
/// </summary>
/// <remarks>
/// These categories represent the different types of user requests that can be
/// automatically classified and routed to specialized agents.
/// </remarks>
public enum UserIntent
{
    /// <summary>
    /// User is requesting help or support.
    /// </summary>
    HelpRequest,

    /// <summary>
    /// User is asking for information or data.
    /// </summary>
    DataQuery,

    /// <summary>
    /// User is requesting an action to be performed.
    /// </summary>
    ActionRequest,

    /// <summary>
    /// User is providing feedback or suggestions.
    /// </summary>
    Feedback,

    /// <summary>
    /// Intent could not be determined.
    /// </summary>
    Unknown
}
