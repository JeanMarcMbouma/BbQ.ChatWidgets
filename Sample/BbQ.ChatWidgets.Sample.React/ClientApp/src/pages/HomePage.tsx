import { ScenarioType } from "../types";
import { SCENARIOS } from "../config/scenarios";
import { Playground } from "../playground/Playground";
import "../styles/HomePage.css";

interface HomePageProps {
  onSelectScenario: (scenario: ScenarioType) => void;
}
const REPO = "https://github.com/JeanMarcMbouma/BbQ.ChatWidgets";

export function HomePage({ onSelectScenario }: HomePageProps) {
  return (
    <div className="home-page">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-nav">
        <a className="wordmark" href="#">
          <span aria-hidden="true">B</span> BbQ
          <span className="wordmark-detail">ChatWidgets</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#playground">Playground</a>
          <a href={`${REPO}/blob/master/docs_src/GETTING_STARTED.md`}>Docs</a>
          <a href={REPO}>GitHub ↗</a>
        </nav>
      </header>
      <main id="main-content">
        <section className="hero">
          <div>
            <p className="eyebrow">THE INTERACTIVE LAYER FOR AI CHAT</p>
            <h1>
              Less back-and-forth.
              <br />
              <span>More done.</span>
            </h1>
            <p className="hero-description">
              Give your assistant more than a text box. Bring forms, choices,
              and useful actions into the conversation, with a .NET backend and
              the frontend you already use.
            </p>
            <div className="hero-actions">
              <a className="primary-link" href="#playground">
                Try the playground ↗
              </a>
              <a
                className="secondary-link"
                href={`${REPO}/blob/master/docs_src/GETTING_STARTED.md`}
              >
                Start building →
              </a>
            </div>
            <p className="hero-caption">
              Open source · TypeScript + .NET · Your AI provider
            </p>
          </div>
          <div className="hero-art" aria-label="From conversation to action">
            <span className="art-label">A BETTER NEXT MESSAGE</span>
            <p>“Let’s get that sorted.”</p>
            <div className="art-card">
              <span className="art-check" aria-hidden="true">
                ✓
              </span>
              <div>
                <strong>Choose. Confirm. Continue.</strong>
                <span>Your workflow, inside the chat.</span>
              </div>
            </div>
            <div className="art-tags">
              <span>Forms</span>
              <span>Cards</span>
              <span>Live updates</span>
            </div>
            <span className="art-caption">
              Built for the moment after the answer.
            </span>
          </div>
        </section>
        <div className="stack-strip" aria-label="Supported integrations">
          <span>ONE WIDGET CONTRACT.</span>
          <strong>.NET</strong>
          <strong>TypeScript</strong>
          <strong>React</strong>
          <strong>Angular</strong>
          <strong>Blazor</strong>
        </div>
        <Playground />
        <section className="principles" aria-label="Why ChatWidgets">
          <article>
            <span>01 / FIT YOUR PRODUCT</span>
            <h2>Your UI. Your rules.</h2>
            <p>
              Use built-in widgets or register your own renderers. Keep your
              design system and application logic.
            </p>
          </article>
          <article>
            <span>02 / CONNECT THE ACTION</span>
            <h2>From answer to outcome.</h2>
            <p>
              Collect structured input and route named actions to typed handlers
              in your .NET application.
            </p>
          </article>
          <article>
            <span>03 / KEEP IT LIVE</span>
            <h2>Updates that stay in context.</h2>
            <p>
              Stream widget changes as work progresses, without replacing the
              entire conversation.
            </p>
          </article>
        </section>
        <section className="integration">
          <div>
            <p className="eyebrow">BUILD ON YOUR STACK</p>
            <h2>
              A small first step.
              <br />
              Room to make it yours.
            </h2>
            <p>
              Start with one widget. Add live AI responses, custom actions, and
              streaming when your workflow needs them.
            </p>
            <a
              className="secondary-link"
              href={`${REPO}/blob/master/docs_src/INTEGRATION_PATHS.md`}
            >
              Choose your integration →
            </a>
          </div>
          <div className="install-card">
            <p>Install the client</p>
            <pre>
              <code>npm install @bbq-chat/widgets</code>
            </pre>
            <p>Add the .NET backend</p>
            <pre>
              <code>dotnet add package BbQ.ChatWidgets</code>
            </pre>
            <a href={`${REPO}/blob/master/docs_src/guides/PRODUCTION.md`}>
              Production deployment guide →
            </a>
          </div>
        </section>
        <section className="advanced-demos" aria-labelledby="advanced-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">GO DEEPER</p>
              <h2 id="advanced-title">Explore the live integrations.</h2>
              <p>
                These examples require the sample backend and a configured AI
                provider.
              </p>
            </div>
          </div>
          <div className="demo-grid">
            {SCENARIOS.map((scenario) => (
              <button
                className="demo-card"
                key={scenario.id}
                onClick={() => onSelectScenario(scenario.id)}
              >
                <strong>
                  {scenario.name}
                  <span aria-hidden="true">↗</span>
                </strong>
                <span>{scenario.description}</span>
              </button>
            ))}
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <span>BbQ.ChatWidgets · Make the next message useful.</span>
        <a href={`${REPO}/issues`}>Feedback & contributions ↗</a>
      </footer>
    </div>
  );
}
export default HomePage;
