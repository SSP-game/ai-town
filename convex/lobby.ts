import { v } from 'convex/values';
import { mutation, query, internalMutation } from './_generated/server';
import { internal as internalApi } from './_generated/api';
import { Id } from './_generated/dataModel';
import lobbyConfig from '../data/lobby-config.json';
import { createEngine } from './aiTown/main';
import { ENGINE_ACTION_DURATION } from './constants';
import * as map from '../data/gentle.js';
import { insertInput } from './aiTown/insertInput';

// Get online users count (5-minute window for better accuracy)
export const getOnlineUsersCount = query({
  args: {},
  handler: async (ctx) => {
    // Count all active users with a recent lastLoginAt
    // If lastLoginAt is undefined, user hasn't logged in yet
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const allActiveUsers = await ctx.db
      .query('users')
      .withIndex('isActive', (q) => q.eq('isActive', true))
      .collect();

    // Filter users who have lastLoginAt and it's recent (within last 5 minutes)
    const recentUsers = allActiveUsers.filter(
      (user) => user.lastLoginAt !== undefined && user.lastLoginAt >= fiveMinutesAgo
    );

    return recentUsers.length;
  },
});

// Get user's current lobby status
export const getUserLobbyStatus = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Find user's current lobby player record
    const lobbyPlayer = await ctx.db
      .query('lobbyPlayers')
      .withIndex('userId', (q) => q.eq('userId', args.userId))
      .first();

    if (!lobbyPlayer) {
      return null;
    }

    // Get the lobby
    const lobby = await ctx.db.get(lobbyPlayer.lobbyId);
    if (!lobby) {
      return null;
    }

    // Get all players in this lobby
    const allPlayers = await ctx.db
      .query('lobbyPlayers')
      .withIndex('lobbyId', (q) => q.eq('lobbyId', lobby._id))
      .collect();

    // Get user profiles for all players
    const playersWithProfiles = await Promise.all(
      allPlayers.map(async (player) => {
        const user = await ctx.db.get(player.userId);
        return {
          ...player,
          nickname: user?.nickname || 'Unknown',
        };
      })
    );

    return {
      lobby,
      currentPlayer: lobbyPlayer,
      allPlayers: playersWithProfiles,
      queuePosition: allPlayers.findIndex((p) => p._id === lobbyPlayer._id) + 1,
      totalInQueue: allPlayers.filter((p) => p.status === 'waiting').length,
    };
  },
});

// Join matchmaking
export const joinMatchmaking = mutation({
  args: {
    userId: v.id('users'),
    character: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already in a lobby
    const existingPlayer = await ctx.db
      .query('lobbyPlayers')
      .withIndex('userId', (q) => q.eq('userId', args.userId))
      .first();

    if (existingPlayer) {
      throw new Error('Already in matchmaking');
    }

    // Get user data
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Find or create a waiting lobby
    let lobbyId: Id<'lobbies'>;

    const waitingLobby = await ctx.db
      .query('lobbies')
      .withIndex('status', (q) => q.eq('status', 'waiting'))
      .first();

    if (waitingLobby) {
      // Check if lobby has space
      const currentPlayers = await ctx.db
        .query('lobbyPlayers')
        .withIndex('lobbyId', (q) => q.eq('lobbyId', waitingLobby._id))
        .collect();

      if (currentPlayers.length >= waitingLobby.humanSlotsRequired) {
        // Lobby is full, create new one
        lobbyId = await createNewLobby(ctx);
      } else {
        lobbyId = waitingLobby._id;
      }
    } else {
      // No waiting lobby, create new one
      lobbyId = await createNewLobby(ctx);
    }

    // Add player to lobby
    const lobbyPlayerId = await ctx.db.insert('lobbyPlayers', {
      lobbyId,
      userId: args.userId,
      character: args.character,
      companionId: user.selectedCompanion,
      status: 'waiting',
      joinedAt: Date.now(),
    });

    // Check if match is ready
    await ctx.scheduler.runAfter(0, internalApi.lobby.checkMatchmaking, { lobbyId });

    return { lobbyId, lobbyPlayerId };
  },
});

// Leave matchmaking
export const leaveMatchmaking = mutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const lobbyPlayer = await ctx.db
      .query('lobbyPlayers')
      .withIndex('userId', (q) => q.eq('userId', args.userId))
      .first();

    if (!lobbyPlayer) {
      return; // Not in any lobby
    }

    // Delete the player record
    await ctx.db.delete(lobbyPlayer._id);

    // Check if lobby is now empty
    const lobby = await ctx.db.get(lobbyPlayer.lobbyId);
    if (lobby && lobby.status === 'waiting') {
      const remainingPlayers = await ctx.db
        .query('lobbyPlayers')
        .withIndex('lobbyId', (q) => q.eq('lobbyId', lobby._id))
        .collect();

      if (remainingPlayers.length === 0) {
        // Delete empty lobby
        await ctx.db.delete(lobby._id);
      }
    }
  },
});

// Internal function to create a new lobby
async function createNewLobby(ctx: any): Promise<Id<'lobbies'>> {
  const config = lobbyConfig.matchmaking;

  return await ctx.db.insert('lobbies', {
    status: 'waiting',
    totalSlots: config.totalSlots,
    humanSlotsRequired: config.humanPlayersRequired,
    includeCompanions: config.includeCompanions,
    additionalAgents: config.additionalAgents,
    createdAt: Date.now(),
  });
}

