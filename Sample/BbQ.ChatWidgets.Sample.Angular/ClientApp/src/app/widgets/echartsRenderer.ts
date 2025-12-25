import { EChartsWidget } from './EChartsWidget';
import { escapeHtml } from '../utils/html-escape';

/**
 * ECharts SSR renderer (container only).
 * See docs/widgets/ECHARTS_WIDGET.md for the SSR→client contract and integration notes.
 */

/**
 * Generates HTML for ECharts widget container (without initialization)
 * Initialization is handled in Angular component via ngAfterViewInit
 */
export function renderECharts(widget: EChartsWidget): string {
  return `
    <div class="bbq-echarts" data-widget-type="echarts" data-action="${escapeHtml(widget.action)}" data-chart-data="${escapeHtml(widget.jsonData)}">
      ${widget.label ? `<label class="bbq-echarts-label">${escapeHtml(widget.label)}</label>` : ''}
      <div class="echarts-container" style="width: 100%; height: 300px;"></div>
    </div>
  `;
}
