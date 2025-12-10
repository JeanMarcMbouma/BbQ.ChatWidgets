/**
 * Represents the role of a participant in a chat conversation
 */
export enum ChatRole {
  /**
   * A message from the user
   */
  User = 'user',

  /**
   * A message from the assistant/AI
   */
  Assistant = 'assistant',
}

/**
 * Represents a single turn in a chat conversation
 *
 * A chat turn encapsulates a message in the conversation, either from the user or the assistant.
 * It includes:
 * - The role (who sent the message: User or Assistant)
 * - The content (the text of the message)
 * - Optional widgets (interactive UI elements embedded in the response)
 * - The thread ID (for tracking multi-turn conversations)
 */
export interface ChatTurn {
  /**
   * The role of the message sender (User or Assistant)
   */
  role: ChatRole | string;

  /**
   * The text content of this turn's message
   */
  content: string;

  /**
   * Optional interactive widgets embedded in this turn's content
   */
  widgets?: ChatWidget[] | null;

  /**
   * The conversation thread ID this turn belongs to
   */
  threadId?: string;
}

import { ChatWidget } from './ChatWidget';
