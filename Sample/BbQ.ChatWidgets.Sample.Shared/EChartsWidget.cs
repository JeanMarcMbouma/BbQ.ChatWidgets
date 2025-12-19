using BbQ.ChatWidgets.Models;

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
    public override string Purpose =>
        """
        ***EChart Widget***
        Format: <widget>{"type":"echarts","label":"Sales Chart","action":"on_chart_click","chartType":"bar","jsonData":"{...}"}</widget>
        Renders interactive charts using Apache ECharts.
        Use when you need to visualize data interactively within the chat interface.
        """;
}
