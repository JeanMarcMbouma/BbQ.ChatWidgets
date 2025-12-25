import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SCENARIOS } from '../../config/scenarios';
import { ScenarioType, ScenarioConfig } from '../../models/chat.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  scenarios = SCENARIOS;

  onSelectScenario(scenario: ScenarioType): void {
    // This will be handled by the parent component (app.component)
    window.dispatchEvent(new CustomEvent('selectScenario', { detail: scenario }));
  }
}
