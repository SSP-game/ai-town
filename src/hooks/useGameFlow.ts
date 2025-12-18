import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { GameFlowStep, GameFlowState } from '../types/gameFlow';

/**
 * Custom hook to manage game flow state.
 *
 * This hook queries the backend to determine the current step in the game flow.
 * The step is computed from the database state, ensuring consistency across sessions.
 *
 * @param userId - The user's ID, or null if not logged in
 * @returns The current game flow state
 */
export function useGameFlow(userId: Id<'users'> | null) {
  // Query the backend for the current flow state
  // Skip the query if no userId (user not logged in)
  const flowState = useQuery(
    api.gameFlow.getCurrentFlowState,
    userId ? { userId } : 'skip'
  ) as GameFlowState | undefined;

  // Determine the current step
  // If no userId, user is at login step
  // If query is loading, return 'loading' as a special case
  const currentStep: GameFlowStep | 'loading' = !userId
    ? 'login'
    : flowState?.step ?? 'loading';

  return {
    /** Current step in the game flow (or 'loading' if query in progress) */
    currentStep,
    /** Whether the flow state is still loading */
    isLoading: userId !== null && !flowState,
    /** Lobby ID if user is in lobby/game/end */
    lobbyId: flowState?.lobbyId as Id<'lobbies'> | undefined,
    /** World ID if user is in game */
    worldId: flowState?.worldId as Id<'worlds'> | undefined,
    /** Stats ID if user is viewing end screen */
    statsId: flowState?.statsId as Id<'matchStats'> | undefined,
    /** The raw flow state from the backend */
    flowState,
  };
}

/**
 * Hook to check if a specific step is accessible.
 * Useful for navigation guards.
 */
export function useCanAccessStep(userId: Id<'users'> | null, targetStep: GameFlowStep): boolean {
  const { currentStep, isLoading } = useGameFlow(userId);

  if (isLoading) return false;
  if (currentStep === 'loading') return false;

  // Define step order
  const stepOrder: GameFlowStep[] = ['login', 'survey', 'companion', 'lobby', 'game', 'end'];
  const currentIndex = stepOrder.indexOf(currentStep as GameFlowStep);
  const targetIndex = stepOrder.indexOf(targetStep);

  // Can only access current step (strict flow)
  return currentIndex === targetIndex;
}
