import { EChartsWidget } from './EChartsWidget';

/**
 * ECharts SSR renderer (container only).
 * See docs/widgets/ECHARTS_WIDGET.md for the SSR→client contract and integration notes.
 */

/**
 * Generates HTML for ECharts widget container (without initialization)
 * Initialization is handled in React component via useEffect
 */
export function renderECharts(widget: EChartsWidget): string {
  const containerId = `echarts-${Math.random().toString(36).substr(2, 9)}`;
  
  return `
    <div class="bbq-echarts" data-widget-type="echarts" data-action="${escapeHtml(widget.action)}" data-chart-data="${escapeHtml(widget.jsonData)}">
      ${widget.label ? `<label class="bbq-echarts-label">${escapeHtml(widget.label)}</label>` : ''}
      <div id="${containerId}" class="echarts-container" style="width: 100%; height: 300px;"></div>
    </div>
  `;
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
