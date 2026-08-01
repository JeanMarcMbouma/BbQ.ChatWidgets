using BbQ.ChatWidgets.Options;
using Xunit;

namespace BbQ.ChatWidgets.Tests.Services;

public sealed class DefaultInstructionProviderTests
{
    [Fact]
    public void GetInstructions_StrictMode_UsesToolProtocolWithoutLegacyMarkupExamples()
    {
        var options = new BbQChatOptions { WidgetGenerationMode = WidgetGenerationMode.StrictToolCall };
        var provider = new DefaultInstructionProvider(
            new WidgetActionRegistry(),
            new WidgetRegistry(),
            options);

        var instructions = provider.GetInstructions();

        Assert.Contains("emit_widgets", instructions);
        Assert.Contains("Follow the tool JSON Schema exactly", instructions);
        Assert.DoesNotContain("Always wrap widgets in", instructions);
        Assert.DoesNotContain("<widget>{", instructions);
    }

    [Fact]
    public void GetInstructions_LegacyMode_PreservesEmbeddedMarkupProtocol()
    {
        var options = new BbQChatOptions();
        var provider = new DefaultInstructionProvider(
            new WidgetActionRegistry(),
            new WidgetRegistry(),
            options);

        var instructions = provider.GetInstructions();

        Assert.Contains("Always wrap widgets in <widget>", instructions);
        Assert.DoesNotContain("Emit widgets only by invoking", instructions);
    }
}
