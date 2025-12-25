import { ClockWidget } from './ClockWidget';

/**
 * Renders clock widget HTML with SSE metadata.
 * The rendered element includes data attributes that drive client-side initialization.
 * Stream ID is sourced from the widget metadata, with 'default-stream' as fallback.
 */
export function renderClock(widget: ClockWidget): string {
  const widgetId = `clock-${widget.action}`;
  const streamId = widget.streamId || 'default-stream';
  const dataStreamId = ` data-stream-id="${escapeHtml(streamId)}"` ;
  
  return `
    <div 
      class="bbq-widget bbq-clock" 
      data-widget-id="${widgetId}" 
      data-widget-type="clock"
      data-action="${escapeHtml(widget.action)}"${dataStreamId}
      data-auto-start="true"
      role="status"
      aria-live="polite">
      <label class="bbq-clock-label">${escapeHtml(widget.label)}</label>
      <div class="bbq-clock-display">
        <div class="bbq-clock-time" data-field="timeLocal">—</div>
        <div class="bbq-clock-iso" data-field="time">Loading time...</div>
      </div>
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
