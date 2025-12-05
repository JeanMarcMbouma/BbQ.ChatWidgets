using Xunit;
using BbQ.ChatWidgets.Services;
using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Tests.Services;

/// <summary>
/// Tests for DefaultWidgetHintParser widget extraction and parsing.
/// </summary>
public class DefaultWidgetHintParserTests
{
    private readonly DefaultWidgetHintParser _parser = new();

    [Fact]
    public void Parse_WithSingleButtonWidget_ExtractsWidget()
    {
        // Arrange
        var input = "Click here: <widget>{\"type\":\"button\",\"label\":\"Submit\",\"action\":\"submit\"}</widget>";

        // Act
        var (content, widgets) = _parser.Parse(input);

        // Assert
        Assert.Equal("Click here:", content.Trim());
        Assert.NotNull(widgets);
        Assert.Single(widgets);
        Assert.IsType<ButtonWidget>(widgets[0]);
        Assert.Equal("Submit", widgets[0].Label);
    }

    [Fact]
    public void Parse_WithMultipleWidgets_ExtractsAll()
    {
        // Arrange
        var input = @"Options:
<widget>{""type"":""button"",""label"":""Option 1"",""action"":""opt1""}</widget>
<widget>{""type"":""button"",""label"":""Option 2"",""action"":""opt2""}</widget>";

        // Act
        var (content, widgets) = _parser.Parse(input);

        // Assert
        Assert.NotNull(widgets);
        Assert.Equal(2, widgets.Count);
        Assert.All(widgets, w => Assert.IsType<ButtonWidget>(w));
    }

    [Fact]
    public void Parse_WithCardWidget_ExtractsAllProperties()
    {
        // Arrange
        var input = @"Product: <widget>{""type"":""card"",""label"":""View"",""action"":""view"",""title"":""Widget"",""description"":""Great widget"",""imageUrl"":""https://example.com/img.jpg""}</widget>";

        // Act
        var (content, widgets) = _parser.Parse(input);

        // Assert
        Assert.NotNull(widgets);
        Assert.Single(widgets);
        var card = (CardWidget)widgets[0];
        Assert.Equal("Widget", card.Title);
        Assert.Equal("Great widget", card.Description);
        Assert.Equal("https://example.com/img.jpg", card.ImageUrl);
    }

    [Fact]
    public void Parse_WithDropdownWidget_ExtractsOptions()
    {
        // Arrange
        var input = @"<widget>{""type"":""dropdown"",""label"":""Size"",""action"":""size"",""options"":[""Small"",""Medium"",""Large""]}</widget>";

        // Act
        var (content, widgets) = _parser.Parse(input);

        // Assert
        Assert.NotNull(widgets);
        var dropdown = (DropdownWidget)widgets[0];
        Assert.Equal(3, dropdown.Options.Count);
        Assert.Contains("Medium", dropdown.Options);
    }

    [Fact]
    public void Parse_WithMalformedJSON_SkipsWidget()
    {
        // Arrange
        var input = "Good text <widget>{invalid json}</widget> more text";

        // Act
        var (content, widgets) = _parser.Parse(input);

        // Assert
        Assert.Contains("Good text", content);
        Assert.Contains("more text", content);
        // Malformed widget should be skipped
        Assert.Null(widgets);
    }

    [Fact]
    public void Parse_WithInvalidWidgetType_SkipsWidget()
    {
        // Arrange
        var input = "<widget>{\"type\":\"unknown\",\"label\":\"Test\",\"action\":\"test\"}</widget>";

        // Act
        var (content, widgets) = _parser.Parse(input);

        // Assert
        Assert.Null(widgets);
    }

    [Fact]
    public void Parse_WithNoWidgets_ReturnsNullWidgets()
    {
        // Arrange
        var input = "This is just plain text with no widgets";

        // Act
        var (content, widgets) = _parser.Parse(input);

        // Assert
        Assert.Equal(input, content);
        Assert.Null(widgets);
    }

    [Fact]
    public void Parse_RemovesWidgetMarkersFromContent()
    {
        // Arrange
        var input = "Before <widget>{\"type\":\"button\",\"label\":\"Click\",\"action\":\"click\"}</widget> After";

        // Act
        var (content, _) = _parser.Parse(input);

        // Assert
        Assert.DoesNotContain("<widget>", content);
        Assert.DoesNotContain("</widget>", content);
        Assert.Contains("Before", content);
        Assert.Contains("After", content);
    }

    [Fact]
    public void Parse_WithSliderWidget_ExtractsRangeProperties()
    {
        // Arrange
        var input = @"<widget>{""type"":""slider"",""label"":""Volume"",""action"":""volume"",""min"":0,""max"":100,""step"":5,""default"":50}</widget>";

        // Act
        var (content, widgets) = _parser.Parse(input);

        // Assert
        Assert.NotNull(widgets);
        var slider = (SliderWidget)widgets[0];
        Assert.Equal(0, slider.Min);
        Assert.Equal(100, slider.Max);
        Assert.Equal(5, slider.Step);
        Assert.Equal(50, slider.Default);
    }

    [Fact]
    public void Parse_WithToggleWidget_ExtractsDefaultValue()
    {
        // Arrange
        var input = @"<widget>{""type"":""toggle"",""label"":""Dark Mode"",""action"":""darkmode"",""defaultValue"":true}</widget>";

        // Act
        var (content, widgets) = _parser.Parse(input);

        // Assert
        Assert.NotNull(widgets);
        var toggle = (ToggleWidget)widgets[0];
        Assert.True(toggle.DefaultValue);
    }

    [Fact]
    public void Parse_WithInputWidget_ExtractsConstraints()
    {
        // Arrange
        var input = @"<widget>{""type"":""input"",""label"":""Email"",""action"":""email"",""placeholder"":""user@example.com"",""maxLength"":100}</widget>";

        // Act
        var (content, widgets) = _parser.Parse(input);

        // Assert
        Assert.NotNull(widgets);
        var input_widget = (InputWidget)widgets[0];
        Assert.Equal("user@example.com", input_widget.Placeholder);
        Assert.Equal(100, input_widget.MaxLength);
    }

    [Fact]
    public void Parse_NullInput_ThrowsException()
    {
        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => _parser.Parse(null!));
    }
}
