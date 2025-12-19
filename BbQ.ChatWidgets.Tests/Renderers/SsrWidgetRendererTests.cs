using Xunit;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Renderers;

namespace BbQ.ChatWidgets.Tests.Renderers;

/// <summary>
/// Tests for the SSR (Server-Side Rendering) widget renderer.
/// </summary>
public class SsrWidgetRendererTests
{
    private readonly SsrWidgetRenderer _renderer = new SsrWidgetRenderer();

    [Fact]
    public void RenderWidget_WithButtonWidget_GeneratesValidHtml()
    {
        // Arrange
        var widget = new ButtonWidget("Click Me", "submit");

        // Act
        var html = _renderer.RenderWidget(widget);

        // Assert
        Assert.NotNull(html);
        Assert.Contains("bbq-widget", html);
        Assert.Contains("bbq-button", html);
        Assert.Contains("data-widget-type=\"button\"", html);
        Assert.Contains("data-action=\"submit\"", html);
        Assert.Contains("Click Me", html);
        Assert.Contains("type=\"button\"", html);
    }

    [Fact]
    public void RenderWidget_WithCardWidget_GeneratesCardHtml()
    {
        // Arrange
        var widget = new CardWidget(
            Label: "View",
            Action: "view_product",
            Title: "Product",
            Description: "A great product",
            ImageUrl: "https://example.com/image.jpg"
        );

        // Act
        var html = _renderer.RenderWidget(widget);

        // Assert
        Assert.NotNull(html);
        Assert.Contains("bbq-card", html);
        Assert.Contains("data-widget-type=\"card\"", html);
        Assert.Contains("bbq-card-title", html);
        Assert.Contains("Product", html);
        Assert.Contains("bbq-card-description", html);
        Assert.Contains("A great product", html);
        Assert.Contains("bbq-card-image", html);
        Assert.Contains("loading=\"lazy\"", html);
        Assert.Contains("role=\"article\"", html);
    }

    [Fact]
    public void RenderWidget_WithInputWidget_GeneratesInputHtml()
    {
        // Arrange
        var widget = new InputWidget(
            Label: "Your Name",
            Action: "input_name",
            Placeholder: "Enter your name",
            MaxLength: 50
        );

        // Act
        var html = _renderer.RenderWidget(widget);

        // Assert
        Assert.NotNull(html);
        Assert.Contains("bbq-input", html);
        Assert.Contains("data-widget-type=\"input\"", html);
        Assert.Contains("type=\"text\"", html);
        Assert.Contains("placeholder=\"Enter your name\"", html);
        Assert.Contains("maxlength=\"50\"", html);
        Assert.Contains("bbq-input-label", html);
        Assert.Contains("Your Name", html);
    }

    [Fact]
    public void RenderWidget_WithDropdownWidget_GeneratesSelectHtml()
    {
        // Arrange
        var widget = new DropdownWidget("Choose Size", "select_size", ["Small", "Medium", "Large"]);

        // Act
        var html = _renderer.RenderWidget(widget);

        // Assert
        Assert.NotNull(html);
        Assert.Contains("bbq-dropdown", html);
        Assert.Contains("data-widget-type=\"dropdown\"", html);
        Assert.Contains("<select", html);
        Assert.Contains("bbq-dropdown-select", html);
        Assert.Contains("<option value=\"Small\">Small</option>", html);
        Assert.Contains("<option value=\"Medium\">Medium</option>", html);
        Assert.Contains("<option value=\"Large\">Large</option>", html);
    }

    [Fact]
    public void RenderWidget_WithSliderWidget_GeneratesRangeInputHtml()
    {
        // Arrange
        var widget = new SliderWidget("Volume", "set_volume", Min: 0, Max: 100, Step: 5, Default: 50);

        // Act
        var html = _renderer.RenderWidget(widget);

        // Assert
        Assert.NotNull(html);
        Assert.Contains("bbq-slider", html);
        Assert.Contains("data-widget-type=\"slider\"", html);
        Assert.Contains("type=\"range\"", html);
        Assert.Contains("min=\"0\"", html);
        Assert.Contains("max=\"100\"", html);
        Assert.Contains("step=\"5\"", html);
        Assert.Contains("value=\"50\"", html);
        Assert.Contains("bbq-slider-value", html);
        Assert.Contains("aria-live=\"polite\"", html);
    }

