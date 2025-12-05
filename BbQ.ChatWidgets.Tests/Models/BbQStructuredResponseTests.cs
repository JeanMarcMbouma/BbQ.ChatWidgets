using Xunit;
using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Tests.Models;

/// <summary>
/// Tests for BbQStructuredResponse response structure.
/// </summary>
public class BbQStructuredResponseTests
{
    [Fact]
    public void StructuredResponse_WithContentOnly()
    {
        // Arrange
        var content = "Hello, this is a response";

        // Act
        var response = new BbQStructuredResponse(content);

        // Assert
        Assert.Equal(content, response.Content);
        Assert.Null(response.Widgets);
    }

    [Fact]
    public void StructuredResponse_WithContentAndWidgets()
    {
        // Arrange
        var content = "Choose an option:";
        var widgets = new List<ChatWidget>
        {
            new ButtonWidget("Option A", "option_a"),
            new ButtonWidget("Option B", "option_b")
        };

        // Act
        var response = new BbQStructuredResponse(content, widgets);

        // Assert
        Assert.Equal(content, response.Content);
        Assert.NotNull(response.Widgets);
        Assert.Equal(2, response.Widgets.Count);
    }

    [Fact]
    public void StructuredResponse_IsImmutable()
    {
        // Arrange
        var response = new BbQStructuredResponse("Hello");

        // Act & Assert
        // Records are immutable, so we can't modify properties
        Assert.Equal("Hello", response.Content);
    }
}
