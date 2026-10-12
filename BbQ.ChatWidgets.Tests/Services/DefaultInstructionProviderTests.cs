using BbQ.ChatWidgets.Options;
using BbQ.ChatWidgets.Services;
using Xunit;
using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Tests.Services;

public sealed class DefaultInstructionProviderTests
{
    [Fact]
    public void StrictExamples_UseRegisteredTemplateValuesAndAliasesWithoutLegacyPurpose()
    {
        var actions = new WidgetActionRegistry();
        actions.RegisterAction(new WidgetActionMetadata("greet", "Greet", "{}", typeof(object)));
        var widgets = new WidgetRegistry();
        widgets.Register(new ButtonWidget("Say hello", "greet"), "greeting");
        var provider = new DefaultInstructionProvider(actions, widgets, new BbQChatOptions
        {
            WidgetGenerationMode = WidgetGenerationMode.StrictToolCall,
            RequireRegisteredWidgetActions = true
        });

        var instructions = provider.GetInstructions()!;
        Assert.Contains("\"type\":\"greeting\"", instructions);
        Assert.Contains("\"action\":\"greet\"", instructions);
        Assert.DoesNotContain("\"action\":\"click\"", instructions);
        Assert.Contains("\"purpose\":null", instructions);
        Assert.DoesNotContain("<widget>{", instructions);
        Assert.Contains("NOT callable tools", instructions);
        Assert.Contains("repairAllowed true", instructions);
    }

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
        var options = new BbQChatOptions { WidgetGenerationMode = WidgetGenerationMode.EmbeddedMarkupLegacy };
        var provider = new DefaultInstructionProvider(
            new WidgetActionRegistry(),
            new WidgetRegistry(),
            options);

        var instructions = provider.GetInstructions();

        Assert.Contains("Always wrap widgets in <widget>", instructions);
        Assert.DoesNotContain("Emit widgets only by invoking", instructions);
    }
}
