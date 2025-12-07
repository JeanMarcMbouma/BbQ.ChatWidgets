using Xunit;
using BbQ.ChatWidgets.Services;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Abstractions;

namespace BbQ.ChatWidgets.Tests.Services;

/// <summary>
/// Tests for CustomWidgetRegistry custom widget registration and retrieval.
/// </summary>
public class CustomWidgetRegistryTests
{
    [Fact]
    public void RegisterWithDiscriminator_RegistersCustomWidget()
    {
        // Arrange
        var registry = new CustomWidgetRegistry();
        var customWidget = typeof(TestCustomWidget);

        // Act
        registry.Register(customWidget, "testcustom");

        // Assert
        Assert.NotNull(registry.GetWidgetType("testcustom"));
        Assert.Equal(customWidget, registry.GetWidgetType("testcustom"));
        Assert.Equal("testcustom", registry.GetDiscriminator(customWidget));
    }

    [Fact]
    public void RegisterWithAutoDiscriminator_ExtractsDiscriminatorFromTypeName()
    {
        // Arrange
        var registry = new CustomWidgetRegistry();
        var customWidget = typeof(TestCustomWidget);

        // Act
        registry.Register(customWidget);

        // Assert
        Assert.Equal("testcustom", registry.GetDiscriminator(customWidget));
        Assert.Equal(customWidget, registry.GetWidgetType("testcustom"));
    }

    [Fact]
    public void RegisterGeneric_WithDiscriminator_RegistersCustomWidget()
    {
        // Arrange
        var registry = new CustomWidgetRegistry();

        // Act
        registry.Register<TestCustomWidget>("test");

        // Assert
        Assert.Equal(typeof(TestCustomWidget), registry.GetWidgetType("test"));
        Assert.Equal("test", registry.GetDiscriminator(typeof(TestCustomWidget)));
    }

    [Fact]
    public void RegisterGeneric_WithoutDiscriminator_ExtractsDiscriminator()
    {
        // Arrange
        var registry = new CustomWidgetRegistry();

        // Act
        registry.Register<MyRatingWidget>();

        // Assert
        Assert.Equal(typeof(MyRatingWidget), registry.GetWidgetType("myrating"));
        Assert.Equal("myrating", registry.GetDiscriminator(typeof(MyRatingWidget)));
    }

    [Fact]
    public void GetAllRegistrations_ReturnsAllRegisteredWidgets()
    {
        // Arrange
        var registry = new CustomWidgetRegistry();
        registry.Register<TestCustomWidget>("test1");
        registry.Register<MyRatingWidget>();
        registry.Register(typeof(MyPollWidget), "poll");

        // Act
        var registrations = registry.GetAllRegistrations();

        // Assert
        Assert.Equal(3, registrations.Count);
        Assert.Contains("test1", registrations.Keys);
        Assert.Contains("myrating", registrations.Keys);
        Assert.Contains("poll", registrations.Keys);
    }

    [Fact]
    public void Register_ThrowsForNullType()
    {
        // Arrange
        var registry = new CustomWidgetRegistry();

        // Act & Assert
#pragma warning disable CS8625 // Cannot convert null literal to non-nullable reference type
        Assert.Throws<ArgumentNullException>(() => registry.Register(null, "test"));
#pragma warning restore CS8625
    }

    [Fact]
    public void Register_ThrowsForNullDiscriminator()
    {
        // Arrange
        var registry = new CustomWidgetRegistry();

        // Act & Assert
        Assert.Throws<ArgumentException>(() => 
            registry.Register(typeof(TestCustomWidget), null!));
    }

    [Fact]
    public void Register_ThrowsForEmptyDiscriminator()
    {
        // Arrange
        var registry = new CustomWidgetRegistry();

        // Act & Assert
        Assert.Throws<ArgumentException>(() => 
            registry.Register(typeof(TestCustomWidget), ""));
    }

    [Fact]
    public void Register_ThrowsIfTypeDoesNotInheritFromChatWidget()
    {
        // Arrange
        var registry = new CustomWidgetRegistry();

        // Act & Assert
        Assert.Throws<ArgumentException>(() => 
            registry.Register(typeof(string), "notwidget"));
    }

    [Fact]
    public void Register_ThrowsIfTypeAlreadyRegisteredWithDifferentDiscriminator()
    {
        // Arrange
        var registry = new CustomWidgetRegistry();
        registry.Register<TestCustomWidget>("test1");

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => 
            registry.Register<TestCustomWidget>("test2"));
    }

    [Fact]
    public void Register_ThrowsIfDiscriminatorAlreadyUsed()
    {
        // Arrange
        var registry = new CustomWidgetRegistry();
        registry.Register<TestCustomWidget>("test");

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => 
            registry.Register<MyRatingWidget>("test"));
    }

    [Fact]
    public void GetWidgetType_ReturnsNullForUnregisteredDiscriminator()
    {
        // Arrange
        var registry = new CustomWidgetRegistry();

        // Act
        var type = registry.GetWidgetType("nonexistent");

        // Assert
        Assert.Null(type);
    }

    [Fact]
    public void GetDiscriminator_ReturnsNullForUnregisteredType()
    {
        // Arrange
        var registry = new CustomWidgetRegistry();

        // Act
        var discriminator = registry.GetDiscriminator(typeof(TestCustomWidget));

        // Assert
        Assert.Null(discriminator);
    }

    [Fact]
    public void GetWidgetType_IsCaseSensitive()
    {
        // Arrange
        var registry = new CustomWidgetRegistry();
        registry.Register<TestCustomWidget>("test");

        // Act
        var lower = registry.GetWidgetType("test");
        var upper = registry.GetWidgetType("TEST");

        // Assert
        Assert.NotNull(lower);
        Assert.Null(upper);
    }

    [Fact]
    public void Register_AllowsSameTypeWithDifferentDiscriminators()
    {
        // Arrange
        var registry = new CustomWidgetRegistry();
        var customType = typeof(TestCustomWidget);

        // Act & Assert
        // First registration succeeds
        registry.Register(customType, "alias1");
        
        // Same type with same discriminator is idempotent (no error)
        registry.Register(customType, "alias1");
        
        // But different discriminator throws
        Assert.Throws<InvalidOperationException>(() => 
            registry.Register(customType, "alias2"));
    }
}

/// <summary>
/// Test custom widget type for unit tests.
/// </summary>
public sealed record TestCustomWidget(
    string Label,
    string Action
) : ChatWidget(Label, Action);

/// <summary>
/// Test custom widget type with auto-discriminator extraction.
/// </summary>
public sealed record MyRatingWidget(
    string Label,
    string Action,
    int MaxRating = 5
) : ChatWidget(Label, Action);

/// <summary>
/// Another test custom widget type.
/// </summary>
public sealed record MyPollWidget(
    string Label,
    string Action,
    string Question = "Default Question"
) : ChatWidget(Label, Action);
