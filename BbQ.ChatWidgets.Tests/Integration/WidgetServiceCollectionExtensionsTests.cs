using Xunit;
using Microsoft.Extensions.DependencyInjection;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Extensions;

namespace BbQ.ChatWidgets.Tests.Integration;

/// <summary>
/// Integration tests for the DI-friendly <c>AddWidget&lt;TWidget&gt;</c> registration path.
/// </summary>
[Collection("WidgetIntegration")]
public class WidgetServiceCollectionExtensionsTests
{
    [Fact]
    public void AddWidget_RegistersWidgetInRegistry()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddBbQChatWidgets();
        services.AddWidget<RatingWidget>(
            sp => new RatingWidget("Rate this", "submit", 10));

        var provider = services.BuildServiceProvider();

        // Act
        var registry = provider.GetRequiredService<IWidgetRegistry>();

        // Assert – typeId derived from class name: "RatingWidget" → "rating"
        Assert.True(registry.IsRegistered("rating"));
        Assert.IsType<RatingWidget>(registry.GetInstance("rating"));
    }

    [Fact]
    public void AddWidget_WithTypeIdOverride_UsesOverriddenTypeId()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddBbQChatWidgets();
        services.AddWidget<RatingWidget>(
            sp => new RatingWidget("Rate this", "submit"), "my_rating");

        var provider = services.BuildServiceProvider();

        // Act
        var registry = provider.GetRequiredService<IWidgetRegistry>();

        // Assert
        Assert.True(registry.IsRegistered("my_rating"));
        Assert.IsType<RatingWidget>(registry.GetInstance("my_rating"));
    }

    [Fact]
    public void AddWidget_MultipleWidgets_AllRegistered()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddBbQChatWidgets();
        services.AddWidget<RatingWidget>(sp => new RatingWidget("Rate", "rate"));
        services.AddWidget<SurveyWidget>(sp => new SurveyWidget("Poll", "poll_answer"));

        var provider = services.BuildServiceProvider();

        // Act
        var registry = provider.GetRequiredService<IWidgetRegistry>();

        // Assert – "RatingWidget" → "rating", "SurveyWidget" → "survey"
        Assert.True(registry.IsRegistered("rating"));
        Assert.True(registry.IsRegistered("survey"));
    }

    [Fact]
    public void AddWidget_DoesNotRemoveBuiltInWidgets()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddBbQChatWidgets();
        services.AddWidget<RatingWidget>(sp => new RatingWidget("Rate", "rate"));

        var provider = services.BuildServiceProvider();

        // Act
        var registry = provider.GetRequiredService<IWidgetRegistry>();

        // Assert – built-ins are still present
        Assert.True(registry.IsRegistered("button"));
        Assert.True(registry.IsRegistered("input"));
        Assert.True(registry.IsRegistered("rating"));
    }

    [Fact]
    public void AddWidget_CanCoexistWithWidgetRegistryConfigurator()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddBbQChatWidgets(options =>
        {
            options.WidgetRegistryConfigurator = registry =>
                registry.Register(new SurveyWidget("Poll", "poll"), "configurator_survey");
        });
        services.AddWidget<RatingWidget>(sp => new RatingWidget("Rate", "rate"));

        var provider = services.BuildServiceProvider();

        // Act
        var registry = provider.GetRequiredService<IWidgetRegistry>();

        // Assert – both registration paths produce entries
        Assert.True(registry.IsRegistered("rating"));
        Assert.True(registry.IsRegistered("configurator_survey"));
    }

    [Fact]
    public void AddWidget_NullFactory_ThrowsArgumentNullException()
    {
        var services = new ServiceCollection();

        Assert.Throws<ArgumentNullException>(() =>
            services.AddWidget<RatingWidget>(null!));
    }
}

// ---------------------------------------------------------------------------
// Test widget types – simple names ending with "Widget" (no "Widget" in the middle)
// ---------------------------------------------------------------------------

public sealed record RatingWidget(
    string Label,
    string Action,
    int MaxRating = 5
) : ChatWidget(Label, Action)
{
    public override string Purpose => "Rate a product or service";
}

public sealed record SurveyWidget(
    string Label,
    string Action,
    string Question = "What do you think?"
) : ChatWidget(Label, Action)
{
    public override string Purpose => "Conduct a poll or survey";
}
