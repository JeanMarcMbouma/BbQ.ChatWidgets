using System.Text.Json;
using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Agents;
using BbQ.ChatWidgets.Agents.Abstractions;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Options;
using BbQ.ChatWidgets.Services;
using BbQ.MockLite;
using Microsoft.Extensions.AI;
using Xunit;

namespace BbQ.ChatWidgets.Tests.Services;

/// <summary>
/// Tests for ChatWidgetService message processing and widget integration.
/// </summary>
public class ChatWidgetServiceTests
{
    private readonly MockChatClient mockChat = new();
    private readonly Mock<IWidgetHintParser> mockWidgetHintParser = new();
    private readonly Mock<IWidgetHintSanitizer> mockWidgetHintSanitizer = new();
    private readonly Mock<IWidgetToolsProvider> mockToolsProvider = new();
    private readonly Mock<IAIToolsProvider> mockAIToolsProvider = new();
    private readonly Mock<IThreadService> mockThreadService = new();
    private readonly Mock<IThreadPersonaStore> mockThreadPersonaStore = new();
    private readonly Mock<IAIInstructionProvider> mockAIInstructionsProvider = new();
    private readonly Mock<IWidgetActionRegistry> mockActionRegistry = new();
    private readonly Mock<IWidgetActionHandlerResolver> mockHandlerResolver = new();
    private readonly Mock<IChatHistorySummarizer> mockHistorySummarizer = new();
    private readonly Mock<IAgentEventDispatcher> mockEventDispatcher = new();
    private readonly BbQChatOptions options = new() { WidgetGenerationMode = WidgetGenerationMode.EmbeddedMarkupLegacy };

    private readonly ChatWidgetService chatWidgetService;

    public ChatWidgetServiceTests()
    {
        mockEventDispatcher.Setup(d => d.DispatchAsync(It.IsAny<AgentEvent>(), It.IsAny<CancellationToken>()), () => Task.CompletedTask);
        chatWidgetService = CreateService();
    }

    private ChatWidgetService CreateService(IWidgetSchemaCatalogue? catalogue = null, IThreadService? threads = null) => new(
            mockChat,
            mockWidgetHintParser.Object,
            mockWidgetHintSanitizer.Object,
            mockToolsProvider.Object,
            mockAIToolsProvider.Object,
            threads ?? mockThreadService.Object,
            mockThreadPersonaStore.Object,
            mockAIInstructionsProvider.Object,
            mockActionRegistry.Object,
            mockHandlerResolver.Object,
            mockHistorySummarizer.Object,
            mockEventDispatcher.Object,
            options,
            catalogue);

    private void SetupBasicConversationFlow()
    {
        mockThreadService.Setup(ts => ts.ThreadExists(It.IsAny<string>()), () => true);
        mockThreadService
            .Setup(ts => ts.AppendMessageToThread(It.IsAny<string>(), It.IsAny<ChatTurn>()), () => new ChatMessages([new ChatTurn(ChatRole.User, "Hello")]));

        mockToolsProvider.Setup(tp => tp.GetTools(), () => []);
        mockAIToolsProvider.Setup(tp => tp.GetAITools(), () => []);
        mockThreadPersonaStore.Setup(ps => ps.GetPersona(It.IsAny<string>()), () => null);
        mockAIInstructionsProvider.Setup(ip => ip.GetInstructions(), () => "Base instructions");
    }

    [Fact]
    public async Task RespondAsync_CreatesThreadIfNotExists()
    {
        // Arrange

        mockThreadService.Setup(ts => ts.ThreadExists(It.IsAny<string>()), () => false);
        mockThreadService.Setup(ts => ts.CreateThread(), () => "thread-123");
        mockThreadService
            .Setup(ts => ts.AppendMessageToThread(
                It.IsAny<string>(),
                It.IsAny<ChatTurn>()),
                () => new ChatMessages([new ChatTurn(ChatRole.User, "Hello")]));

        mockToolsProvider.Setup(tp => tp.GetTools(), () => []);
        mockAIToolsProvider.Setup(tp => tp.GetAITools(), () => []);

        // Act
        var result = await chatWidgetService.RespondAsync("Hello", threadId: null);

        // Assert
        mockThreadService.Verify(ts => ts.CreateThread(), Times.Once);
    }

