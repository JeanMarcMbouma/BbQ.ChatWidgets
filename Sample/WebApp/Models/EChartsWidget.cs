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
        ***EChart Widget***
        Format: <widget>{
          "type": "echarts",
          "label": "Sales Chart",
          "action": "on_chart_click",
          "chartType": "bar",
          "jsonData": "{\"xAxis\": {\"type\": \"category\", \"data\": [\"Jan\", \"Feb\", \"Mar\"]}, \"yAxis\": {\"type\": \"value\"}, \"series\": [{\"data\": [100, 200, 150], \"type\": \"bar\"}]}"
        }</widget>
        Renders interactive charts using Apache ECharts.
        Schema: {
            type: string (echarts),
            label: string,
            action: string,
            chartType: string (e.g., 'bar', 'line', 'pie'),
            jsonData: string (ECharts options in JSON format)
        }
        ECharts options schema: 
         {
          "type": "echarts",
          "properties": {
            "title": {
              "type": "object",
              "properties": {
                "text": { "type": "string", "description": "Main chart title" },
                "subtext": { "type": "string", "description": "Subtitle text" },
                "left": { "type": "string", "enum": ["left", "center", "right"], "default": "center" }
              }
            },
            "tooltip": {
              "type": "object",
              "properties": {
                "trigger": { "type": "string", "enum": ["item", "axis"], "default": "item" }
              }
            },
            "legend": {
              "type": "object",
              "properties": {
                "data": { "type": "array", "items": { "type": "string" } }
              }
            },
            "xAxis": {
              "type": "object",
              "properties": {
                "type": { "type": "string", "enum": ["category", "value", "time", "log"], "default": "category" },
                "data": { "type": "array", "items": { "type": "string" } }
              }
            },
            "yAxis": {
              "type": "object",
              "properties": {
                "type": { "type": "string", "enum": ["value", "category", "time", "log"], "default": "value" }
              }
            },
            "series": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "name": { "type": "string", "description": "Series name" },
                  "type": {
                    "type": "string",
                    "enum": ["line", "bar", "pie", "scatter", "radar", "map", "gauge"],
                    "description": "Chart type"
                  },
                  "data": {
                    "type": "array",
                    "items": {
                      "anyOf": [
                        { "type": "number" },
                        { "type": "array", "items": [{ "type": "string" }, { "type": "number" }] }
                      ]
                    }
                  },
                  "smooth": { "type": "boolean", "description": "For line charts: smooth curve" }
                },
                "required": ["type", "data"]
              }
            },
            "color": {
              "type": "array",
              "items": { "type": "string", "description": "Hex or RGB color values" }
            }
          },
          "required": ["series"]
        }
        Use when you need to visualize data interactively within the chat interface.
        """;
}
