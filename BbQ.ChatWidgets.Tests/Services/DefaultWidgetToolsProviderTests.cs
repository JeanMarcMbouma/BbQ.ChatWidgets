using Xunit;
using BbQ.ChatWidgets.Services;
using BbQ.ChatWidgets.Abstractions;

namespace BbQ.ChatWidgets.Tests.Services;

/// <summary>
/// Tests for DefaultWidgetToolsProvider tool generation.
/// </summary>
public class DefaultWidgetToolsProviderTests
{
    private readonly IWidgetRegistry _registry = new WidgetRegistry();
    private readonly DefaultWidgetToolsProvider _provider;

    public DefaultWidgetToolsProviderTests()
    {
        _provider = new DefaultWidgetToolsProvider(_registry);
    }

    [Fact]
    public void GetTools_ReturnsWidgetTools()
    {
        // Act
        var tools = _provider.GetTools();

        // Assert
        Assert.NotNull(tools);
        Assert.NotEmpty(tools);
    }

    [Fact]
    public void GetTools_IncludesButtonWidget()
    {
        // Act
        var tools = _provider.GetTools();

        // Assert
        Assert.Contains(tools, t => t.Name == "button");
    }

    [Fact]
    public void GetTools_IncludesCardWidget()
    {
        // Act
        var tools = _provider.GetTools();

        // Assert
        Assert.Contains(tools, t => t.Name == "card");
    }

    [Fact]
    public void GetTools_IncludesDropdownWidget()
    {
        // Act
        var tools = _provider.GetTools();

        // Assert
        Assert.Contains(tools, t => t.Name == "dropdown");
    }

    [Fact]
    public void GetTools_IncludesSliderWidget()
    {
        // Act
        var tools = _provider.GetTools();

        // Assert
        Assert.Contains(tools, t => t.Name == "slider");
    }

    [Fact]
    public void GetTools_IncludesToggleWidget()
    {
        // Act
        var tools = _provider.GetTools();

        // Assert
        Assert.Contains(tools, t => t.Name == "toggle");
    }

    [Fact]
    public void GetTools_IncludesInputWidget()
    {
        // Act
        var tools = _provider.GetTools();

        // Assert
        Assert.Contains(tools, t => t.Name == "input");
    }

    [Fact]
    public void GetTools_IncludesFileUploadWidget()
    {
        // Act
        var tools = _provider.GetTools();

        // Assert
        Assert.Contains(tools, t => t.Name == "fileupload");
    }

    [Fact]
    public void GetTools_RespectsRegistryAsSourceOfTruth()
    {
        // Arrange - create a new provider with a fresh registry
        var registry = new WidgetRegistry();
        var provider = new DefaultWidgetToolsProvider(registry);

        // Act
        var tools = provider.GetTools();

        // Assert - verify all registered widgets have tools
        var registeredTypes = registry.GetAllMetadata().Select(m => m.TypeId).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var toolNames = tools.Select(t => t.Name).ToHashSet(StringComparer.OrdinalIgnoreCase);
        
        // All registered widgets should have tools
        foreach (var typeId in registeredTypes)
        {
            Assert.Contains(typeId, toolNames);
        }
    }

    [Fact]
    public void GetTools_AllToolsHaveDescriptions()
    {
        // Act
        var tools = _provider.GetTools();

        // Assert
        Assert.All(tools, tool => Assert.False(string.IsNullOrEmpty(tool.Description)));
    }

    [Fact]
    public void GetTools_AllToolsHaveSchemas()
    {
        // Act
        var tools = _provider.GetTools();

        // Assert
        Assert.All(tools, tool => Assert.NotNull(tool.AdditionalProperties["schema"]));
    }

    [Fact]
    public void GetTools_ReturnsCachedList()
    {
        // Act
        var first = _provider.GetTools();
        var second = _provider.GetTools();

        // Assert
        Assert.Same(first, second);
    }
}
