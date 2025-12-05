using Xunit;
using BbQ.ChatWidgets.Services;
using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Tests.Services;

/// <summary>
/// Tests for WidgetRegistry widget type registration and retrieval.
/// </summary>
public class WidgetRegistryTests
{
    [Fact]
    public void GetRegisteredTypes_ReturnsAllWidgetTypes()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act
        var types = registry.GetRegisteredTypes();

        // Assert
        Assert.NotNull(types);
        Assert.NotEmpty(types);
        Assert.Equal(7, types.Count());
    }

    [Fact]
    public void GetRegisteredTypes_IncludesButtonWidget()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act
        var types = registry.GetRegisteredTypes();

        // Assert
        Assert.Contains(typeof(ButtonWidget), types);
    }

    [Fact]
    public void GetRegisteredTypes_IncludesCardWidget()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act
        var types = registry.GetRegisteredTypes();

        // Assert
        Assert.Contains(typeof(CardWidget), types);
    }

    [Fact]
    public void GetRegisteredTypes_IncludesInputWidget()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act
        var types = registry.GetRegisteredTypes();

        // Assert
        Assert.Contains(typeof(InputWidget), types);
    }

    [Fact]
    public void GetRegisteredTypes_IncludesDropdownWidget()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act
        var types = registry.GetRegisteredTypes();

        // Assert
        Assert.Contains(typeof(DropdownWidget), types);
    }

    [Fact]
    public void GetRegisteredTypes_IncludesSliderWidget()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act
        var types = registry.GetRegisteredTypes();

        // Assert
        Assert.Contains(typeof(SliderWidget), types);
    }

    [Fact]
    public void GetRegisteredTypes_IncludesToggleWidget()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act
        var types = registry.GetRegisteredTypes();

        // Assert
        Assert.Contains(typeof(ToggleWidget), types);
    }

    [Fact]
    public void GetRegisteredTypes_IncludesFileUploadWidget()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act
        var types = registry.GetRegisteredTypes();

        // Assert
        Assert.Contains(typeof(FileUploadWidget), types);
    }
}
