using Xunit;
using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Tests.Models;

/// <summary>
/// Tests for custom widget types used with ExtensibleChatWidgetConverter.
/// Note: Direct converter tests are in CustomWidgetDIIntegrationTests where
/// the converter is properly injected via DI to avoid conflicts with [JsonPolymorphic].
/// </summary>
public class ExtensibleChatWidgetConverterTests
{
    [Fact]
    public void TestCustomWidgetTypes_AreValidChatWidgetSubclasses()
    {
        // Arrange & Act
        var ratingWidget = new TestRatingWidget("Rate", "submit", 10);
        var pollWidget = new TestPollWidget("Survey", "submit", "Question?", ["Good", "Bad"], true);

        // Assert
        Assert.IsAssignableFrom<ChatWidget>(ratingWidget);
        Assert.IsAssignableFrom<ChatWidget>(pollWidget);
        Assert.Equal("Rate", ratingWidget.Label);
        Assert.Equal("submit", ratingWidget.Action);
        Assert.Equal(10, ratingWidget.MaxRating);
    }
}

/// <summary>
/// Test custom widget with numeric property.
/// </summary>
public sealed record TestRatingWidget(
    string Label,
    string Action,
    int MaxRating = 5
) : ChatWidget(Label, Action)
{
    public override string Purpose => "Rate a product or service";
}

/// <summary>
/// Test custom widget that shadows built-in button.
/// </summary>
public sealed record TestCustomButtonWidget(
    string Label,
    string Action,
    string CustomProperty = ""
) : ChatWidget(Label, Action)
{
    public override string Purpose => "Custom button with extra property";
}

/// <summary>
/// Test custom widget with complex properties.
/// </summary>
public sealed record TestPollWidget(
    string Label,
    string Action,
    string Question = "",
    List<string> Options = default!,
    bool AllowMultiple = false
) : ChatWidget(Label, Action)
{
    public override string Purpose => "Conduct a poll with multiple options";
}
