using Xunit;

namespace BbQ.ChatWidgets.Tests;

/// <summary>
/// Collection definitions for test organization.
/// </summary>
[CollectionDefinition("Widget Tests")]
public class WidgetTestCollection : ICollectionFixture<WidgetTestFixture>
{
    // This class has no code, and is never created. Its purpose is simply
    // to define the collection that other test classes will use.
}

/// <summary>
/// Shared fixture for widget tests.
/// </summary>
public class WidgetTestFixture
{
    public WidgetTestFixture()
    {
        // Initialize any shared test data or state
    }
}
