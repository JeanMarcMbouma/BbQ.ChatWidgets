import { ScenarioType, ScenarioConfig } from '../types';
import { SCENARIOS } from '../config/scenarios';
import '../styles/HomePage.css';

interface HomePageProps {
  onSelectScenario: (scenario: ScenarioType) => void;
}

export function HomePage({ onSelectScenario }: HomePageProps) {
  return (
    <div className="home-page">
      <div className="header">
        <h1>💬 BbQ.ChatWidgets Sample</h1>
        <p className="tagline">Explore all supported chat scenarios</p>
      </div>

      <div className="intro-section">
        <h2>Welcome to BbQ.ChatWidgets</h2>
        <p>
          A powerful library for building interactive chat applications with widgets, triage agents,
          and real-time streaming capabilities.
        </p>

        <div className="features">
          <div className="feature">
            <span className="icon">🧩</span>
            <div>
              <h3>13+ Widgets</h3>
              <p>Interactive UI components (buttons, forms, sliders, etc.)</p>
            </div>
          </div>
          <div className="feature">
            <span className="icon">🎯</span>
            <div>
              <h3>Triage Agents</h3>
              <p>AI-powered intent classification and routing</p>
            </div>
          </div>
          <div className="feature">
            <span className="icon">⚡</span>
            <div>
              <h3>Real-time Streaming</h3>
              <p>Server-Sent Events for progressive response delivery</p>
            </div>
          </div>
          <div className="feature">
            <span className="icon">🔒</span>
            <div>
              <h3>Type-Safe</h3>
              <p>Full TypeScript support with automatic serialization</p>
            </div>
          </div>
        </div>
      </div>

      <div className="scenarios-section">
        <h2>Explore Scenarios</h2>
        <p className="section-intro">
          Each scenario demonstrates a different aspect of BbQ.ChatWidgets functionality.
        </p>

        <div className="scenarios-grid">
          {SCENARIOS.map(scenario => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onSelect={() => onSelectScenario(scenario.id)}
            />
          ))}
        </div>
      </div>

      <div className="documentation-section">
        <h2>📚 Documentation</h2>
        <div className="docs-grid">
          <div className="doc-card">
            <h3>Getting Started</h3>
            <p>Learn the basics of BbQ.ChatWidgets in 5 minutes</p>
            <a href="https://github.com/JeanMarcMbouma/BbQ.ChatWidgets" target="_blank" rel="noreferrer">
              View Guide →
            </a>
          </div>
          <div className="doc-card">
            <h3>API Reference</h3>
            <p>Complete API documentation for all endpoints</p>
            <a href="https://github.com/JeanMarcMbouma/BbQ.ChatWidgets/wiki" target="_blank" rel="noreferrer">
              View API →
            </a>
          </div>
          <div className="doc-card">
            <h3>Widget Catalog</h3>
            <p>All available widgets with examples</p>
            <a href="https://github.com/JeanMarcMbouma/BbQ.ChatWidgets" target="_blank" rel="noreferrer">
              Browse Widgets →
            </a>
          </div>
          <div className="doc-card">
            <h3>Source Code</h3>
            <p>Open-source on GitHub</p>
            <a href="https://github.com/JeanMarcMbouma/BbQ.ChatWidgets" target="_blank" rel="noreferrer">
              GitHub Repo →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ScenarioCardProps {
  scenario: ScenarioConfig;
  onSelect: () => void;
}

function ScenarioCard({ scenario, onSelect }: ScenarioCardProps) {
  return (
    <div className="scenario-card" onClick={onSelect}>
      <div className="card-icon">{scenario.icon}</div>
      <h3>{scenario.name}</h3>
      <p className="description">{scenario.description}</p>
      <div className="features-list">
        <h4>FEATURES:</h4>
        <ul>
          {scenario.features.map((feature, i) => (
            <li key={i}>✓ {feature}</li>
          ))}
        </ul>
      </div>
      <div className="endpoint">
        <code>{scenario.endpoint}</code>
      </div>
      <button className="explore-button" onClick={onSelect}>
        Explore →
      </button>
    </div>
  );
}

export default HomePage;
