using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Abstractions;

public interface IThreadService
{
    void DeleteThread(string threadId);
    string CreateThread();
    bool ThreadExists(string threadId);
    ChatMessage AppendMessageToThread(string threadId, ChatTurn chatTurn);
    ChatMessage GetMessage(string threadId);
}