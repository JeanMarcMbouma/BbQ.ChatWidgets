using Xunit;
using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Tests.Models;

/// <summary>
/// Tests for ChatWidget type property and polymorphic behavior.
/// </summary>
public class ChatWidgetTypePropertyTests
{
    [Fact]
    public void ButtonWidget_HasCorrectType()
    {
        // Arrange
        var widget = new ButtonWidget("Click", "action");

        // Act
        var type = widget.Type;

        // Assert
        Assert.Equal("button", type);
    }

    [Fact]
    public void CardWidget_HasCorrectType()
    {
        // Arrange
        var widget = new CardWidget("View", "action", "Title");

        // Act
        var type = widget.Type;

        // Assert
        Assert.Equal("card", type);
    }

    [Fact]
    public void InputWidget_HasCorrectType()
    {
        // Arrange
        var widget = new InputWidget("Name", "action");

        // Act
        var type = widget.Type;

        // Assert
        Assert.Equal("input", type);
    }

    [Fact]
    public void DropdownWidget_HasCorrectType()
    {
        // Arrange
        var widget = new DropdownWidget("Select", "action", ["A", "B"]);

        // Act
        var type = widget.Type;

        // Assert
        Assert.Equal("dropdown", type);
    }

    [Fact]
    public void SliderWidget_HasCorrectType()
    {
        // Arrange
        var widget = new SliderWidget("Value", "action", 0, 100, 5);

        // Act
        var type = widget.Type;

        // Assert
        Assert.Equal("slider", type);
    }

    [Fact]
    public void ToggleWidget_HasCorrectType()
    {
        // Arrange
        var widget = new ToggleWidget("Enable", "action", false);

        // Act
        var type = widget.Type;

        // Assert
        Assert.Equal("toggle", type);
    }

    [Fact]
    public void FileUploadWidget_HasCorrectType()
    {
        // Arrange
        var widget = new FileUploadWidget("Upload", "action");

        // Act
        var type = widget.Type;

        // Assert
        Assert.Equal("fileupload", type);
    }

    [Fact]
    public void AllWidgets_HaveLabelProperty()
    {
        // Arrange & Act & Assert
        Assert.Equal("Button Label", new ButtonWidget("Button Label", "action").Label);
        Assert.Equal("Card Label", new CardWidget("Card Label", "action", "title").Label);
        Assert.Equal("Input Label", new InputWidget("Input Label", "action").Label);
        Assert.Equal("Dropdown Label", new DropdownWidget("Dropdown Label", "action", ["A"]).Label);
        Assert.Equal("Slider Label", new SliderWidget("Slider Label", "action", 0, 10, 1).Label);
        Assert.Equal("Toggle Label", new ToggleWidget("Toggle Label", "action", false).Label);
        Assert.Equal("Upload Label", new FileUploadWidget("Upload Label", "action").Label);
    }

    [Fact]
    public void AllWidgets_HaveActionProperty()
    {
        // Arrange & Act & Assert
        Assert.Equal("click", new ButtonWidget("Label", "click").Action);
        Assert.Equal("view", new CardWidget("Label", "view", "title").Action);
        Assert.Equal("submit", new InputWidget("Label", "submit").Action);
        Assert.Equal("select", new DropdownWidget("Label", "select", ["A"]).Action);
        Assert.Equal("slide", new SliderWidget("Label", "slide", 0, 10, 1).Action);
        Assert.Equal("toggle", new ToggleWidget("Label", "toggle", false).Action);
        Assert.Equal("upload", new FileUploadWidget("Label", "upload").Action);
    }
}
