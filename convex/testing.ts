import { Id, TableNames } from './_generated/dataModel';
import { internal } from './_generated/api';
import {
  DatabaseReader,
  internalAction,
  internalMutation,
  mutation,
  query,
} from './_generated/server';
import { v } from 'convex/values';
import schema from './schema';
import { DELETE_BATCH_SIZE, AGENT_FENCE_BOUNDS } from './constants';
import { kickEngine, startEngine, stopEngine } from './aiTown/main';
import { insertInput } from './aiTown/insertInput';
import { fetchEmbedding } from './util/llm';
import { chatCompletion } from './util/llm';
import { startConversationMessage } from './agent/conversation';
import { GameId } from './aiTown/ids';

// Clear all of the tables except for the embeddings cache.
const excludedTables: Array<TableNames> = ['embeddingsCache'];

export const wipeAllTables = internalMutation({
  handler: async (ctx) => {
    for (const tableName of Object.keys(schema.tables)) {
      if (excludedTables.includes(tableName as TableNames)) {
        continue;
      }
      await ctx.scheduler.runAfter(0, internal.testing.deletePage, { tableName, cursor: null });
    }
    // Also clear embeddings cache to fix dimension mismatch issues
    await ctx.scheduler.runAfter(0, internal.testing.deletePage, { tableName: 'embeddingsCache', cursor: null });
  },
});

export const deletePage = internalMutation({
  args: {
    tableName: v.string(),
    cursor: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query(args.tableName as TableNames)
      .paginate({ cursor: args.cursor, numItems: DELETE_BATCH_SIZE });
    for (const row of results.page) {
      await ctx.db.delete(row._id);
    }
    if (!results.isDone) {
      await ctx.scheduler.runAfter(0, internal.testing.deletePage, {
        tableName: args.tableName,
        cursor: results.continueCursor,
      });
    }
  },
});

export const kick = internalMutation({
  handler: async (ctx) => {
    const { worldStatus } = await getDefaultWorld(ctx.db);
    await kickEngine(ctx, worldStatus.worldId);
  },
});

export const stopAllowed = query({
  handler: async () => {
    return !process.env.STOP_NOT_ALLOWED;
  },
});

export const stop = mutation({
  handler: async (ctx) => {
    if (process.env.STOP_NOT_ALLOWED) throw new Error('Stop not allowed');
    const { worldStatus, engine } = await getDefaultWorld(ctx.db);
    if (worldStatus.status === 'inactive' || worldStatus.status === 'stoppedByDeveloper') {
      if (engine.running) {
        throw new Error(`Engine ${engine._id} isn't stopped?`);
      }
      console.debug(`World ${worldStatus.worldId} is already inactive`);
      return;
    }
    console.log(`Stopping engine ${engine._id}...`);
    await ctx.db.patch(worldStatus._id, { status: 'stoppedByDeveloper' });
    await stopEngine(ctx, worldStatus.worldId);
  },
});

export const resume = mutation({
  handler: async (ctx) => {
    const { worldStatus, engine } = await getDefaultWorld(ctx.db);
    if (worldStatus.status === 'running') {
      if (!engine.running) {
        throw new Error(`Engine ${engine._id} isn't running?`);
      }
      console.debug(`World ${worldStatus.worldId} is already running`);
      return;
    }
    console.log(
      `Resuming engine ${engine._id} for world ${worldStatus.worldId} (state: ${worldStatus.status})...`,
    );
    await ctx.db.patch(worldStatus._id, { status: 'running' });
    await startEngine(ctx, worldStatus.worldId);
  },
});

export const archive = internalMutation({
  handler: async (ctx) => {
    const { worldStatus, engine } = await getDefaultWorld(ctx.db);
    if (engine.running) {
      throw new Error(`Engine ${engine._id} is still running!`);
    }
    console.log(`Archiving world ${worldStatus.worldId}...`);
    await ctx.db.patch(worldStatus._id, { isDefault: false });
  },
});