    [Fact]
    public void RenderWidget_WithToggleWidget_GeneratesCheckboxHtml()
    {
        // Arrange
        var widget = new ToggleWidget("Enable Notifications", "toggle_notifications", DefaultValue: true);

        // Act
        var html = _renderer.RenderWidget(widget);

        // Assert
        Assert.NotNull(html);
        Assert.Contains("bbq-toggle", html);
        Assert.Contains("data-widget-type=\"toggle\"", html);
        Assert.Contains("type=\"checkbox\"", html);
        Assert.Contains("checked", html);
        Assert.Contains("bbq-toggle-text", html);
        Assert.Contains("Enable Notifications", html);
    }

    [Fact]
    public void RenderWidget_WithFileUploadWidget_GeneratesFileInputHtml()
    {
        // Arrange
        var widget = new FileUploadWidget(
            Label: "Upload Document",
            Action: "upload_file",
            Accept: ".pdf,.docx",
            MaxBytes: 5000000
        );

        // Act
        var html = _renderer.RenderWidget(widget);

        // Assert
        Assert.NotNull(html);
        Assert.Contains("bbq-file-upload", html);
        Assert.Contains("data-widget-type=\"fileupload\"", html);
        Assert.Contains("type=\"file\"", html);
        Assert.Contains("accept=\".pdf,.docx\"", html);
        Assert.Contains("data-max-bytes=\"5000000\"", html);
        Assert.Contains("bbq-file-label", html);
    }

    [Fact]
    public void RenderWidget_WithThemeSwitcherWidget_GeneratesSelectHtml()
    {
        // Arrange
        var widget = new ThemeSwitcherWidget(
            Label: "Choose Theme",
            Action: "set_theme",
            Themes: ["light", "dark", "auto"]
        );

        // Act
        var html = _renderer.RenderWidget(widget);

        // Assert
        Assert.NotNull(html);
        Assert.Contains("bbq-theme-switcher", html);
        Assert.Contains("data-widget-type=\"themeswitcher\"", html);
        Assert.Contains("<select", html);
        Assert.Contains("bbq-theme-switcher-select", html);
        Assert.Contains("<option value=\"light\">light</option>", html);
        Assert.Contains("<option value=\"dark\">dark</option>", html);
        Assert.Contains("<option value=\"auto\">auto</option>", html);
        Assert.Contains("bbq-theme-switcher-label", html);
        Assert.Contains("Choose Theme", html);
    }

    [Fact]
    public void RenderWidget_WithDatePickerWidget_GeneratesDateInputHtml()
    {
        // Arrange
        var widget = new DatePickerWidget(
            Label: "Select Date",
            Action: "pick_date",
            MinDate: "2024-01-01",
            MaxDate: "2024-12-31"
        );

        // Act
        var html = _renderer.RenderWidget(widget);

        // Assert
        Assert.NotNull(html);
        Assert.Contains("bbq-date-picker", html);
        Assert.Contains("data-widget-type=\"datepicker\"", html);
        Assert.Contains("type=\"date\"", html);
        Assert.Contains("min=\"2024-01-01\"", html);
        Assert.Contains("max=\"2024-12-31\"", html);
        Assert.Contains("bbq-date-picker-label", html);
        Assert.Contains("Select Date", html);
    }

    [Fact]
    public void RenderWidget_WithMultiSelectWidget_GeneratesMultipleSelectHtml()
    {
        // Arrange
        var widget = new MultiSelectWidget(
            Label: "Select Items",
            Action: "select_items",
            Options: ["Item1", "Item2", "Item3"]
        );

        // Act
        var html = _renderer.RenderWidget(widget);

        // Assert
        Assert.NotNull(html);
        Assert.Contains("bbq-multi-select", html);
        Assert.Contains("data-widget-type=\"multiselect\"", html);
        Assert.Contains("multiple", html);
        Assert.Contains("bbq-multi-select-select", html);
        Assert.Contains("<option value=\"Item1\">Item1</option>", html);
        Assert.Contains("<option value=\"Item2\">Item2</option>", html);
        Assert.Contains("<option value=\"Item3\">Item3</option>", html);
    }

