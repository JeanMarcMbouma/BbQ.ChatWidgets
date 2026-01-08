import { ChatWidget } from '@bbq-chat/widgets';

/**
 * Custom ECharts widget demonstrating extensibility.
 * Renders interactive charts using Apache ECharts library.
 * 
 * Example usage:
 * new EChartsWidget(
 *   "Sales Chart",
 *   "on_chart_click",
 *   "bar",
 *   JSON.stringify({...echartsOptions...})
 * )
 */
export class EChartsWidget extends ChatWidget {
  public readonly chartType: string;
  public readonly jsonData: string;

  constructor(
    label: string,
    action: string,
    chartType: string,
    jsonData: string
  ) {
    super('echarts', label, action);
    this.chartType = chartType;
    this.jsonData = jsonData;
  }

  toObject(): any {
    const base = this as any;
    return {
      type: 'echarts',
      label: base.label,
      action: base.action,
      chartType: this.chartType,
      jsonData: this.jsonData,
    };
  }
}
