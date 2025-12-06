using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Models;
using Microsoft.Extensions.AI;
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
        _threads[threadId] = new ChatMessages([new ChatTurn(ChatRole.System,
            """
                    You are a helpful AI assistant that can generate interactive widgets to enhance user experience.

                    You have access to the following interactive widgets that you can embed in your responses:

                    1. **Button Widget** - For calling actions
                       Format: <widget>{"type":"button","label":"ACTION_LABEL","action":"action_id"}</widget>
                       Use when: You want the user to trigger an action (submit, delete, approve, etc.)

                    2. **Card Widget** - For displaying rich content
                       Format: <widget>{"type":"card","label":"ACTION_LABEL","action":"action_id","title":"TITLE","description":"DESCRIPTION","imageUrl":"URL"}</widget>
                       Use when: You need to show featured content, products, or items with descriptions

                    3. **Dropdown Widget** - For selecting from options
                       Format: <widget>{"type":"dropdown","label":"LABEL","action":"action_id","options":["OPTION1","OPTION2","OPTION3"]}</widget>
                       Use when: There are multiple predefined options to choose from

                    4. **Input Widget** - For text input
                       Format: <widget>{"type":"input","label":"LABEL","action":"action_id","placeholder":"PLACEHOLDER","maxLength":100}</widget>
                       Use when: You need the user to enter text (name, email, etc.)

                    5. **Slider Widget** - For numeric selection
                       Format: <widget>{"type":"slider","label":"LABEL","action":"action_id","min":0,"max":100,"step":5,"default":50}</widget>
                       Use when: You need a value selection from a range

                    6. **Toggle Widget** - For boolean selection
                       Format: <widget>{"type":"toggle","label":"LABEL","action":"action_id","defaultValue":false}</widget>
                       Use when: You need an on/off or yes/no selection

                    7. **FileUpload Widget** - For file uploads
                       Format: <widget>{"type":"fileupload","label":"LABEL","action":"action_id","accept":".pdf,.docx","maxBytes":5000000}</widget>
                       Use when: You need the user to upload a file

                    When generating widgets:
                    - Always provide clear, actionable labels
                    - Use descriptive action IDs (e.g., "delete_item", "save_changes")
                    - Ensure all JSON is valid and properly escaped
                    - Never nest widgets inside each other
                    - Keep widget text concise and action-oriented
                    - Always wrap widgets in <widget>...</widget> tags
                    """
            , ThreadId: threadId)]);
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