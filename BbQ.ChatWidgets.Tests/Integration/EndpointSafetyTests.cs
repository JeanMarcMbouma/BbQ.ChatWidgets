using System.Text;
using System.Text.Json;
using Microsoft.Extensions.AI;
using BbQ.ChatWidgets.Extensions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace BbQ.ChatWidgets.Tests.Integration;

public class EndpointSafetyTests
{
    [Fact]
    public async Task Streaming_PreservesDeltaFlagWhitespaceAndSplitWidgetMarkup()
    {
        using var provider = CreateServices(options =>
        {
            options.ChatClientFactory = _ => new StreamingClient();
            options.WidgetGenerationMode = BbQ.ChatWidgets.Options.WidgetGenerationMode.EmbeddedMarkupLegacy;
        });
        var context = CreateContext(provider, "/api/chat/stream/message", "{\"message\":\"Hello\"}");
        await CreatePipeline(provider)(context);
        context.Response.Body.Position = 0;
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var turns = body.Split('\n').Where(line => line.StartsWith("data: "))
            .Select(line => JsonDocument.Parse(line[6..]).RootElement.Clone()).ToArray();

        Assert.True(turns[0].GetProperty("isDelta").GetBoolean());
        Assert.Equal("Hello world", turns[^1].GetProperty("content").GetString());
        Assert.Single(turns[^1].GetProperty("widgets").EnumerateArray());
        Assert.Equal("button", turns[^1].GetProperty("widgets")[0].GetProperty("type").GetString());
    }

    private sealed class StreamingClient : IChatClient
    {
        public void Dispose() { }
        public object? GetService(Type type, object? key = null) => null;
        public Task<ChatResponse> GetResponseAsync(IEnumerable<ChatMessage> messages, ChatOptions? options = null, CancellationToken cancellationToken = default)
            => throw new NotSupportedException();
        public async IAsyncEnumerable<ChatResponseUpdate> GetStreamingResponseAsync(
            IEnumerable<ChatMessage> messages, ChatOptions? options = null,
            [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            foreach (var text in new[] { "Hello", " ", "world", " <wid", "get>{\"type\":\"button\",\"label\":\"Go\",\"action\":\"go\"}</widget>", " " })
            {
                yield return new ChatResponseUpdate(ChatRole.Assistant, text);
                await Task.Yield();
            }
        }
    }

    [Theory]
    [InlineData("/api/chat/message")]
    [InlineData("/api/chat/action")]
    [InlineData("/api/chat/widgets/streams/demo/events")]
    public async Task InvalidJson_ReturnsBadRequest(string path)
    {
        using var provider = CreateServices();
        var context = CreateContext(provider, path, "{");
        await CreatePipeline(provider)(context);
        Assert.Equal(StatusCodes.Status400BadRequest, context.Response.StatusCode);
        Assert.Equal("application/json", context.Response.ContentType);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task OversizedBody_IsRejectedWithOrWithoutContentLength(bool includeLength)
    {
        using var provider = CreateServices(options => options.MaxRequestBodyBytes = 16);
        var context = CreateContext(provider, "/api/chat/message", new string('a', 32));
        if (includeLength) context.Request.ContentLength = 32;
        await CreatePipeline(provider)(context);
        Assert.Equal(StatusCodes.Status413PayloadTooLarge, context.Response.StatusCode);
    }

    [Theory]
    [InlineData("POST", "/api/chat/message")]
    [InlineData("POST", "/api/chat/action")]
    [InlineData("POST", "/api/chat/agent")]
    [InlineData("POST", "/api/chat/stream/message")]
    [InlineData("POST", "/api/chat/widgets/streams/demo/events")]
    [InlineData("GET", "/api/chat/widgets/streams/demo/events")]
    public async Task AuthorizationGate_BlocksEveryEndpointBeforeReadingBody(string method, string path)
    {
        using var provider = CreateServices(options => options.AuthorizeRequestAsync = (_, _) => ValueTask.FromResult(false));
        var context = CreateContext(provider, path, "{");
        context.Request.Method = method;
        await CreatePipeline(provider)(context);
        Assert.Equal(StatusCodes.Status403Forbidden, context.Response.StatusCode);
        Assert.Equal(0, context.Request.Body.Position);
    }

    private static ServiceProvider CreateServices(Action<BbQChatOptions>? configure = null)
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddBbQChatWidgets(configure);
        return services.BuildServiceProvider();
    }

    private static RequestDelegate CreatePipeline(IServiceProvider provider)
    {
        var app = new ApplicationBuilder(provider);
        app.MapBbQChatEndpoints();
        return app.Build();
    }

    private static DefaultHttpContext CreateContext(IServiceProvider provider, string path, string body)
    {
        var context = new DefaultHttpContext { RequestServices = provider };
        context.Request.Method = "POST";
        context.Request.Path = path;
        context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(body));
        context.Response.Body = new MemoryStream();
        return context;
    }
}
