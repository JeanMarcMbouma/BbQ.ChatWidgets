import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomWidgetComponent } from '@bbq-chat/widgets-angular';
import type { ChatWidget } from '@bbq-chat/widgets-angular';
import { WeatherWidget } from '../../widgets/WeatherWidget';

/**
 * Angular component for rendering Weather widgets with SSE updates
 * Uses the new component-based custom widget renderer approach
 */
@Component({
  selector: 'app-weather-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="bbq-widget bbq-weather"
      role="status"
      aria-live="polite">
      <label class="bbq-weather-label">{{ weatherWidget.label }}</label>
      <div class="bbq-weather-display">
        <div class="weather-city">{{ city || weatherWidget.city || '—' }}</div>
        <div class="weather-condition">{{ condition || 'Loading...' }}</div>
        <div class="weather-temp">{{ temperature ? temperature + '°C' : '—' }}</div>
        <div class="weather-details">
          <div class="weather-detail">
            <span class="label">Humidity:</span>
            <span class="value">{{ humidity ? humidity + '%' : '—' }}</span>
          </div>
          <div class="weather-detail">
            <span class="label">Wind:</span>
            <span class="value">{{ windSpeed ? windSpeed + ' km/h ' + windDirection : '—' }}</span>
          </div>
          @if (timestamp) {
            <div class="weather-timestamp">Updated: {{ formattedTimestamp }}</div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bbq-weather {
      padding: 1rem;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .bbq-weather-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      font-size: 0.875rem;
      opacity: 0.9;
    }
    
    .bbq-weather-display {
      text-align: center;
    }
    
    .weather-city {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    
    .weather-condition {
      font-size: 1.125rem;
      margin-bottom: 0.75rem;
      opacity: 0.9;
    }
    
    .weather-temp {
      font-size: 3rem;
      font-weight: bold;
      margin-bottom: 1rem;
    }
    
    .weather-details {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      padding: 0.75rem;
    }
    
    .weather-detail {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }
    
    .weather-detail:last-of-type {
      margin-bottom: 0;
    }
    
    .weather-detail .label {
      opacity: 0.8;
    }
    
    .weather-detail .value {
      font-weight: 500;
    }
    
    .weather-timestamp {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      font-size: 0.75rem;
      opacity: 0.7;
    }
  `]
})
export class WeatherWidgetComponent implements CustomWidgetComponent, OnInit, OnDestroy {
  @Input() widget!: ChatWidget;
  widgetAction?: (actionName: string, payload: unknown) => void;
  constructor(private changeDetectorRef: ChangeDetectorRef) {}
  
  city: string = '';
  condition: string = '';
  temperature: number | null = null;
  humidity: number | null = null;
  windSpeed: number | null = null;
  windDirection: string = '';
  timestamp: string = '';
  
  private eventSource?: EventSource;

  get weatherWidget(): WeatherWidget {
    return this.widget as WeatherWidget;
  }

  get formattedTimestamp(): string {
    if (!this.timestamp) return '';
    try {
      const date = new Date(this.timestamp);
      return date.toLocaleTimeString();
    } catch {
      return this.timestamp;
    }
  }

  ngOnInit() {
    this.subscribeToSSE();
  }

  ngOnDestroy() {
    this.cleanup();
  }

  private subscribeToSSE() {
    const streamId = this.weatherWidget.streamId || 'weather-stream';
    const city = this.weatherWidget.city || 'London';
    
    // Auto-start the server weather publisher
    const params = new URLSearchParams({ city });
    fetch(`/sample/weather/${encodeURIComponent(streamId)}/start?${params}`, { method: 'POST' })
      .catch(() => {
        // Ignore errors; weather publisher may already be running or endpoint unavailable
      });

    // Subscribe to SSE stream
    const url = `/api/chat/widgets/streams/${encodeURIComponent(streamId)}/events`;
    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);

        // Update weather display if data matches this widget's ID
        if (data && data.widgetId === 'weather') {
          if (data.city) this.city = String(data.city);
          if (data.condition) this.condition = String(data.condition);
          if (data.temperature !== undefined) this.temperature = Number(data.temperature);
          if (data.humidity !== undefined) this.humidity = Number(data.humidity);
          if (data.windSpeed !== undefined) this.windSpeed = Number(data.windSpeed);
          if (data.windDirection) this.windDirection = String(data.windDirection);
          if (data.timestamp) this.timestamp = String(data.timestamp);
          this.changeDetectorRef?.detectChanges();
        }
      } catch {
        // Ignore parse errors
      }
    };

    this.eventSource.onerror = () => {
      this.cleanup();
    };
  }

  private cleanup() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
  }
}
