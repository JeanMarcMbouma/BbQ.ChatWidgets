using Xunit;
using Microsoft.Extensions.DependencyInjection;
using BbQ.ChatWidgets.Extensions;
using BbQ.ChatWidgets.Services;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Abstractions;
using BbQ.MockLite;
using Microsoft.Extensions.AI;

namespace BbQ.ChatWidgets.Tests.Integration;

/// <summary>
/// Integration tests for BbQ.ChatWidgets service registration and composition.
/// </summary>
public class ServiceCollectionIntegrationTests
{
    [Fact]
    public void AddBbQChatWidgets_RegistersAllServices()
    {
        // Arrange
        var services = new ServiceCollection();

        // Act
        services.AddBbQChatWidgets();
        var serviceProvider = services.BuildServiceProvider();

        // Assert
        var widgetRegistry = serviceProvider.GetRequiredService<WidgetRegistry>();
        var hintParser = serviceProvider.GetRequiredService<IWidgetHintParser>();
        var toolsProvider = serviceProvider.GetRequiredService<IWidgetToolsProvider>();
        var threadService = serviceProvider.GetRequiredService<IThreadService>();

        Assert.NotNull(widgetRegistry);
        Assert.NotNull(hintParser);
        Assert.NotNull(toolsProvider);
        Assert.NotNull(threadService);
    }

    [Fact]
    public void AddBbQChatWidgets_RegistersChatWidgetService()
    {
        // Arrange
        var services = new ServiceCollection();
        var mockClient = Mock.Of<IChatClient>();
        services.AddSingleton(mockClient);
        // Act
        services.AddBbQChatWidgets();
        var serviceProvider = services.BuildServiceProvider();

        // Assert
        // ChatWidgetService is registered as scoped
        var service1 = serviceProvider.CreateScope().ServiceProvider.GetRequiredService<ChatWidgetService>();
        var service2 = serviceProvider.CreateScope().ServiceProvider.GetRequiredService<ChatWidgetService>();

        Assert.NotNull(service1);
        Assert.NotNull(service2);
        Assert.NotSame(service1, service2); // Should be different instances (scoped)
    }

    [Fact]
    public void AddBbQChatWidgets_WithOptions_AppliesConfiguration()
    {
        // Arrange
        var services = new ServiceCollection();
        var expectedPrefix = "/api/v2/chat";

        // Act
        services.AddBbQChatWidgets(options => options.RoutePrefix = expectedPrefix);
        var serviceProvider = services.BuildServiceProvider();

        // Assert
        var chatOptions = serviceProvider.GetRequiredService<BbQChatOptions>();
        Assert.Equal(expectedPrefix, chatOptions.RoutePrefix);
    }

    [Fact]
    public void AddBbQChatWidgets_DefaultWidgetHintParser_Works()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddBbQChatWidgets();
        var serviceProvider = services.BuildServiceProvider();

        // Act
        var parser = serviceProvider.GetRequiredService<IWidgetHintParser>();
        var (content, widgets) = parser.Parse("Test <widget>{\"type\":\"button\",\"label\":\"Click\",\"action\":\"click\"}</widget>");

        // Assert
        Assert.NotNull(widgets);
        Assert.Single(widgets);
        Assert.IsType<ButtonWidget>(widgets[0]);
    }

    [Fact]
    public void AddBbQChatWidgets_DefaultWidgetToolsProvider_Works()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddBbQChatWidgets();
        var serviceProvider = services.BuildServiceProvider();

        // Act
        var toolsProvider = serviceProvider.GetRequiredService<IWidgetToolsProvider>();
        var tools = toolsProvider.GetTools();

        // Assert
        Assert.NotEmpty(tools);
        Assert.Contains(tools, t => t.Name == "button");
        Assert.Contains(tools, t => t.Name == "dropdown");
    }

    [Fact]
    public void WidgetRegistry_ContainsAllWidgetTypes()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddBbQChatWidgets();
        var serviceProvider = services.BuildServiceProvider();

        // Act
        var registry = serviceProvider.GetRequiredService<WidgetRegistry>();
        var types = registry.GetRegisteredTypes();

        // Assert
        Assert.Equal(7, types.Count());
        Assert.Contains(typeof(ButtonWidget), types);
        Assert.Contains(typeof(CardWidget), types);
        Assert.Contains(typeof(InputWidget), types);
        Assert.Contains(typeof(DropdownWidget), types);
        Assert.Contains(typeof(SliderWidget), types);
        Assert.Contains(typeof(ToggleWidget), types);
        Assert.Contains(typeof(FileUploadWidget), types);
    }

    [Fact]
    public void DefaultThreadService_CreatesAndManagesThreads()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddBbQChatWidgets();
        var serviceProvider = services.BuildServiceProvider();

        // Act
        var threadService = serviceProvider.GetRequiredService<IThreadService>();
        var threadId = threadService.CreateThread();

        // Assert
        Assert.NotNull(threadId);
        Assert.NotEmpty(threadId);
        Assert.True(threadService.ThreadExists(threadId));
    }
}
