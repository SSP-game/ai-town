import { Id } from '../../convex/_generated/dataModel';

/**
 * Game Flow Types
 *
 * Defines the steps and state for the game flow system.
 */

/**
 * The possible steps in the game flow.
 * Users progress through these steps in order:
 * LOGIN -> SURVEY -> COMPANION -> LOBBY -> GAME -> END -> (COMPANION cycle)
 */
export type GameFlowStep = 'login' | 'survey' | 'companion' | 'lobby' | 'game' | 'end';

/**
 * The state returned by the game flow query.
 */
export interface GameFlowState {
  /** Current step in the game flow */
  step: GameFlowStep;
  /** Lobby ID if user is in lobby/game/end */
  lobbyId?: Id<'lobbies'>;
  /** World ID if user is in game */
  worldId?: Id<'worlds'>;
  /** Stats ID if user is viewing end screen */
  statsId?: Id<'matchStats'>;
}

/**
 * Match statistics displayed on the end screen.
 */
export interface MatchStats {
  _id: Id<'matchStats'>;
  lobbyId: Id<'lobbies'>;
  worldId: Id<'worlds'>;
  userId: Id<'users'>;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  totalConversations: number;
  conversationPartners: string[];
  messagesSent: number;
  messagesReceived: number;
  dismissed: boolean;
  createdAt: number;
}

/**
 * User data required for game flow.
 */
export interface GameFlowUser {
  userId: Id<'users'>;
  nickname: string;
  email: string;
  selectedCharacter?: string;
  selectedCompanion?: string;
  surveyCompleted?: boolean;
}
