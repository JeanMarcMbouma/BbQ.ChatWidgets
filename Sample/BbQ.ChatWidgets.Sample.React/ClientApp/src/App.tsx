import { lazy, Suspense, useState } from "react";
import { ScenarioType } from "./types";
import { HomePage } from "./pages/HomePage";
const BasicChatPage = lazy(() =>
  import("./pages/BasicChatPage").then((module) => ({
    default: module.BasicChatPage,
  })),
);
const StreamingChatPage = lazy(() =>
  import("./pages/StreamingChatPage").then((module) => ({
    default: module.StreamingChatPage,
  })),
);
const TriageAgentPage = lazy(() =>
  import("./pages/TriageAgentPage").then((module) => ({
    default: module.TriageAgentPage,
  })),
);
const MultiTurnAgentPage = lazy(() =>
  import("./pages/MultiTurnAgentPage").then((module) => ({
    default: module.MultiTurnAgentPage,
  })),
);
const ClassifiedMultiTurnPage = lazy(() =>
  import("./pages/ClassifiedMultiTurnPage").then((module) => ({
    default: module.ClassifiedMultiTurnPage,
  })),
);
const VoiceChatPage = lazy(() =>
  import("./pages/VoiceChatPage").then((module) => ({
    default: module.VoiceChatPage,
  })),
);
const WidgetsDemoPage = lazy(() =>
  import("./pages/WidgetsDemoPage").then((module) => ({
    default: module.WidgetsDemoPage,
  })),
);
const ActionsDemoPage = lazy(() =>
  import("./pages/ActionsDemoPage").then((module) => ({
    default: module.ActionsDemoPage,
  })),
);
const SseWidgetsPage = lazy(() =>
  import("./pages/SseWidgetsPage").then((module) => ({
    default: module.SseWidgetsPage,
  })),
);
const SseClockPage = lazy(() =>
  import("./pages/SseClockPage").then((module) => ({
    default: module.SseClockPage,
  })),
);
import "./styles/App.css";

function ScenarioRouter() {
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

  if (currentPage === ScenarioType.MultiTurnAgent) {
    return <MultiTurnAgentPage onBack={handleBack} />;
  }

  if (currentPage === ScenarioType.ClassifiedMultiTurn) {
    return <ClassifiedMultiTurnPage onBack={handleBack} />;
  }

  if (currentPage === ScenarioType.VoiceChat) {
    return <VoiceChatPage onBack={handleBack} />;
  }

  if (currentPage === ScenarioType.WidgetsDemo) {
    return <WidgetsDemoPage onBack={handleBack} />;
  }

  if (currentPage === ScenarioType.SseWidgets) {
    return <SseWidgetsPage onBack={handleBack} />;
  }

  if (currentPage === ScenarioType.SseClock) {
    return <SseClockPage onBack={handleBack} />;
  }

  if (currentPage === ScenarioType.ActionsDemo) {
    return <ActionsDemoPage onBack={handleBack} />;
  }

  return <HomePage onSelectScenario={handleSelectScenario} />;
}

function App() {
  return (
    <Suspense
      fallback={
        <div className="page-loading" role="status">
          Loading example…
        </div>
      }
    >
      <ScenarioRouter />
    </Suspense>
  );
}
export default App;
