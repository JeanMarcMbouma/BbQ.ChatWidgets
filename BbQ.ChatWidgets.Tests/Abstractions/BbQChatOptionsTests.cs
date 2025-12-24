using BbQ.ChatWidgets.Abstractions;
using Xunit;

namespace BbQ.ChatWidgets.Tests.Abstractions;

/// <summary>
/// Tests for BbQChatOptions validation.
/// </summary>
public class BbQChatOptionsTests
{
    [Fact]
    public void ValidateSummarizationSettings_ValidSettings_DoesNotThrow()
    {
        // Arrange
        var options = new BbQChatOptions
        {
            EnableAutoSummarization = true,
            SummarizationThreshold = 15,
            RecentTurnsToKeep = 10
        };

        // Act & Assert - should not throw
        options.ValidateSummarizationSettings();
    }

    [Fact]
    public void ValidateSummarizationSettings_DisabledSummarization_DoesNotThrow()
    {
        // Arrange
        var options = new BbQChatOptions
        {
            EnableAutoSummarization = false,
            SummarizationThreshold = 5,  // Invalid but ignored when disabled
            RecentTurnsToKeep = 10
        };

        // Act & Assert - should not throw when disabled
        options.ValidateSummarizationSettings();
    }

    [Fact]
    public void ValidateSummarizationSettings_ThresholdEqualsRecentTurns_Throws()
    {
        // Arrange
        var options = new BbQChatOptions
        {
            EnableAutoSummarization = true,
            SummarizationThreshold = 10,
            RecentTurnsToKeep = 10
        };

        // Act & Assert
        var exception = Assert.Throws<InvalidOperationException>(() =>
            options.ValidateSummarizationSettings());
        Assert.Contains("must be greater than", exception.Message);
    }

    [Fact]
    public void ValidateSummarizationSettings_ThresholdLessThanRecentTurns_Throws()
    {
        // Arrange
        var options = new BbQChatOptions
        {
            EnableAutoSummarization = true,
            SummarizationThreshold = 5,
            RecentTurnsToKeep = 10
        };

        // Act & Assert
        var exception = Assert.Throws<InvalidOperationException>(() =>
            options.ValidateSummarizationSettings());
        Assert.Contains("must be greater than", exception.Message);
    }

    [Fact]
    public void ValidateSummarizationSettings_NegativeThreshold_Throws()
    {
        // Arrange
        var options = new BbQChatOptions
        {
            EnableAutoSummarization = true,
            SummarizationThreshold = -1,
            RecentTurnsToKeep = 10
        };

        // Act & Assert
        var exception = Assert.Throws<InvalidOperationException>(() =>
            options.ValidateSummarizationSettings());
        Assert.Contains("must be positive", exception.Message);
    }

    [Fact]
    public void ValidateSummarizationSettings_NegativeRecentTurns_Throws()
    {
        // Arrange
        var options = new BbQChatOptions
        {
            EnableAutoSummarization = true,
            SummarizationThreshold = 15,
            RecentTurnsToKeep = -1
        };

        // Act & Assert
        var exception = Assert.Throws<InvalidOperationException>(() =>
            options.ValidateSummarizationSettings());
        Assert.Contains("must be positive", exception.Message);
    }

    [Fact]
    public void ValidateSummarizationSettings_ZeroThreshold_Throws()
    {
        // Arrange
        var options = new BbQChatOptions
        {
            EnableAutoSummarization = true,
            SummarizationThreshold = 0,
            RecentTurnsToKeep = 10
        };

        // Act & Assert
        var exception = Assert.Throws<InvalidOperationException>(() =>
            options.ValidateSummarizationSettings());
        Assert.Contains("must be positive", exception.Message);
    }
}
