using Microsoft.AspNetCore.Http;
using System.Threading;
using System.Threading.Tasks;

namespace BbQ.ChatWidgets.Abstractions
{
    public interface IWidgetSseService
    {
        /// <summary>
        /// Subscribe the current HTTP context to a named stream; this method completes
        /// when the connection is closed.
        /// </summary>
        Task SubscribeAsync(string streamId, HttpContext context, CancellationToken ct = default);

        /// <summary>
        /// Publish a JSON-serializable message to a named stream. If the stream has no
        /// subscribers it will be created implicitly.
        /// </summary>
        Task PublishAsync(string streamId, object message);
    }
}
