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
        Assert.Equal(11, types.Count());
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

    [Fact]
    public void GetRegisteredTypes_IncludesDatePickerWidget()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act
        var types = registry.GetRegisteredTypes();

        // Assert
        Assert.Contains(typeof(DatePickerWidget), types);
    }

    [Fact]
    public void GetRegisteredTypes_IncludesMultiSelectWidget()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act
        var types = registry.GetRegisteredTypes();

        // Assert
        Assert.Contains(typeof(MultiSelectWidget), types);
    }

    [Fact]
    public void GetRegisteredTypes_IncludesProgressBarWidget()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act
        var types = registry.GetRegisteredTypes();

        // Assert
        Assert.Contains(typeof(ProgressBarWidget), types);
    }

    [Fact]
    public void GetRegisteredTypes_IncludesThemeSwitcherWidget()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act
        var types = registry.GetRegisteredTypes();

        // Assert
        Assert.Contains(typeof(ThemeSwitcherWidget), types);
    }

    [Fact]
    public void Register_WithTypeParameter_RegistersWidgetCorrectly()
    {
        // Arrange
        var registry = new WidgetRegistry();
        var initialCount = registry.GetCount();

        // Act
        registry.Register(
            typeof(InputWidget),
            "custom_input",
            "Custom input field",
            "custom",
            isInteractive: true,
            "form", "text");

        // Assert
        Assert.Equal(initialCount + 1, registry.GetCount());
        Assert.True(registry.IsRegistered("custom_input"));
        var metadata = registry.GetMetadata("custom_input");
        Assert.NotNull(metadata);
        Assert.Equal("custom_input", metadata.TypeId);
        Assert.Equal(typeof(InputWidget), metadata.Type);
        Assert.Equal("Custom input field", metadata.Description);
        Assert.Equal("custom", metadata.Category);
        Assert.True(metadata.IsInteractive);
        Assert.Contains("form", metadata.Tags);
        Assert.Contains("text", metadata.Tags);
    }

    [Fact]
    public void Register_WithTypeParameter_ThrowsForNullType()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act & Assert
#pragma warning disable CS8625 // Cannot convert null literal to non-nullable reference type
        Assert.Throws<ArgumentNullException>(() =>
            registry.Register(null, "test_widget"));
#pragma warning restore CS8625
    }

    [Fact]
    public void Register_WithTypeParameter_ThrowsForInvalidType()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act & Assert
        Assert.Throws<ArgumentException>(() =>
            registry.Register(typeof(string), "test_widget"));
    }

    [Fact]
    public void Register_WithTypeParameter_ThrowsForEmptyTypeId()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act & Assert
        Assert.Throws<ArgumentException>(() =>
            registry.Register(typeof(InputWidget), ""));
    }
}