    [Fact]
    public async Task RespondAsync_UsesExistingThread()
    {
        // Arrange
        SetupBasicConversationFlow();
        mockThreadService.Setup(ts => ts.ThreadExists("thread-123"), () => true);


        // Act
        var result = await chatWidgetService.RespondAsync("Hello", threadId: "thread-123");

        // Assert
        mockThreadService.Verify(ts => ts.CreateThread(), Times.Never);
    }

    [Fact]
    public async Task RespondAsync_AppendsMessageToThread()
    {
        // Arrange
        SetupBasicConversationFlow();


        // Act
        await chatWidgetService.RespondAsync("Test message", threadId: "thread-123");

        // Assert
        mockThreadService.Verify(
            ts => ts.AppendMessageToThread(
                It.IsAny<string>(),
                It.Matches<ChatTurn>(ct => ct.Content == "Test message" && ct.Role == ChatRole.User)),
            Times.Exactly(2));
    }

    [Fact]
    public async Task RespondAsync_ProvidesTool()
    {
        // Arrange
        mockThreadService.Setup(ts => ts.ThreadExists(It.IsAny<string>()), () => true);
        mockThreadService
            .Setup(ts => ts.AppendMessageToThread(It.IsAny<string>(), It.IsAny<ChatTurn>()), () => new ChatMessages([new ChatTurn(ChatRole.User, "Hello")]));

        var tools = new List<WidgetTool> { new(new ButtonWidget("test", "Test tool")) };
        mockToolsProvider.Setup(tp => tp.GetTools(), () => tools);
        mockAIToolsProvider.Setup(tp => tp.GetAITools(), () => tools);
        mockAIInstructionsProvider.Setup(ip => ip.GetInstructions(), () => "Base instructions");
        mockThreadPersonaStore.Setup(ps => ps.GetPersona(It.IsAny<string>()), () => null);

        // Act
        await chatWidgetService.RespondAsync("Test", threadId: "thread-123");

        // Assert

        mockAIToolsProvider.Verify(
            c => c.GetAITools(),
            Times.Once);
    }

    [Fact]
    public async Task RespondAsync_StrictMode_ProvidesOnlySchemaConstrainedWidgetEmissionTool()
    {
        SetupBasicConversationFlow();
        options.WidgetGenerationMode = WidgetGenerationMode.StrictToolCall;
        var service = CreateService(new WidgetSchemaCatalogue(new WidgetRegistry()));

        await service.RespondAsync("Show an approval button", threadId: "thread-123");

        var chatOptions = Assert.IsType<ChatOptions>(mockChat.LastChatOptions);
        var emissionTool = Assert.Single(chatOptions.Tools!, tool => tool.Name == EmitWidgetsAIFunction.FunctionName);
        var declaration = Assert.IsAssignableFrom<AIFunctionDeclaration>(emissionTool);
        Assert.Equal(JsonValueKind.Object, declaration.JsonSchema.ValueKind);
        Assert.True(Assert.IsType<bool>(declaration.AdditionalProperties["strict"]));
        Assert.DoesNotContain(chatOptions.Tools!, tool => tool.Name == "get_widget_tools");
    }

    [Fact]
    public async Task RequiredDecision_UsesRequiredToolModeAndAllowsExplicitEmptyDecision()
    {
        SetupBasicConversationFlow();
        options.WidgetGenerationMode = WidgetGenerationMode.StrictToolCall;
        options.RequireWidgetDecision = true;
        await CreateService(new WidgetSchemaCatalogue(new WidgetRegistry())).RespondAsync("Hello", "thread-123");
        var settings = mockChat.LastChatOptions!;
        Assert.Equal(ChatToolMode.RequireAny, settings.ToolMode);
        var tool = Assert.IsAssignableFrom<AIFunctionDeclaration>(Assert.Single(settings.Tools!));
        Assert.Equal(0, tool.JsonSchema.GetProperty("properties").GetProperty("widgets").GetProperty("minItems").GetInt32());
    }

    [Theory]
    [InlineData(null, "not_called", 0)]
    [InlineData("[]", "none", 0)]
    [InlineData("[{\"type\":\"button\",\"label\":\"Hello\",\"action\":\"greet\"}]", "emitted", 1)]
    [InlineData("[{\"type\":\"invented\"}]", "rejected", 0)]
    public async Task StrictOutcome_ReportsActualToolResultDespiteAssistantClaim(string? emission, string status, int count)
    {
        SetupBasicConversationFlow();
        options.WidgetGenerationMode = WidgetGenerationMode.StrictToolCall;
        options.RequireWidgetDecision = true;
        options.RequireRegisteredWidgetActions = false;
        mockChat.EmissionJson = emission;
        var threads = new DefaultThreadService();
        var service = CreateService(new WidgetSchemaCatalogue(new WidgetRegistry()), threads);
        var turn = await service.RespondAsync("Show a widget", threads.CreateThread());
        Assert.Equal(status, turn.WidgetGeneration!.Status);
        Assert.Equal(count, turn.Widgets!.Count);
        if (status == "rejected") Assert.NotEmpty(turn.WidgetGeneration.Diagnostics!);
    }

