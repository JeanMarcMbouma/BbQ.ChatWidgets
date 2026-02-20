using BbQ.ChatWidgets.Abstractions;
using System.Collections.Concurrent;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// In-memory implementation of <see cref="IThreadPersonaStore"/>.
/// </summary>
public sealed class DefaultThreadPersonaStore : IThreadPersonaStore
{
    private readonly ConcurrentDictionary<string, string> _personas = new();

    /// <inheritdoc />
    public string? GetPersona(string threadId)
    {
        if (_personas.TryGetValue(threadId, out var persona))
        {
            return persona;
        }

        return null;
    }

    /// <inheritdoc />
    public void SetPersona(string threadId, string persona)
    {
        _personas[threadId] = persona;
    }

    /// <inheritdoc />
    public void ClearPersona(string threadId)
    {
        _personas.TryRemove(threadId, out _);
    }
}
