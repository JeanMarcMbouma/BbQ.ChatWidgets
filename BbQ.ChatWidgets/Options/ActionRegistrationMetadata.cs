namespace BbQ.ChatWidgets.Options;

/// <summary>
/// Represents the metadata produced when an action is registered, linking
/// the action's name to the handler type responsible for executing it.
/// </summary>
/// <param name="ActionName">
/// The unique name of the action being registered.
/// </param>
/// <param name="HandlerType">
/// The concrete handler type that processes the action.
/// </param>
internal record ActionRegistrationMetadata(string ActionName, Type HandlerType);