    [Theory]
    [InlineData("{\"content\":\"Hello\",\"widgets\":[{\"type\":\"button\",\"label\":\"Hello\",\"action\":\"greet\"}]}", true, "emitted", 1)]
    [InlineData("{\"content\":\"Hello\",\"widgets\":[]}", false, "none", 0)]
    [InlineData("{\"content\":\"Hello\",\"widgets\":[]}", true, "rejected", 0)]
    [InlineData("not JSON", true, "rejected", 0)]
    public async Task StructuredResponse_ValidatesWidgetsAndEnforcesExplicitRequirement(string response, bool required, string status, int count)
    {
        SetupBasicConversationFlow();
        options.WidgetGenerationMode = WidgetGenerationMode.StructuredResponse;
        options.RequireRegisteredWidgetActions = false;
        mockChat.ResponseText = response;
        var threads = new DefaultThreadService();
        var service = CreateService(new WidgetSchemaCatalogue(new WidgetRegistry()), threads);
        var turn = await service.RespondAsync("Hello", threads.CreateThread(), null, default, requireWidgets: required);
        Assert.Equal(status, turn.WidgetGeneration!.Status);
        Assert.Equal(count, turn.Widgets!.Count);
        Assert.Empty(mockChat.LastChatOptions!.Tools!);
        var format = Assert.IsType<ChatResponseFormatJson>(mockChat.LastChatOptions.ResponseFormat);
        Assert.Equal(required ? 1 : 0, format.Schema!.Value.GetProperty("properties").GetProperty("widgets").GetProperty("minItems").GetInt32());
        Assert.DoesNotContain("\"widgets\"", turn.Content);
    }

    [Fact]
    public async Task StructuredStreaming_BuffersJsonAndReturnsOnlyValidatedFinalTurn()
    {
        SetupBasicConversationFlow();
        options.WidgetGenerationMode = WidgetGenerationMode.StructuredResponse;
        options.RequireRegisteredWidgetActions = false;
        mockChat.ResponseText = """{"content":"Hello","widgets":[{"type":"button","label":"Hello","action":"greet"}]}""";
        var threads = new DefaultThreadService();
        var service = CreateService(new WidgetSchemaCatalogue(new WidgetRegistry()), threads);
        var turns = new List<ChatTurn>();
        await foreach (var turn in service.StreamResponseAsync("Show a button", threads.CreateThread(), null, default, requireWidgets: true))
            turns.Add(turn);
        var final = Assert.Single(turns);
        Assert.Equal("Hello", final.Content);
        Assert.Equal("emitted", final.WidgetGeneration!.Status);
        Assert.Single(final.Widgets!);
    }

    [Fact]
    public async Task RespondAsync_PersonaOverride_PersistsAndPrependsInstructions()
    {
        // Arrange
        SetupBasicConversationFlow();
        options.EnablePersona = true;

        // Act
        await chatWidgetService.RespondAsync("Hello", "thread-123", "Friendly pirate");

        // Assert
        Assert.NotNull(mockChat.LastChatOptions);
        Assert.Contains("Friendly pirate", mockChat.LastChatOptions!.Instructions);
        Assert.Contains("Base instructions", mockChat.LastChatOptions.Instructions);
    }

    [Fact]
    public async Task RespondAsync_UsesThreadPersona_WhenRequestPersonaIsNotProvided()
    {
        // Arrange
        SetupBasicConversationFlow();
        options.EnablePersona = true;
        mockThreadPersonaStore.Setup(ps => ps.GetPersona("thread-123"), () => "Helpful teacher");

        // Act
        await chatWidgetService.RespondAsync("Hello", "thread-123");

        // Assert
        Assert.NotNull(mockChat.LastChatOptions);
        Assert.Contains("Helpful teacher", mockChat.LastChatOptions!.Instructions);
    }

