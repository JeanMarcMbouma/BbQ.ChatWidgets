import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SCENARIOS } from '../../config/scenarios';
import { ScenarioType } from '../../models/chat.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  scenarios = SCENARIOS;
  @Output() selectScenario = new EventEmitter<ScenarioType>();

  onSelectScenario(scenario: ScenarioType): void {
    this.selectScenario.emit(scenario);
  }
}
