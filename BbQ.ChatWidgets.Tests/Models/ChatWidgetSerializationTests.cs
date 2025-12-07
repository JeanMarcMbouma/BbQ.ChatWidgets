using Xunit;
using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Tests.Models;

/// <summary>
/// Tests for ChatWidget polymorphic serialization and deserialization.
/// </summary>
public class ChatWidgetSerializationTests
{
    [Fact]
    public void ButtonWidget_SerializesCorrectly()
    {
        // Arrange
        var widget = new ButtonWidget("Click Me", "action_click");
        var json = widget.ToJson();

        // Act
        var deserialized = ChatWidget.FromJson(json);

        // Assert
        Assert.NotNull(deserialized);
        Assert.IsType<ButtonWidget>(deserialized);
        Assert.Equal("Click Me", deserialized.Label);
        Assert.Equal("action_click", deserialized.Action);
        Assert.Equal("button", deserialized.Type);
    }

    [Fact]
    public void CardWidget_SerializesWithAllProperties()
    {
        // Arrange
        var widget = new CardWidget(
            Label: "View Product",
            Action: "view_product",
            Title: "Product Name",
            Description: "A great product",
            ImageUrl: "https://example.com/image.jpg"
        );
        var json = widget.ToJson();

        // Act
        var deserialized = ChatWidget.FromJson(json);

        // Assert
        Assert.NotNull(deserialized);
        Assert.IsType<CardWidget>(deserialized);
        var card = (CardWidget)deserialized;
        Assert.Equal("View Product", card.Label);
        Assert.Equal("Product Name", card.Title);
        Assert.Equal("A great product", card.Description);
        Assert.Equal("https://example.com/image.jpg", card.ImageUrl);
    }

    [Fact]
    public void DropdownWidget_SerializesWithOptions()
    {
        // Arrange
        var options = new[] { "Small", "Medium", "Large" };
        var widget = new DropdownWidget("Select Size", "select_size", options);
        var json = widget.ToJson();

        // Act
        var deserialized = ChatWidget.FromJson(json);

        // Assert
        Assert.NotNull(deserialized);
        Assert.IsType<DropdownWidget>(deserialized);
        var dropdown = (DropdownWidget)deserialized;
        Assert.Equal(3, dropdown.Options.Count);
        Assert.Contains("Medium", dropdown.Options);
    }

    [Fact]
    public void SliderWidget_SerializesWithRange()
    {
        // Arrange
        var widget = new SliderWidget("Volume", "set_volume", Min: 0, Max: 100, Step: 5, Default: 50);
        var json = widget.ToJson();

        // Act
        var deserialized = ChatWidget.FromJson(json);

        // Assert
        Assert.NotNull(deserialized);
        Assert.IsType<SliderWidget>(deserialized);
        var slider = (SliderWidget)deserialized;
        Assert.Equal(0, slider.Min);
        Assert.Equal(100, slider.Max);
        Assert.Equal(5, slider.Step);
        Assert.Equal(50, slider.Default);
    }

    [Fact]
    public void ToggleWidget_SerializesWithDefaultValue()
    {
        // Arrange
        var widget = new ToggleWidget("Enable Notifications", "toggle_notifications", DefaultValue: true);
        var json = widget.ToJson();

        // Act
        var deserialized = ChatWidget.FromJson(json);

        // Assert
        Assert.NotNull(deserialized);
        Assert.IsType<ToggleWidget>(deserialized);
        var toggle = (ToggleWidget)deserialized;
        Assert.True(toggle.DefaultValue);
    }

    [Fact]
    public void InputWidget_SerializesWithPlaceholder()
    {
        // Arrange
        var widget = new InputWidget("Name", "input_name", Placeholder: "Enter your name", MaxLength: 50);
        var json = widget.ToJson();

        // Act
        var deserialized = ChatWidget.FromJson(json);

        // Assert
        Assert.NotNull(deserialized);
        Assert.IsType<InputWidget>(deserialized);
        var input = (InputWidget)deserialized;
        Assert.Equal("Enter your name", input.Placeholder);
        Assert.Equal(50, input.MaxLength);
    }

    [Fact]
    public void FileUploadWidget_SerializesWithConstraints()
    {
        // Arrange
        var widget = new FileUploadWidget("Upload", "upload_file", Accept: ".pdf,.docx", MaxBytes: 5000000);
        var json = widget.ToJson();

        // Act
        var deserialized = ChatWidget.FromJson(json);

        // Assert
        Assert.NotNull(deserialized);
        Assert.IsType<FileUploadWidget>(deserialized);
        var upload = (FileUploadWidget)deserialized;
        Assert.Equal(".pdf,.docx", upload.Accept);
        Assert.Equal(5000000, upload.MaxBytes);
    }

    [Fact]
    public void ThemeSwitcherWidget_SerializesWithThemes()
    {
        // Arrange
        var themes = new[] { "light", "dark", "auto" };
        var widget = new ThemeSwitcherWidget("Choose Theme", "set_theme", themes);
        var json = widget.ToJson();

        // Act
        var deserialized = ChatWidget.FromJson(json);

        // Assert
        Assert.NotNull(deserialized);
        Assert.IsType<ThemeSwitcherWidget>(deserialized);
        var switcher = (ThemeSwitcherWidget)deserialized;
        Assert.Equal(3, switcher.Themes.Count);
        Assert.Contains("dark", switcher.Themes);
        Assert.Equal("themeswitcher", switcher.Type);
    }

    [Fact]
    public void WidgetList_DeserializesPolymorphically()
    {
        // Arrange
        var widgets = new List<ChatWidget>
        {
            new ButtonWidget("Submit", "submit"),
            new DropdownWidget("Choice", "choose", ["A", "B"]),
            new ToggleWidget("Enable", "enable", true)
        };
        var json = widgets.ToJson();

        // Act
        var deserialized = ChatWidget.ListFromJson(json);

        // Assert
        Assert.NotNull(deserialized);
        Assert.Equal(3, deserialized.Count);
        Assert.IsType<ButtonWidget>(deserialized[0]);
        Assert.IsType<DropdownWidget>(deserialized[1]);
        Assert.IsType<ToggleWidget>(deserialized[2]);
    }
}
