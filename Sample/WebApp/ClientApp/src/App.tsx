import { useState } from 'react';
import { ScenarioType } from './types';
import { HomePage } from './pages/HomePage';
import { BasicChatPage } from './pages/BasicChatPage';
import { StreamingChatPage } from './pages/StreamingChatPage';
import { TriageAgentPage } from './pages/TriageAgentPage';
import { WidgetsDemoPage } from './pages/WidgetsDemoPage';
import { ActionsDemoPage } from './pages/ActionsDemoPage';
import './styles/App.css';

function App() {
  const [currentPage, setCurrentPage] = useState<ScenarioType | null>(null);

  const handleBack = () => {
    setCurrentPage(null);
  };

  const handleSelectScenario = (scenario: ScenarioType) => {
    setCurrentPage(scenario);
  };

  // Render the appropriate page based on current selection
  if (currentPage === null) {
    return <HomePage onSelectScenario={handleSelectScenario} />;
  }

  if (currentPage === ScenarioType.BasicChat) {
    return <BasicChatPage onBack={handleBack} />;
  }

  if (currentPage === ScenarioType.StreamingChat) {
    return <StreamingChatPage onBack={handleBack} />;
  }

  if (currentPage === ScenarioType.TriageAgent) {
    return <TriageAgentPage onBack={handleBack} />;
  }

  if (currentPage === ScenarioType.WidgetsDemo) {
    return <WidgetsDemoPage onBack={handleBack} />;
  }

  if (currentPage === ScenarioType.ActionsDemo) {
    return <ActionsDemoPage onBack={handleBack} />;
  }

  return <HomePage onSelectScenario={handleSelectScenario} />;
}

export default App;
