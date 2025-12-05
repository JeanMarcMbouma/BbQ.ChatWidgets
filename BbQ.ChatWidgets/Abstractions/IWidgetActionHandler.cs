using BbQ.ChatWidgets.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BbQ.ChatWidgets.Abstractions;
public interface IWidgetActionHandler
{
    Task<ChatTurn> HandleAsync(
        string action,
        IReadOnlyDictionary<string, object?> payload,
        string threadId,
        CancellationToken ct = default
    );

}