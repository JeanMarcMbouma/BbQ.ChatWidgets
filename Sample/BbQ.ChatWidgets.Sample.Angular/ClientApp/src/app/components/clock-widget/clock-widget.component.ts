import { Component, Input, OnInit, OnDestroy, signal, ChangeDetectorRef, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomWidgetComponent } from '@bbq-chat/widgets-angular';
import type { ChatWidget } from '@bbq-chat/widgets-angular';
import { ClockWidget } from '../../widgets/ClockWidget';

/**
 * Angular component for rendering Clock widgets with SSE updates
 * Uses the new component-based custom widget renderer approach
 */
@Component({
  selector: 'app-clock-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="bbq-widget bbq-clock"
      role="status"
      aria-live="polite">
      <label class="bbq-clock-label">{{ clockWidget.label }}</label>
      <div class="bbq-clock-display">
        <div class="bbq-clock-time">{{ timeLocal() || '—' }}</div>
        <div class="bbq-clock-iso">{{ time() || 'Loading time...' }}</div>
      </div>
    </div>
  `,
  styles: [`
    .bbq-clock {
      padding: 1rem;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background: #f9f9f9;
    }
    
    .bbq-clock-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #555;
    }
    
    .bbq-clock-display {
      text-align: center;
    }
    
    .bbq-clock-time {
      font-size: 2rem;
      font-weight: bold;
      color: #333;
      margin-bottom: 0.25rem;
    }
    
    .bbq-clock-iso {
      font-size: 0.875rem;
      color: #666;
      font-family: monospace;
    }
  `]
})
export class ClockWidgetComponent implements CustomWidgetComponent, OnInit, OnDestroy {

  @Input() widget!: ChatWidget;
  widgetAction?: (actionName: string, payload: unknown) => void;
  
  timeLocal = signal<string>('');
  time = signal<string>('');
  
  private eventSource?: EventSource;

  get clockWidget(): ClockWidget {
    return this.widget as ClockWidget;
  }

  ngOnInit() {
    this.subscribeToSSE();
  }

  ngOnDestroy() {
    this.cleanup();
  }

  private subscribeToSSE() {
    const streamId = this.clockWidget.streamId || 'default-stream';
    
    // Auto-start the server clock
    fetch(`/sample/clock/${encodeURIComponent(streamId)}/start`, { method: 'POST' })
      .catch(() => {
        // Ignore errors; clock may already be running or endpoint unavailable
      });

    // Subscribe to SSE stream
    const url = `/api/chat/widgets/streams/${encodeURIComponent(streamId)}/events`;
    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);

        // Update clock display if data matches this widget's ID
        if (data && data.widgetId === 'clock') {
          if (data.timeLocal) {
            this.timeLocal.set(String(data.timeLocal));
          }
          if (data.time) {
            this.time.set(String(data.time));
          }
          console.log('ClockWidget updated time:', this.timeLocal(), this.time());
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
