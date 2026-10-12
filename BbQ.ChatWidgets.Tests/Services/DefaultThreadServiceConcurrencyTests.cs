using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Services;
using Microsoft.Extensions.AI;
using Xunit;

namespace BbQ.ChatWidgets.Tests.Services;

public class DefaultThreadServiceConcurrencyTests
{
    [Fact]
    public void ConcurrentAppendsPreserveEveryTurn()
    {
        var service = new DefaultThreadService();
        var threadId = service.CreateThread();

        Parallel.For(0, 500, index => service.AppendMessageToThread(
            threadId, new ChatTurn(ChatRole.User, index.ToString())));

        var turns = service.GetMessage(threadId).Turns;
        Assert.Equal(500, turns.Count);
        Assert.Equal(500, turns.Select(turn => turn.Content).Distinct().Count());
    }
}
