using Xunit;
using BbQ.ChatWidgets.Services;
using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Tests.Services;

/// <summary>
/// Tests for WidgetRegistry widget instance registration and retrieval.
/// </summary>
public class WidgetRegistryTests
{
    [Fact]
    public void GetInstances_ReturnsAllRegisteredInstances()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act
        var instances = registry.GetInstances();

        // Assert
        Assert.NotNull(instances);
        Assert.NotEmpty(instances);
        Assert.Equal(13, instances.Count());
    }

    [Fact]
    public void IsRegistered_ReturnsTrueForButtonWidget()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act
        var isRegistered = registry.IsRegistered("button");

        // Assert
        Assert.True(isRegistered);
    }

    [Fact]
    public void GetInstance_ReturnsButtonWidgetInstance()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act
        var instance = registry.GetInstance("button");

        // Assert
        Assert.NotNull(instance);
        Assert.IsType<ButtonWidget>(instance);
    }

    [Fact]
    public void GetInstance_ReturnsCardWidgetInstance()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act
        var instance = registry.GetInstance("card");

        // Assert
        Assert.NotNull(instance);
        Assert.IsType<CardWidget>(instance);
    }

    [Fact]
    public void GetInstance_ReturnsInputWidgetInstance()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act
        var instance = registry.GetInstance("input");

        // Assert
        Assert.NotNull(instance);
        Assert.IsType<InputWidget>(instance);
    }

    [Fact]
    public void GetInstance_ReturnsDropdownWidgetInstance()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act
        var instance = registry.GetInstance("dropdown");

        // Assert
        Assert.NotNull(instance);
        Assert.IsType<DropdownWidget>(instance);
    }

    [Fact]
    public void GetInstance_ReturnsSliderWidgetInstance()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act
        var instance = registry.GetInstance("slider");

        // Assert
        Assert.NotNull(instance);
        Assert.IsType<SliderWidget>(instance);
    }

    [Fact]
    public void GetInstance_ReturnsToggleWidgetInstance()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act
        var instance = registry.GetInstance("toggle");

        // Assert
        Assert.NotNull(instance);
        Assert.IsType<ToggleWidget>(instance);
    }

    [Fact]
    public void GetInstance_ReturnsFileUploadWidgetInstance()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act
        var instance = registry.GetInstance("fileupload");

        // Assert
        Assert.NotNull(instance);
        Assert.IsType<FileUploadWidget>(instance);
    }

    [Fact]
    public void GetInstance_ReturnsDatePickerWidgetInstance()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act
        var instance = registry.GetInstance("datepicker");

        // Assert
        Assert.NotNull(instance);
        Assert.IsType<DatePickerWidget>(instance);
    }

    [Fact]
    public void GetInstance_ReturnsMultiSelectWidgetInstance()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act
        var instance = registry.GetInstance("multiselect");

        // Assert
        Assert.NotNull(instance);
        Assert.IsType<MultiSelectWidget>(instance);
    }

    [Fact]
    public void GetInstance_ReturnsProgressBarWidgetInstance()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act
        var instance = registry.GetInstance("progressbar");

        // Assert
        Assert.NotNull(instance);
        Assert.IsType<ProgressBarWidget>(instance);
    }

    [Fact]
    public void GetInstance_ReturnsThemeSwitcherWidgetInstance()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act
        var instance = registry.GetInstance("themeswitcher");

        // Assert
        Assert.NotNull(instance);
        Assert.IsType<ThemeSwitcherWidget>(instance);
    }

    [Fact]
    public void Register_RegistersCustomWidgetInstance()
    {
        // Arrange
        var registry = new WidgetRegistry();
        var initialCount = registry.GetCount();
        var customWidget = new InputWidget("Custom Input", "custom", "enter value");

        // Act - Register with a custom typeId override
        registry.Register(customWidget, "custom_input");

        // Assert
        Assert.Equal(initialCount + 1, registry.GetCount());
        Assert.True(registry.IsRegistered("custom_input"));
        var retrieved = registry.GetInstance("custom_input");
        Assert.NotNull(retrieved);
        Assert.Same(customWidget, retrieved);
    }

    [Fact]
    public void Register_ThrowsForNullInstance()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act & Assert
        Assert.Throws<ArgumentNullException>(() =>
            registry.Register(null!));
    }

    [Fact]
    public void TryGetInstance_ReturnsTrueForExistingWidget()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act
        var success = registry.TryGetInstance("button", out var instance);

        // Assert
        Assert.True(success);
        Assert.NotNull(instance);
        Assert.IsType<ButtonWidget>(instance);
    }

    [Fact]
    public void TryGetInstance_ReturnsFalseForUnregisteredWidget()
    {
        // Arrange
        var registry = new WidgetRegistry();

        // Act
        var success = registry.TryGetInstance("nonexistent", out var instance);

        // Assert
        Assert.False(success);
        Assert.Null(instance);
    }
}
