using System.Text.Json;
using BbQ.ChatWidgets.Models;
using BbQ.ChatWidgets.Renderers;
using Xunit;

namespace BbQ.ChatWidgets.Tests.Renderers;

public sealed class ReportingWidgetTests
{
    [Fact]
    public void ReportingDashboardRoundTripsAndRendersItsInheritedData()
    {
        IReadOnlyDictionary<string, JsonElement> row = new Dictionary<string, JsonElement>
        {
            ["region"] = JsonSerializer.SerializeToElement("<North>"),
            ["total"] = JsonSerializer.SerializeToElement(42)
        };
        var widget = new ReportingWidget("Dashboard", "", "dashboard",
            Settings: new ReportingSettings(DataSource: "orders", Columns: [new("region", "Region"), new("total", "Total")]),
            Sources: new Dictionary<string, IReadOnlyList<IReadOnlyDictionary<string, JsonElement>>> { ["orders"] = [row] },
            Children: [new ReportingWidget("Child", "", "grid")]);

        var restored = Assert.IsType<ReportingWidget>(JsonSerializer.Deserialize<ChatWidget>(widget.ToJson(), Serialization.Default));
        Assert.Equal("grid", Assert.Single(restored.Children!).Kind);
        Assert.Equal(42, restored.Sources!["orders"][0]["total"].GetInt32());
        var html = new SsrWidgetRenderer().RenderWidget(restored);
        Assert.Contains("data-bbq-reporting=", html);
        Assert.Contains("<th scope=\"col\">Total</th>", html);
        Assert.Contains("<td>&lt;North&gt;</td>", html);
        Assert.DoesNotContain("<North>", html);
        Assert.IsType<JsonElement>(restored.GetSchema());
    }
}