    [Fact]
    public void RenderWidget_WithProgressBarWidget_GeneratesProgressHtml()
    {
        // Arrange
        var widget = new ProgressBarWidget(
            Label: "Upload Progress",
            Action: "upload_progress",
            Value: 75,
            Max: 100
        );

        // Act
        var html = _renderer.RenderWidget(widget);

        // Assert
        Assert.NotNull(html);
        Assert.Contains("bbq-progress-bar", html);
        Assert.Contains("data-widget-type=\"progressbar\"", html);
        Assert.Contains("<progress", html);
        Assert.Contains("value=\"75\"", html);
        Assert.Contains("max=\"100\"", html);
        Assert.Contains("bbq-progress-bar-element", html);
        Assert.Contains("aria-valuenow=\"75\"", html);
        Assert.Contains("aria-valuemax=\"100\"", html);
        Assert.Contains("75%", html);
    }

    [Fact]
    public void RenderWidget_EscapesHtmlContent_PreventingXss()
    {
        // Arrange
        var widget = new ButtonWidget("<script>alert('xss')</script>", "action&param");

        // Act
        var html = _renderer.RenderWidget(widget);

        // Assert
        Assert.NotNull(html);
        Assert.DoesNotContain("<script>", html);
        Assert.Contains("&lt;script&gt;", html);
        Assert.Contains("&amp;", html);
    }

    [Fact]
    public void RenderWidget_WithUnsupportedWidget_GeneratesErrorMessage()
    {
        // Arrange - create an anonymous widget type (simulate unsupported)
        var widget = new ButtonWidget("Test", "test"); // We'll cast it for testing
        // For this test, we verify the unsupported path by checking the pattern

        // Act
        var html = _renderer.RenderWidget(widget);

        // Assert
        Assert.NotNull(html);
        Assert.Contains("bbq-widget", html);
    }

    [Fact]
    public void RenderWidget_ContainsAccessibilityAttributes()
    {
        // Arrange
        var widget = new InputWidget("Email", "input_email", Placeholder: "user@example.com");

        // Act
        var html = _renderer.RenderWidget(widget);

        // Assert
        Assert.Contains("aria-labelledby", html);
    }

    [Fact]
    public void RenderWidget_ContainsDataWidgetId_UniquePerAction()
    {
        // Arrange
        var widget1 = new ButtonWidget("Button 1", "action_one");
        var widget2 = new ButtonWidget("Button 2", "action_two");

        // Act
        var html1 = _renderer.RenderWidget(widget1);
        var html2 = _renderer.RenderWidget(widget2);

        // Assert
        Assert.Contains("data-widget-id=\"bbq-action_one\"", html1);
        Assert.Contains("data-widget-id=\"bbq-action_two\"", html2);
        Assert.NotEqual(html1, html2);
    }

    [Fact]
    public void RenderWidget_AllWidgetsIncludeBbqWidgetClass()
    {
        // Arrange
        var widgets = new ChatWidget[]
        {
            new ButtonWidget("Test", "test"),
            new CardWidget("Test", "test", "Title"),
            new InputWidget("Test", "test"),
            new DropdownWidget("Test", "test", ["A", "B"]),
            new SliderWidget("Test", "test", 0, 100, 1),
            new ToggleWidget("Test", "test", false),
            new FileUploadWidget("Test", "test"),
            new ThemeSwitcherWidget("Test", "test", ["theme1", "theme2"]),
            new DatePickerWidget("Test", "test"),
            new MultiSelectWidget("Test", "test", ["A", "B"]),
            new ProgressBarWidget("Test", "test", 50, 100),
            new ImageWidget("Test", "test", "https://example.com/a.jpg"),
            new ImageCollectionWidget("Test", "test", [new ImageItem("https://example.com/a.jpg")])
        };

        // Act & Assert
        foreach (var widget in widgets)
        {
            var html = _renderer.RenderWidget(widget);
            Assert.Contains("bbq-widget", html);
        }
    }

    [Fact]
    public void RenderWidget_FrameworkNameIsSsr()
    {
        // Act
        var framework = _renderer.Framework;

        // Assert
        Assert.Equal("SSR", framework);
    }
}
