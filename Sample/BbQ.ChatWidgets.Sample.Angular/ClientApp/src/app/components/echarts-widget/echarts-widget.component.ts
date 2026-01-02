import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomWidgetComponent } from '@bbq-chat/widgets-angular';
import type { ChatWidget } from '@bbq-chat/widgets-angular';
import * as echarts from 'echarts';
import { EChartsWidget } from '../../widgets/EChartsWidget';

/**
 * Angular component for rendering ECharts widgets
 * Uses the new component-based custom widget renderer approach
 */
@Component({
  selector: 'app-echarts-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bbq-echarts">
      @if (echartsWidget.label) {
        <label class="bbq-echarts-label">{{ echartsWidget.label }}</label>
      }
      <div #chartContainer class="echarts-container" style="width: 100%; height: 300px;"></div>
    </div>
  `,
  styles: [`
    .bbq-echarts {
      margin: 0.5rem 0;
    }
    
    .bbq-echarts-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    
    .echarts-container {
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }
  `]
})
export class EChartsWidgetComponent implements CustomWidgetComponent, OnInit, AfterViewInit, OnDestroy {
  @Input() widget!: ChatWidget;
  @ViewChild('chartContainer', { static: false }) chartContainer!: ElementRef<HTMLElement>;
  
  widgetAction?: (actionName: string, payload: unknown) => void;
  
  private chartInstance: any;
  private resizeListener?: () => void;

  get echartsWidget(): EChartsWidget {
    return this.widget as EChartsWidget;
  }

  ngOnInit() {
    // Make echarts available globally if needed
    if (typeof window !== 'undefined' && !(window as any).echarts) {
      (window as any).echarts = echarts;
    }
  }

  ngAfterViewInit() {
    // Initialize chart after view is ready
    setTimeout(() => {
      this.initializeChart();
    }, 0);
  }

  ngOnDestroy() {
    // Cleanup chart and listeners
    this.cleanup();
  }

  private initializeChart() {
    if (!this.chartContainer?.nativeElement) {
      console.error('Chart container not available');
      return;
    }

    try {
      // Parse chart options from JSON data
      const options = JSON.parse(this.echartsWidget.jsonData);

      // Initialize the chart
      this.chartInstance = echarts.init(this.chartContainer.nativeElement);
      this.chartInstance.setOption(options);

      // Attach click handler
      this.chartInstance.on('click', (params: any) => {
        if (this.widgetAction && this.echartsWidget.action) {
          const payload = {
            seriesName: params.seriesName || '',
            value: params.value || '',
            componentType: params.componentType || '',
            name: params.name || '',
          };
          this.widgetAction(this.echartsWidget.action, payload);
        }
      });

      // Setup resize listener
      this.resizeListener = () => {
        if (this.chartInstance && !this.chartInstance.isDisposed()) {
          this.chartInstance.resize();
        }
      };
      window.addEventListener('resize', this.resizeListener);
    } catch (e) {
      console.error('Failed to initialize ECharts:', e);
      console.error('Chart data:', this.echartsWidget.jsonData);
    }
  }

  private cleanup() {
    // Dispose chart instance
    if (this.chartInstance && !this.chartInstance.isDisposed()) {
      this.chartInstance.dispose();
    }

    // Remove resize listener
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }
}
