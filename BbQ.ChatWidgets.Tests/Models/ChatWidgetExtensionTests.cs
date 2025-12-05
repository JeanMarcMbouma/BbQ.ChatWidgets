using Xunit;
using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Tests.Models;

/// <summary>
/// Tests for ChatWidget schema generation and extension methods.
/// </summary>
public class ChatWidgetExtensionTests
{
    [Fact]
    public void GetSchema_ButtonWidget_ReturnsSchema()
    {
        // Arrange
        ChatWidget widget = new ButtonWidget("Click", "action");

        // Act
        var schema = widget.GetSchema();

        // Assert
        Assert.NotNull(schema);
        var schemaString = schema.ToString()!;
        Assert.NotEmpty(schemaString);
    }

    [Fact]
    public void GetSchema_CardWidget_ReturnsSchema()
    {
        // Arrange
        ChatWidget widget = new CardWidget("View", "action", "Title");

        // Act
        var schema = widget.GetSchema();

        // Assert
        Assert.NotNull(schema);
        var schemaString = schema.ToString()!;
        Assert.NotEmpty(schemaString);
    }

    [Fact]
    public void GetSchema_DropdownWidget_ReturnsSchema()
    {
        // Arrange
        ChatWidget widget = new DropdownWidget("Select", "action", new[] { "A", "B" });

        // Act
        var schema = widget.GetSchema();

        // Assert
        Assert.NotNull(schema);
        var schemaString = schema.ToString()!;
        Assert.NotEmpty(schemaString);
    }

    [Fact]
    public void GetSchema_SliderWidget_ReturnsSchema()
    {
        // Arrange
        ChatWidget widget = new SliderWidget("Value", "action", 0, 100, 5);

        // Act
        var schema = widget.GetSchema();

        // Assert
        Assert.NotNull(schema);
        var schemaString = schema.ToString()!;
        Assert.NotEmpty(schemaString);
    }

    [Fact]
    public void GetSchema_ToggleWidget_ReturnsSchema()
    {
        // Arrange
        ChatWidget widget = new ToggleWidget("Enable", "action", true);

        // Act
        var schema = widget.GetSchema();

        // Assert
        Assert.NotNull(schema);
        var schemaString = schema.ToString()!;
        Assert.NotEmpty(schemaString);
    }

    [Fact]
    public void GetSchema_InputWidget_ReturnsSchema()
    {
        // Arrange
        ChatWidget widget = new InputWidget("Name", "action");

        // Act
        var schema = widget.GetSchema();

        // Assert
        Assert.NotNull(schema);
        var schemaString = schema.ToString()!;
        Assert.NotEmpty(schemaString);
    }

    [Fact]
    public void GetSchema_FileUploadWidget_ReturnsSchema()
    {
        // Arrange
        ChatWidget widget = new FileUploadWidget("Upload", "action");

        // Act
        var schema = widget.GetSchema();

        // Assert
        Assert.NotNull(schema);
        var schemaString = schema.ToString()!;
        Assert.NotEmpty(schemaString);
    }
}
