import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { MutationCtx } from './_generated/server';
import { Id } from './_generated/dataModel';
import { createEngine } from './aiTown/main';
import * as map from '../data/gentle';
import { insertInput } from './aiTown/insertInput';
import { ENGINE_ACTION_DURATION, COMPANION_SEPARATE_WORLD } from './constants';
import { internal } from './_generated/api';
import { Descriptions } from '../data/characters';

/**
 * Get or create a companion-specific world for a user and their companion
 * This world is isolated from the main game world when COMPANION_SEPARATE_WORLD is true
 */
export const getOrCreateCompanionWorld = mutation({
  args: {
    userId: v.id('users'),
    companionAgentId: v.string(), // Agent ID from the main world
  },
  handler: async (ctx, args) => {
    // If companion separate world is disabled, return null (use main world)
    if (!COMPANION_SEPARATE_WORLD) {
      return null;
    }

    const now = Date.now();

    // Look for existing companion world for this user-companion pair
    const existingWorldStatus = await ctx.db
      .query('companionWorldStatus')
      .withIndex('by_user_companion', (q) =>
        q.eq('userId', args.userId).eq('companionAgentId', args.companionAgentId)
      )
      .first();

    if (existingWorldStatus) {
      // Update last viewed time
      await ctx.db.patch(existingWorldStatus._id, {
        lastViewed: now,
      });

      return {
        worldId: existingWorldStatus.worldId,
        engineId: existingWorldStatus.engineId,
        status: existingWorldStatus.status,
      };
    }

    // Create a new companion world
    const engineId = await createEngine(ctx);
    const worldId = await ctx.db.insert('worlds', {
      nextId: 0,
      agents: [],
      conversations: [],
      players: [],
    });

    // Create worldStatus for game engine compatibility
    await ctx.db.insert('worldStatus', {
      worldId,
      engineId,
      isDefault: false,
      lastViewed: now,
      status: 'running',
    });

    // Create companion-specific world status for tracking
    const worldStatusId = await ctx.db.insert('companionWorldStatus', {
      engineId,
      userId: args.userId,
      companionAgentId: args.companionAgentId,
      lastViewed: now,
      status: 'running',
      worldId,
    });

    // Create map for the companion world
    await ctx.db.insert('maps', {
      worldId,
      width: map.mapwidth,
      height: map.mapheight,
      tileSetUrl: map.tilesetpath,
      tileSetDimX: map.tilesetpxw,
      tileSetDimY: map.tilesetpxh,
      tileDim: map.tiledim,
      bgTiles: map.bgtiles,
      objectTiles: map.objmap,
      animatedSprites: map.animatedsprites,
    });

    const engine = (await ctx.db.get(engineId))!;

    // Start the engine
    await ctx.scheduler.runAfter(0, internal.aiTown.main.runStep, {
      worldId,
      generationNumber: engine.generationNumber,
      maxDuration: ENGINE_ACTION_DURATION,
    });

    // Find the companion agent's description from the main world
    const defaultWorld = await ctx.db
      .query('worldStatus')
      .filter((q) => q.eq(q.field('isDefault'), true))
      .unique();

    if (defaultWorld) {
      // Get the companion agent's description from the main world
      const agentDescription = await ctx.db
        .query('agentDescriptions')
        .withIndex('worldId', (q) =>
          q.eq('worldId', defaultWorld.worldId).eq('agentId', args.companionAgentId)
        )
        .unique();

      if (agentDescription) {
        // Find the matching description index by comparing identity
        const descriptionIndex = Descriptions.findIndex(
          (desc) => desc.identity === agentDescription.identity
        );

        if (descriptionIndex >= 0) {
          // Create the companion agent in the companion world
          await insertInput(ctx, worldId, 'createAgent', {
            descriptionIndex,
          });
        }
      }
    }

    // Get user information to create their player
    const user = await ctx.db.get(args.userId);
    if (user && user.selectedCharacter) {
      // Create the user's player in the companion world
      await insertInput(ctx, worldId, 'join', {
        name: user.nickname,
        character: user.selectedCharacter,
        description: user.bio || `A player named ${user.nickname}`,
        userId: args.userId,
      });
    }

    return {
      worldId,
      engineId,
      status: 'running' as const,
    };
  },
});

/**
 * Query to check if companion separate world feature is enabled
 */
export const isCompanionSeparateWorldEnabled = query({
  handler: async () => {
    return COMPANION_SEPARATE_WORLD;
  },
});

/**
 * Clean up old/unused companion worlds
 */
export const cleanupCompanionWorlds = mutation({
  args: {
    maxAge: v.optional(v.number()), // Max age in milliseconds, default 24 hours
  },
  handler: async (ctx, args) => {
    const maxAge = args.maxAge ?? 24 * 60 * 60 * 1000; // 24 hours
    const cutoff = Date.now() - maxAge;

    const worlds = await ctx.db.query('companionWorldStatus').collect();
    for (const worldStatus of worlds) {
      if (worldStatus.lastViewed < cutoff) {
        console.log(`Cleaning up old companion world ${worldStatus._id}`);

        // Clean up the world
        await ctx.db.delete(worldStatus._id);

        // Note: Additional cleanup of world data, engine, etc. would go here
        // For now, we just delete the status entry
      }
    }
  },
});
