namespace BbQ.ChatWidgets.Abstractions;

/// <summary>
/// Stores per-thread AI persona overrides.
/// </summary>
/// <remarks>
/// This abstraction allows runtime persona selection to persist for a conversation
/// thread without changing the <see cref="IThreadService"/> contract.
/// </remarks>
public interface IThreadPersonaStore
{
    /// <summary>
    /// Gets the persona override for a thread.
    /// </summary>
    /// <param name="threadId">The conversation thread identifier.</param>
    /// <returns>The stored persona, or null if none is set.</returns>
    string? GetPersona(string threadId);

    /// <summary>
    /// Sets the persona override for a thread.
    /// </summary>
    /// <param name="threadId">The conversation thread identifier.</param>
    /// <param name="persona">The persona text to store.</param>
    void SetPersona(string threadId, string persona);

    /// <summary>
    /// Removes the persona override for a thread.
    /// </summary>
    /// <param name="threadId">The conversation thread identifier.</param>
    void ClearPersona(string threadId);
}
