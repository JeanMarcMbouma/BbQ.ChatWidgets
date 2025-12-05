using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Models;
using System.Collections.Concurrent;

namespace BbQ.ChatWidgets.Services;

public sealed class DefaultThreadService : IThreadService
{
    private readonly ConcurrentDictionary<string, ChatMessages> _threads = new();
    public ChatMessages AppendMessageToThread(string threadId, ChatTurn chatTurn)
    {
        if (_threads.TryGetValue(threadId, out var chatMessage))
        {
            _threads[threadId] = new ChatMessages([..chatMessage.Turns.Append(chatTurn)]);
            return _threads[threadId];
        }
        else
        {
            throw new KeyNotFoundException($"Thread with ID '{threadId}' not found.");
        }
    }

    public string CreateThread()
    {
        string threadId = Guid.NewGuid().ToString("N");
        _threads[threadId] = new ChatMessages([]);
        return threadId;
    }

    public void DeleteThread(string threadId)
    {
        _threads.TryRemove(threadId, out _);
    }

    public ChatMessages GetMessage(string threadId)
    {
        if (_threads.TryGetValue(threadId, out var chatMessage))
        {
            return chatMessage;
        }

        throw new KeyNotFoundException($"Thread with ID '{threadId}' not found.");
    }

    public bool ThreadExists(string threadId)
    {
        return _threads.ContainsKey(threadId);
    }
}