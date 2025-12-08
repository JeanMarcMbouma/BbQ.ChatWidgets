using System.Text.Json;
using Xunit;
using Microsoft.Extensions.DependencyInjection;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Services;
using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Extensions;

namespace BbQ.ChatWidgets.Tests.Integration;

/// <summary>
/// Integration tests for custom widget support setup and usage.
/// </summary>
public class CustomWidgetDIIntegrationTests
{
    
    [Fact]
    public void AddCustomWidgetSupport_WithConfiguration_RegistersCustomWidgets()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddBbQChatWidgets(options =>
        {
            options.WidgetRegistryConfigurator = registry =>
            {
                registry.Register(new TestDIRatingWidget("testdirating", "Rate this item"));
                registry.Register(new TestDIPollWidget("poll", "What is your favorite color?"), "poll");
            };
        });
        var provider = services.BuildServiceProvider();

        // Act

        var registry = provider.GetRequiredService<IWidgetRegistry>();

        // Assert
        Assert.NotNull(registry);
        Assert.Equal(typeof(TestDIRatingWidget), registry.GetInstance("testdirating")?.GetType());
        Assert.Equal(typeof(TestDIPollWidget), registry.GetInstance("poll")?.GetType());
    }

    [Fact]
    public void AddCustomWidgetSupport_InjectsRegistryIntoSerialization()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddBbQChatWidgets(options =>
        {
            options.WidgetRegistryConfigurator = registry =>
            {
                registry.Register(new TestDIRatingWidget("testdirating", "Rate this item"));
            };
        });

        var provider = services.BuildServiceProvider();

        // Act
        var json = """{"type":"testdirating","label":"Rate","action":"submit","maxRating":5}""";
        var options = Serialization.Default;
        var widget = JsonSerializer.Deserialize<ChatWidget>(json, options);

        // Assert
        Assert.NotNull(widget);
        Assert.IsType<TestDIRatingWidget>(widget);
    }

    [Fact]
    public void CustomWidgetRegistration_AllowsMultipleTypes()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddBbQChatWidgets(options =>
        {
            options.WidgetRegistryConfigurator = registry =>
            {
                registry.Register(new TestDIRatingWidget("testdirating", "Rate this item"));
                registry.Register(new TestDIPollWidget("poll", "What is your favorite color?"));
                registry.Register(new TestDIFeedbackWidget("testdifeedback", "Provide your feedback"));
            };
        });

        var provider = services.BuildServiceProvider();
        var registry = provider.GetService<IWidgetRegistry>();

        // Act
        var registrations = registry?.GetInstances();

        // Assert
        Assert.NotNull(registrations);
        Assert.Contains("testdirating", registrations.Select(x => x.Type));
        Assert.Contains("testdipoll", registrations.Select(x => x.Type));
        Assert.Contains("testdifeedback", registrations.Select(x => x.Type));
    }

    [Fact]
    public void AddCustomWidgetSupport_WithoutConfiguration_AllowsManualRegistration()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddBbQChatWidgets(options =>
        {
            options.WidgetRegistryConfigurator = registry =>
            {
                registry.Register(new TestDIRatingWidget("testdirating", "Rate this item"));
                registry.Register(new TestDIPollWidget("poll", "What is your favorite color?"));
            };
        });

        var provider = services.BuildServiceProvider();
        var registry = provider.GetService<IWidgetRegistry>();

        // Act

        // Assert
        Assert.NotNull(registry?.GetInstance("testdirating"));
    }

    [Fact]
    public void CustomWidgetSupport_SerializesAndDeserializes()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddBbQChatWidgets(options =>
        {
            options.WidgetRegistryConfigurator = registry =>
            {
                registry.Register(new TestDIRatingWidget("Rate This", "submit", 10));
            };
        });

        services.BuildServiceProvider();

        // Act
        var original = new TestDIRatingWidget("Rate This", "submit", 10);
        var json = JsonSerializer.Serialize(original, Serialization.Default);
        var deserialized = JsonSerializer.Deserialize<ChatWidget>(json, Serialization.Default);

        // Assert
        Assert.NotNull(deserialized);
        Assert.IsType<TestDIRatingWidget>(deserialized);
        var rating = deserialized as TestDIRatingWidget;
        Assert.Equal("Rate This", rating?.Label);
        Assert.Equal("submit", rating?.Action);
        Assert.Equal(10, rating?.MaxRating);
    }

    [Fact]
    public void CustomWidgetSupport_WithBuiltInWidgets_MaintainsBackwardCompatibility()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddBbQChatWidgets(options =>
        {
            options.WidgetRegistryConfigurator = registry =>
            {
                registry.Register(new TestDIRatingWidget("testdirating", "Rate this item"));
            };
        });


        services.BuildServiceProvider();

        // Act - Deserialize built-in widget
        var builtInJson = """{"type":"button","label":"Click","action":"submit"}""";
        var builtIn = JsonSerializer.Deserialize<ChatWidget>(builtInJson, Serialization.Default);

        // Act - Deserialize custom widget
        var customJson = """{"type":"testdirating","label":"Rate","action":"submit","maxRating":5}""";
        var custom = JsonSerializer.Deserialize<ChatWidget>(customJson, Serialization.Default);

        // Assert
        Assert.NotNull(builtIn);
        Assert.IsType<ButtonWidget>(builtIn);
        
        Assert.NotNull(custom);
        Assert.IsType<TestDIRatingWidget>(custom);
    }

}

/// <summary>
/// Test custom widget for DI integration tests.
/// </summary>
public sealed record TestDIRatingWidget(
    string Label,
    string Action,
    int MaxRating = 5
) : ChatWidget(Label, Action)
{
    public override string Purpose => "Rate a product or service";
}

/// <summary>
/// Another test custom widget for DI integration tests.
/// </summary>
public sealed record TestDIPollWidget(
    string Label,
    string Action,
    string Question = "What do you think?"
) : ChatWidget(Label, Action)
{
    public override string Purpose => "Conduct a poll or survey";
}

/// <summary>
/// Third test custom widget for DI integration tests.
/// </summary>
public sealed record TestDIFeedbackWidget(
    string Label,
    string Action,
    int MinRating = 1,
    int MaxRating = 5
) : ChatWidget(Label, Action)
{
    public override string Purpose => "Collect user feedback with rating";
}
