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
    public void AddCustomWidgetSupport_RegistersCustomWidgetRegistry()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddBbQChatWidgets();
        services.AddCustomWidgetSupport();

        // Act
        var provider = services.BuildServiceProvider();
        var registry = provider.GetService<ICustomWidgetRegistry>();

        // Assert
        Assert.NotNull(registry);
        Assert.IsType<CustomWidgetRegistry>(registry);
    }

    [Fact]
    public void AddCustomWidgetSupport_WithConfiguration_RegistersCustomWidgets()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddBbQChatWidgets();
        services.AddCustomWidgetSupport(registry =>
        {
            registry.Register<TestDIRatingWidget>();
            registry.Register<TestDIPollWidget>("poll");
        });

        // Act
        var provider = services.BuildServiceProvider();
        var registry = provider.GetService<ICustomWidgetRegistry>();

        // Assert
        Assert.NotNull(registry);
        Assert.Equal(typeof(TestDIRatingWidget), registry.GetWidgetType("testdirating"));
        Assert.Equal(typeof(TestDIPollWidget), registry.GetWidgetType("poll"));
    }

    [Fact]
    public void AddCustomWidgetSupport_InjectsRegistryIntoSerialization()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddBbQChatWidgets();
        services.AddCustomWidgetSupport(registry =>
        {
            registry.Register<TestDIRatingWidget>();
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
        services.AddBbQChatWidgets();
        services.AddCustomWidgetSupport(registry =>
        {
            registry.Register<TestDIRatingWidget>();
            registry.Register<TestDIPollWidget>();
            registry.Register<TestDIFeedbackWidget>();
        });

        var provider = services.BuildServiceProvider();
        var registry = provider.GetService<ICustomWidgetRegistry>();

        // Act
        var registrations = registry?.GetAllRegistrations();

        // Assert
        Assert.NotNull(registrations);
        Assert.Equal(3, registrations.Count);
        Assert.Contains("testdirating", registrations.Keys);
        Assert.Contains("testdipoll", registrations.Keys);
        Assert.Contains("testdifeedback", registrations.Keys);
    }

    [Fact]
    public void AddCustomWidgetSupport_WithoutConfiguration_AllowsManualRegistration()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddBbQChatWidgets();
        services.AddCustomWidgetSupport();

        var provider = services.BuildServiceProvider();
        var registry = provider.GetService<ICustomWidgetRegistry>();

        // Act
        registry?.Register<TestDIRatingWidget>();

        // Assert
        Assert.NotNull(registry?.GetWidgetType("testdirating"));
    }

    [Fact]
    public void CustomWidgetSupport_SerializesAndDeserializes()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddBbQChatWidgets();
        services.AddCustomWidgetSupport(registry =>
        {
            registry.Register<TestDIRatingWidget>();
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
        services.AddBbQChatWidgets();
        services.AddCustomWidgetSupport(registry =>
        {
            registry.Register<TestDIRatingWidget>();
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
) : ChatWidget(Label, Action);

/// <summary>
/// Another test custom widget for DI integration tests.
/// </summary>
public sealed record TestDIPollWidget(
    string Label,
    string Action,
    string Question = "What do you think?"
) : ChatWidget(Label, Action);

/// <summary>
/// Third test custom widget for DI integration tests.
/// </summary>
public sealed record TestDIFeedbackWidget(
    string Label,
    string Action,
    int MinRating = 1,
    int MaxRating = 5
) : ChatWidget(Label, Action);
