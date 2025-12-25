import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ScenarioType } from './models/chat.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HomeComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  currentPage = signal<ScenarioType | null>(null);
  ScenarioType = ScenarioType;

  private scenarioEventListener: any;

  ngOnInit() {
    this.scenarioEventListener = (event: any) => {
      this.handleSelectScenario(event.detail);
    };
    window.addEventListener('selectScenario', this.scenarioEventListener);
  }

  ngOnDestroy() {
    if (this.scenarioEventListener) {
      window.removeEventListener('selectScenario', this.scenarioEventListener);
    }
  }

  handleSelectScenario(scenario: ScenarioType) {
    this.currentPage.set(scenario);
  }

  handleBack() {
    this.currentPage.set(null);
  }

  getPageTitle(): string {
    const page = this.currentPage();
    if (!page) return '';
    
    const titles: Record<ScenarioType, string> = {
      [ScenarioType.BasicChat]: '💬 Basic Chat',
      [ScenarioType.StreamingChat]: '⚡ Streaming Chat',
      [ScenarioType.TriageAgent]: '🎯 Triage Agent',
      [ScenarioType.WidgetsDemo]: '🧩 Widgets Demo',
      [ScenarioType.ActionsDemo]: '🎬 Actions Demo',
      [ScenarioType.SseWidgets]: '📡 SSE Widget Updates',
      [ScenarioType.SseClock]: '⏰ SSE Clock'
    };
    
    return titles[page] || '';
  }
}

