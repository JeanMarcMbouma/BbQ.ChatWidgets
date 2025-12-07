using Xunit;
using BbQ.ChatWidgets.Services;

namespace BbQ.ChatWidgets.Tests.Services;

/// <summary>
/// Tests for DefaultWidgetToolsProvider tool generation.
/// </summary>
public class DefaultWidgetToolsProviderTests
{
    private readonly DefaultWidgetToolsProvider _provider = new();

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
