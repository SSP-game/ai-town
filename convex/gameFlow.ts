import { v } from 'convex/values';
import { query } from './_generated/server';

/**
 * Game Flow State Query
 *
 * Computes the current step in the game flow based on user's state.
 * Steps: login -> survey -> companion -> lobby -> game -> end -> (companion cycle)
 */

export type GameFlowStep = 'login' | 'survey' | 'companion' | 'lobby' | 'game' | 'end';

export interface GameFlowState {
  step: GameFlowStep;
  lobbyId?: string;
  worldId?: string;
  statsId?: string;
}

/**
 * Get the current game flow state for a user.
 * The step is computed from database state, ensuring consistency across sessions.
 */
export const getCurrentFlowState = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }): Promise<GameFlowState> => {
    // Get user record
    const user = await ctx.db.get(userId);
    if (!user) {
      return { step: 'login' };
    }

    // Step 1: Check if survey is completed
    if (!user.surveyCompleted) {
      return { step: 'survey' };
    }

    // Step 2: Check if companion is selected
    if (!user.selectedCompanion) {
      return { step: 'companion' };
    }

    // Step 3: Check for active match (lobby with 'active' status)
    const lobbyPlayer = await ctx.db
      .query('lobbyPlayers')
      .withIndex('userId', (q) => q.eq('userId', userId))
      .filter((q) =>
        q.or(
          q.eq(q.field('status'), 'waiting'),
          q.eq(q.field('status'), 'matched'),
          q.eq(q.field('status'), 'playing')
        )
      )
      .first();

    if (lobbyPlayer) {
      const lobby = await ctx.db.get(lobbyPlayer.lobbyId);

      if (lobby) {
        // If lobby is active with a world, user is in GAME step
        if (lobby.status === 'active' && lobby.worldId) {
          return {
            step: 'game',
            lobbyId: lobby._id,
            worldId: lobby.worldId,
          };
        }

        // If waiting or matched, user is in LOBBY step
        if (lobby.status === 'waiting' || lobby.status === 'matched') {
          return {
            step: 'lobby',
            lobbyId: lobby._id,
          };
        }
      }
    }

    // Step 4: Check for recent undismissed match stats (END screen)
    const recentStats = await ctx.db
      .query('matchStats')
      .withIndex('userId', (q) => q.eq('userId', userId))
      .order('desc')
      .first();

    // Show end screen if:
    // 1. Stats exist and not dismissed
    // 2. Match ended within last 10 minutes (to prevent stale end screens)
    const TEN_MINUTES = 10 * 60 * 1000;
    if (recentStats && !recentStats.dismissed) {
      const timeSinceEnd = Date.now() - recentStats.endedAt;
      if (timeSinceEnd < TEN_MINUTES) {
        return {
          step: 'end',
          statsId: recentStats._id,
          lobbyId: recentStats.lobbyId,
          worldId: recentStats.worldId,
        };
      }
    }

    // Default: User should be in LOBBY step (ready to join matchmaking)
    return { step: 'lobby' };
  },
});

/**
 * Check if user has completed the survey.
 */
export const hasSurveyCompleted = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }): Promise<boolean> => {
    const user = await ctx.db.get(userId);
    return user?.surveyCompleted ?? false;
  },
});

/**
 * Check if user has selected a companion.
 */
export const hasCompanionSelected = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }): Promise<boolean> => {
    const user = await ctx.db.get(userId);
    return !!user?.selectedCompanion;
  },
});
