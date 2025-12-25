import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { BasicChatComponent } from './pages/basic-chat/basic-chat.component';
import { StreamingChatComponent } from './pages/streaming-chat/streaming-chat.component';
import { TriageAgentComponent } from './pages/triage-agent/triage-agent.component';
import { WidgetsDemoComponent } from './pages/widgets-demo/widgets-demo.component';
import { ActionsDemoComponent } from './pages/actions-demo/actions-demo.component';
import { SseWidgetsComponent } from './pages/sse-widgets/sse-widgets.component';
import { SseClockComponent } from './pages/sse-clock/sse-clock.component';
import { ScenarioType } from './models/chat.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HomeComponent,
    BasicChatComponent,
    StreamingChatComponent,
    TriageAgentComponent,
    WidgetsDemoComponent,
    ActionsDemoComponent,
    SseWidgetsComponent,
    SseClockComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  currentPage = signal<ScenarioType | null>(null);
  ScenarioType = ScenarioType;

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