    [Fact]
    public async Task RespondAsync_UsesDefaultPersona_WhenNoRequestOrThreadPersona()
    {
        // Arrange
        SetupBasicConversationFlow();
        options.EnablePersona = true;
        options.DefaultPersona = "Concise architect";

        // Act
        await chatWidgetService.RespondAsync("Hello", "thread-123");

        // Assert
        Assert.NotNull(mockChat.LastChatOptions);
        Assert.Contains("Concise architect", mockChat.LastChatOptions!.Instructions);
    }

    [Fact]
    public async Task RespondAsync_EmptyPersonaOverride_ClearsThreadPersona()
    {
        // Arrange
        SetupBasicConversationFlow();
        options.EnablePersona = true;
        options.DefaultPersona = "Default advisor";

        // Act
        await chatWidgetService.RespondAsync("Hello", "thread-123", "   ");

        // Assert
        Assert.NotNull(mockChat.LastChatOptions);
        Assert.Contains("Default advisor", mockChat.LastChatOptions!.Instructions);
    }

    [Fact]
    public async Task RespondAsync_TooLongPersonaOverride_ThrowsArgumentException()
    {
        // Arrange
        SetupBasicConversationFlow();
        options.EnablePersona = true;
        options.MaxPersonaLength = 10;

        // Act + Assert
        await Assert.ThrowsAsync<ArgumentException>(() =>
            chatWidgetService.RespondAsync("Hello", "thread-123", "this persona is way too long"));
    }

    [Fact]
    public async Task RespondAsync_PersonaOverrideWithControlCharacters_ThrowsArgumentException()
    {
        // Arrange
        SetupBasicConversationFlow();
        options.EnablePersona = true;

        // Act + Assert
        await Assert.ThrowsAsync<ArgumentException>(() =>
            chatWidgetService.RespondAsync("Hello", "thread-123", "safe\u0001persona"));
    }

    [Fact]
    public async Task RespondAsync_WhenPersonaDisabled_PersonaOverrideThrows()
    {
        // Arrange
        SetupBasicConversationFlow();
        options.EnablePersona = false;

        // Act + Assert
        await Assert.ThrowsAsync<ArgumentException>(() =>
            chatWidgetService.RespondAsync("Hello", "thread-123", "Friendly pirate"));
    }

    [Fact]
    public async Task RespondAsync_WhenPersonaDisabled_DefaultPersonaIsIgnored()
    {
        // Arrange
        SetupBasicConversationFlow();
        options.EnablePersona = false;
        options.DefaultPersona = "Concise architect";

        // Act
        await chatWidgetService.RespondAsync("Hello", "thread-123");

        // Assert
        Assert.NotNull(mockChat.LastChatOptions);
        Assert.Equal("Base instructions", mockChat.LastChatOptions!.Instructions);
    }
}


class MockChatClient : IChatClient
{
    public string? EmissionJson { get; set; }
    public string? ResponseText { get; set; }
    public ChatOptions? LastChatOptions { get; private set; }

    public void Dispose()
    {
        throw new NotImplementedException();
    }

    public async Task<ChatResponse> GetResponseAsync(IEnumerable<ChatMessage> messages, ChatOptions? options = null, CancellationToken cancellationToken = default)
    {
        LastChatOptions = options;
        if (EmissionJson is not null)
        {
            var tool = options!.Tools!.OfType<AIFunction>().Single(item => item.Name == EmitWidgetsAIFunction.FunctionName);
            await tool.InvokeAsync(new AIFunctionArguments { ["widgets"] = JsonSerializer.Deserialize<JsonElement>(EmissionJson) }, cancellationToken);
        }
        var input = @"This is a widget: <widget>{""type"":""input"",""label"":""Email"",""action"":""email"",""placeholder"":""user@example.com"",""maxLength"":100}</widget>";

        return new ChatResponse([new ChatMessage(ChatRole.Assistant, ResponseText ?? input)]);
    }

    public object? GetService(Type serviceType, object? serviceKey = null)
    {
        return null;
    }

    public async IAsyncEnumerable<ChatResponseUpdate> GetStreamingResponseAsync(IEnumerable<ChatMessage> messages, ChatOptions? options = null, [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        LastChatOptions = options;
        var text = ResponseText ?? "Hello";
        await Task.Yield();
        yield return new ChatResponseUpdate(ChatRole.Assistant, text[..(text.Length / 2)]);
        yield return new ChatResponseUpdate(ChatRole.Assistant, text[(text.Length / 2)..]);
    }
}
