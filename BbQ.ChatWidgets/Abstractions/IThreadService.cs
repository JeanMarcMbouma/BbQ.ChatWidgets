using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Abstractions;

public interface IThreadService
{
    void DeleteThread(string threadId);
    string CreateThread();
    bool ThreadExists(string threadId);
    ChatMessages AppendMessageToThread(string threadId, ChatTurn chatTurn);
    ChatMessages GetMessage(string threadId);
}