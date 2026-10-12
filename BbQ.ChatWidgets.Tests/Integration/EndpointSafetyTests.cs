using System.Text;
using BbQ.ChatWidgets.Extensions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace BbQ.ChatWidgets.Tests.Integration;

public class EndpointSafetyTests
{
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
