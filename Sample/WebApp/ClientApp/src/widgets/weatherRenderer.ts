import { WeatherWidget } from './WeatherWidget';

/**
 * Renders weather widget HTML with SSE metadata.
 * The rendered element includes data attributes that drive client-side initialization.
 * Stream ID is sourced from the widget metadata, with 'weather-stream' as fallback.
 */
export function renderWeather(widget: WeatherWidget): string {
  const widgetId = `weather-${widget.action}`;
  const streamId = widget.streamId || 'weather-stream';
  const city = widget.city || 'London';
  const dataStreamId = ` data-stream-id="${escapeHtml(streamId)}"`;
  const dataCity = ` data-city="${escapeHtml(city)}"`;
  
  return `
    <div 
      class="bbq-widget bbq-weather" 
      data-widget-id="${widgetId}" 
      data-widget-type="weather"
      data-action="${escapeHtml(widget.action)}"${dataStreamId}${dataCity}
      data-auto-start="true"
      role="status"
      aria-live="polite">
      <label class="bbq-weather-label">${escapeHtml(widget.label)}</label>
      <div class="bbq-weather-display">
        <div class="bbq-weather-city" data-field="city">—</div>
        <div class="bbq-weather-condition" data-field="condition">Loading...</div>
        <div class="bbq-weather-temp" data-field="temperature">—°C</div>
        <div class="bbq-weather-details">
          <div class="bbq-weather-humidity">
            <span class="label">Humidity:</span>
            <span class="value" data-field="humidity">—%</span>
          </div>
          <div class="bbq-weather-wind">
            <span class="label">Wind:</span>
            <span class="value" data-field="windSpeed">—</span>
            <span class="unit" data-field="windDirection">—</span>
          </div>
        </div>
        <div class="bbq-weather-timestamp" data-field="timestamp"></div>
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
