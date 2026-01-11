using BbQ.ChatWidgets.Models;
using System.Text.Json.Serialization;

namespace BbQ.ChatWidgets.Sample.Shared;

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
{
    [JsonIgnore]
    public override string Purpose =>
        """
        ***EChart Widget***
        Format: <widget>{"type":"echarts","label":"Sales Chart","action":"on_chart_click","chartType":"bar","jsonData":"{...}"}</widget>
        Renders interactive charts using Apache ECharts.
        Use when you need to visualize data interactively within the chat interface.
        Note: The 'jsonData' field must contain valid ECharts options in JSON string.
        The 'chartType' field specifies the type of chart to render (e.g., 'bar', 'line', 'pie').
        """;
}
