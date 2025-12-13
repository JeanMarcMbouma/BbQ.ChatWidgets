/**
 * Shared types for the chat application
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  widgets?: any[];
  timestamp: Date;
}

export interface ChatContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  threadId: string | null;
}

export enum ScenarioType {
  BasicChat = 'basic',
  StreamingChat = 'streaming',
  TriageAgent = 'triage',
  WidgetsDemo = 'widgets',
  ActionsDemo = 'actions'
}

export interface ScenarioConfig {
  id: ScenarioType;
  name: string;
  description: string;
  endpoint: string;
  features: string[];
  icon: string;
}