// Internal matchmaking check
export const checkMatchmaking = internalMutation({
  args: {
    lobbyId: v.id('lobbies'),
  },
  handler: async (ctx, args) => {
    const lobby = await ctx.db.get(args.lobbyId);
    if (!lobby || lobby.status !== 'waiting') {
      return;
    }

    // Get all waiting players
    const players = await ctx.db
      .query('lobbyPlayers')
      .withIndex('lobbyId', (q) => q.eq('lobbyId', args.lobbyId))
      .filter((q) => q.eq(q.field('status'), 'waiting'))
      .collect();

    // Check if we have enough human players
    if (players.length >= lobby.humanSlotsRequired) {
      // Match found! Update lobby status
      await ctx.db.patch(args.lobbyId, {
        status: 'matched',
        matchedAt: Date.now(),
      });

      // Update all player statuses
      for (const player of players) {
        await ctx.db.patch(player._id, {
          status: 'matched',
        });
      }

      // Schedule world creation
      await ctx.scheduler.runAfter(0, internalApi.lobby.createMatchWorld, {
        lobbyId: args.lobbyId,
      });
    }
  },
});

// Internal function to create world for matched lobby
export const createMatchWorld = internalMutation({
  args: {
    lobbyId: v.id('lobbies'),
  },
  handler: async (ctx, args) => {
    const lobby = await ctx.db.get(args.lobbyId);
    if (!lobby || lobby.status !== 'matched') {
      return;
    }

    // Get all matched players
    const players = await ctx.db
      .query('lobbyPlayers')
      .withIndex('lobbyId', (q) => q.eq('lobbyId', args.lobbyId))
      .filter((q) => q.eq(q.field('status'), 'matched'))
      .collect();

    // Create a new isolated world for this match
    const engineId = await createEngine(ctx);
    const engine = (await ctx.db.get(engineId))!;

    const worldId = await ctx.db.insert('worlds', {
      nextId: 0,
      agents: [],
      conversations: [],
      players: [],
    });

    const now = Date.now();
    await ctx.db.insert('worldStatus', {
      engineId: engineId,
      isDefault: false, // This is a match world, not the default world
      lastViewed: now,
      status: 'running',
      worldId: worldId,
    });

    // Create map for the world
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

    // Start the engine immediately
    await ctx.scheduler.runAfter(0, internalApi.aiTown.main.runStep, {
      worldId,
      generationNumber: engine.generationNumber,
      maxDuration: ENGINE_ACTION_DURATION,
    });

    // Add human players and their companions
    let agentCount = 0;
    for (const player of players) {
      const user = await ctx.db.get(player.userId);
      if (!user) continue;

      // Join the player to the world (creates human player character)
      const playerName = user?.nickname || 'Player';
      await insertInput(ctx, worldId, 'join', {
        name: playerName,
        character: player.character,
        description: `${playerName} is a human player`,
        tokenIdentifier: player.userId, // Use userId as unique identifier
        userId: player.userId,
      });

      // Add player's companion if configured
      if (lobby.includeCompanions && player.companionId) {
        await insertInput(ctx, worldId, 'createAgent', {
          descriptionIndex: agentCount % 13, // 13 characters available (0-12)
          companionOfUserId: player.userId,
        });
        agentCount++;
      }
    }

    // Add additional AI agents if configured
    for (let i = 0; i < lobby.additionalAgents; i++) {
      await insertInput(ctx, worldId, 'createAgent', {
        descriptionIndex: agentCount % 13,
      });
      agentCount++;
    }

    const worldDuration = lobbyConfig.world.worldDuration;
    const startedAt = Date.now();
    const expiresAt = startedAt + worldDuration;

    await ctx.db.patch(args.lobbyId, {
      status: 'active',
      worldId: worldId,
      startedAt,
      expiresAt,
    });

    // Schedule expiration check
    await ctx.scheduler.runAfter(worldDuration, internalApi.lobby.checkWorldExpiration, {
      lobbyId: args.lobbyId,
    });

    // Update player statuses to 'playing'
    for (const player of players) {
      await ctx.db.patch(player._id, {
        status: 'playing',
      });
    }
  },
});

// Internal function to check and handle world expiration
export const checkWorldExpiration = internalMutation({
  args: {
    lobbyId: v.id('lobbies'),
  },
  handler: async (ctx, args) => {
    const lobby = await ctx.db.get(args.lobbyId);
    if (!lobby || lobby.status !== 'active') {
      return;
    }

    // Check if world has expired
    const now = Date.now();
    if (lobby.expiresAt && now >= lobby.expiresAt) {
      // Update lobby status to expired
      await ctx.db.patch(args.lobbyId, {
        status: 'expired',
        completedAt: now,
      });

      // Update all players to 'left' status so they can rejoin matchmaking
      const players = await ctx.db
        .query('lobbyPlayers')
        .withIndex('lobbyId', (q) => q.eq('lobbyId', args.lobbyId))
        .collect();

      for (const player of players) {
        await ctx.db.patch(player._id, {
          status: 'left',
        });
      }

      // Stop the world's engine if it exists
      const worldId = lobby.worldId;
      if (worldId) {
        const worldStatus = await ctx.db
          .query('worldStatus')
          .withIndex('worldId', (q) => q.eq('worldId', worldId))
          .first();

        if (worldStatus) {
          await ctx.db.patch(worldStatus._id, {
            status: 'inactive',
          });
        }
      }
    }
  },
});

// Export internal API for scheduler
export const internal = {
  checkMatchmaking,
  createMatchWorld,
  checkWorldExpiration,
};
