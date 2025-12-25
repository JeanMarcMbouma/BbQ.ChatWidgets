import { WeatherWidget } from './WeatherWidget';

/**
 * Renders weather widget HTML with SSE metadata.
 * The rendered element includes data attributes that drive client-side initialization.
 */
export function renderWeather(widget: WeatherWidget): string {
  const widgetId = `weather-${widget.action}`;
  const streamId = widget.streamId || 'weather-stream';
  const city = widget.city || 'London';
  
  return `
    <div 
      class="bbq-widget bbq-weather" 
      data-widget-id="${widgetId}" 
      data-widget-type="weather"
      data-action="${escapeHtml(widget.action)}"
      data-stream-id="${escapeHtml(streamId)}"
      data-city="${escapeHtml(city)}"
      data-auto-start="true"
      role="status"
      aria-live="polite">
      <label class="bbq-weather-label">${escapeHtml(widget.label)}</label>
      <div class="bbq-weather-display">
        <div class="bbq-weather-city" data-field="city">${escapeHtml(city)}</div>
        <div class="bbq-weather-condition" data-field="condition">Loading...</div>
        <div class="bbq-weather-temp" data-field="temperature">—</div>
        <div class="bbq-weather-humidity" data-field="humidity">—</div>
        <div class="bbq-weather-wind">
          <span data-field="windSpeed">—</span>
          <span data-field="windDirection">—</span>
        </div>
        <div class="bbq-weather-timestamp" data-field="timestamp">—</div>
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