async function getDefaultWorld(db: DatabaseReader) {
  const worldStatus = await db
    .query('worldStatus')
    .filter((q) => q.eq(q.field('isDefault'), true))
    .first();
  if (!worldStatus) {
    throw new Error('No default world found');
  }
  const engine = await db.get(worldStatus.engineId);
  if (!engine) {
    throw new Error(`Engine ${worldStatus.engineId} not found`);
  }
  return { worldStatus, engine };
}

export const debugCreatePlayers = internalMutation({
  args: {
    numPlayers: v.number(),
  },
  handler: async (ctx, args) => {
    const { worldStatus } = await getDefaultWorld(ctx.db);
    for (let i = 0; i < args.numPlayers; i++) {
      const inputId = await insertInput(ctx, worldStatus.worldId, 'join', {
        name: `Robot${i}`,
        description: `This player is a robot.`,
        character: `f${1 + (i % 8)}`,
      });
    }
  },
});

export const randomPositions = internalMutation({
  handler: async (ctx) => {
    const { worldStatus } = await getDefaultWorld(ctx.db);
    const map = await ctx.db
      .query('maps')
      .withIndex('worldId', (q) => q.eq('worldId', worldStatus.worldId))
      .unique();
    if (!map) {
      throw new Error(`No map for world ${worldStatus.worldId}`);
    }
    const world = await ctx.db.get(worldStatus.worldId);
    if (!world) {
      throw new Error(`No world for world ${worldStatus.worldId}`);
    }
    for (const player of world.players) {
      await insertInput(ctx, world._id, 'moveTo', {
        playerId: player.id,
        destination: {
          x: 1 + Math.floor(Math.random() * (map.width - 2)),
          y: 1 + Math.floor(Math.random() * (map.height - 2)),
        },
      });
    }
  },
});

export const testEmbedding = internalAction({
  args: { input: v.string() },
  handler: async (_ctx, args) => {
    return await fetchEmbedding(args.input);
  },
});

export const testCompletion = internalAction({
  args: {},
  handler: async (ctx, args) => {
    return await chatCompletion({
      messages: [
        { content: 'You are helpful', role: 'system' },
        { content: 'Where is pizza?', role: 'user' },
      ],
    });
  },
});

export const testConvo = internalAction({
  args: {},
  handler: async (ctx, args) => {
    const a: any = (await startConversationMessage(
      ctx,
      'm1707m46wmefpejw1k50rqz7856qw3ew' as Id<'worlds'>,
      'c:115' as GameId<'conversations'>,
      'p:0' as GameId<'players'>,
      'p:6' as GameId<'players'>,
    )) as any;
    return await a.readAll();
  },
});

export const checkAgentPositions = query({
  handler: async (ctx) => {
    const { worldStatus } = await getDefaultWorld(ctx.db);
    const world = await ctx.db.get(worldStatus.worldId);
    if (!world) {
      return { error: 'No world found' };
    }

    const result = {
      fenceBounds: AGENT_FENCE_BOUNDS,
      players: [] as any[],
      agentsInFence: 0,
      agentsOutOfFence: 0,
      humansInFence: 0,
      humansOutOfFence: 0,
    };

    for (const player of world.players) {
      const x = Math.floor(player.position.x);
      const y = Math.floor(player.position.y);
      const inFence =
        x >= AGENT_FENCE_BOUNDS.minX &&
        x <= AGENT_FENCE_BOUNDS.maxX &&
        y >= AGENT_FENCE_BOUNDS.minY &&
        y <= AGENT_FENCE_BOUNDS.maxY;

      const isAgent = !player.human;

      result.players.push({
        id: player.id,
        isAgent,
        position: { x: player.position.x, y: player.position.y },
        rounded: { x, y },
        inFence,
        destination: player.pathfinding?.destination,
      });

      if (isAgent) {
        if (inFence) result.agentsInFence++;
        else result.agentsOutOfFence++;
      } else {
        if (inFence) result.humansInFence++;
        else result.humansOutOfFence++;
      }
    }

    return result;
  },
});

