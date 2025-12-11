using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Sample.WebApp.Models;

/// <summary>
/// A custom ECharts widget demonstrating extensibility without modifying the core library.
/// Renders interactive charts using the Apache ECharts library.
/// </summary>
public sealed record EChartsWidget(
    string Label,
    string Action,
    string ChartType,      // 'bar', 'line', 'pie', etc.
    string JsonData        // Raw ECharts options JSON
) : ChatWidget(Label, Action)
{    public override string Purpose =>
        $$"""
        Renders interactive charts using Apache ECharts.
        Schema: {
          "type": "echarts",
          "label": "Sales Chart",
          "action": "on_chart_click",
          "chartType": "bar",
          "jsonData": "{\"xAxis\": {\"type\": \"category\", \"data\": [\"Jan\", \"Feb\", \"Mar\"]}, \"yAxis\": {\"type\": \"value\"}, \"series\": [{\"data\": [100, 200, 150], \"type\": \"bar\"}]}"
        }
        """;
}
