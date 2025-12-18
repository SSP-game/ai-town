import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Match Statistics Module
 *
 * Handles queries and mutations for end-of-game statistics display.
 */

/**
 * Get match statistics by ID.
 */
export const getMatchStats = query({
  args: { statsId: v.id('matchStats') },
  handler: async (ctx, { statsId }) => {
    return await ctx.db.get(statsId);
  },
});

/**
 * Get the latest match statistics for a user.
 */
export const getLatestMatchStats = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('matchStats')
      .withIndex('userId', (q) => q.eq('userId', userId))
      .order('desc')
      .first();
  },
});

/**
 * Get all match statistics for a user.
 */
export const getUserMatchHistory = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('matchStats')
      .withIndex('userId', (q) => q.eq('userId', userId))
      .order('desc')
      .collect();
  },
});

/**
 * Dismiss the end screen for match stats.
 * Called when user clicks "Play Again" or navigates away.
 */
export const dismissStats = mutation({
  args: { statsId: v.id('matchStats') },
  handler: async (ctx, { statsId }) => {
    await ctx.db.patch(statsId, { dismissed: true });
  },
});

/**
 * Clear the user's companion selection.
 * Called when user wants to re-select companion after a match.
 */
export const clearCompanionForReplay = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    await ctx.db.patch(userId, {
      selectedCompanion: undefined,
      updatedAt: Date.now(),
    });
  },
});