export const debugMatchmaking = query({
  handler: async (ctx) => {
    const result = {
      lobbies: [] as any[],
      users: [] as any[],
      worlds: [] as any[]
    };

    // Get all lobbies
    const lobbies = await ctx.db.query('lobbies').collect();
    for (const lobby of lobbies) {
      const lobbyData = {
        id: lobby._id,
        status: lobby.status,
        totalSlots: lobby.totalSlots,
        humanSlotsRequired: lobby.humanSlotsRequired,
        includeCompanions: lobby.includeCompanions,
        additionalAgents: lobby.additionalAgents,
        worldId: lobby.worldId,
        players: [] as any[]
      };

      // Get players in this lobby
      const lobbyPlayers = await ctx.db
        .query('lobbyPlayers')
        .withIndex('lobbyId', (q) => q.eq('lobbyId', lobby._id))
        .collect();

      for (const player of lobbyPlayers) {
        const user = await ctx.db.get(player.userId);
        lobbyData.players.push({
          playerId: player._id,
          userId: player.userId,
          nickname: user?.nickname || 'Unknown',
          character: player.character,
          companionId: player.companionId,
          status: player.status,
          joinedAt: new Date(player.joinedAt).toLocaleString()
        });
      }

      result.lobbies.push(lobbyData);

      // If lobby has a world, check world state
      if (lobby.worldId) {
        const worldStatus = await ctx.db
          .query('worldStatus')
          .withIndex('worldId', (q) => q.eq('worldId', lobby.worldId!))
          .first();

        if (worldStatus) {
          const world = await ctx.db.get(lobby.worldId);
          if (world) {
            const worldData = {
              worldId: lobby.worldId,
              status: worldStatus.status,
              players: world.players.length,
              agents: world.agents.length,
              conversations: world.conversations.length,
              playerDetails: [] as any[]
            };

            // Get player descriptions
            const allPlayerDescs = await ctx.db.query('playerDescriptions').collect();
            for (const player of world.players) {
              const playerDesc = allPlayerDescs.find(pd => pd.playerId === player.id);
              if (playerDesc) {
                worldData.playerDetails.push({
                  playerId: player.id,
                  name: playerDesc.name,
                  character: playerDesc.character,
                  description: playerDesc.description,
                  userId: playerDesc.userId
                });
              }
            }

            result.worlds.push(worldData);
          }
        }
      }
    }

    return result;
  },
});

export const debugFenceArea = query({
  handler: async (ctx) => {
    const { worldStatus } = await getDefaultWorld(ctx.db);
    const map = await ctx.db
      .query('maps')
      .withIndex('worldId', (q) => q.eq('worldId', worldStatus.worldId))
      .unique();
    if (!map) {
      return { error: 'No map found' };
    }

    const blocked = [];
    const free = [];

    // Check a sample of positions in the fence area
    for (let x = AGENT_FENCE_BOUNDS.minX; x <= AGENT_FENCE_BOUNDS.maxX; x += 2) {
      for (let y = AGENT_FENCE_BOUNDS.minY; y <= AGENT_FENCE_BOUNDS.maxY; y += 2) {
        let isBlocked = false;
        let reason = '';

        // Check object tiles
        for (const layer of map.objectTiles) {
          if (layer[x] && layer[x][y] !== -1) {
            isBlocked = true;
            reason = 'object tile: ' + layer[x][y];
            break;
          }
        }

        if (isBlocked) {
          blocked.push({ x, y, reason });
        } else {
          free.push({ x, y });
        }
      }
    }

    return {
      fenceBounds: AGENT_FENCE_BOUNDS,
      mapSize: { width: map.width, height: map.height },
      blocked,
      free,
      blockedCount: blocked.length,
      freeCount: free.length,
    };
  },
});
