import { ConvexError, v } from 'convex/values';
import { MutationCtx, QueryCtx, mutation, query } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { internal } from '../_generated/api';

const OPEN_STATUSES = new Set(['waiting', 'ready_check']);
const DEFAULT_SLUG = 'default';

async function resolveDefaultWorldId(ctx: QueryCtx | MutationCtx) {
  const worldStatus = await ctx.db
    .query('worldStatus')
    .filter((q) => q.eq(q.field('isDefault'), true))
    .first();
  return worldStatus?.worldId;
}

async function resolveConfigId(
  ctx: QueryCtx | MutationCtx,
  slug?: string,
  configId?: Id<'experimentConfigs'>,
) {
  if (configId) {
    return configId;
  }
  const targetSlug = slug ?? DEFAULT_SLUG;
  const config = await ctx.db
    .query('experimentConfigs')
    .withIndex('slug', (q) => q.eq('slug', targetSlug))
    .first();
  if (!config) {
    throw new ConvexError('Experiment config not found');
  }
  return config._id;
}

async function findLatestLobby(
  ctx: QueryCtx | MutationCtx,
  configId: Id<'experimentConfigs'>,
) {
  const lobbies = await ctx.db
    .query('lobbies')
    .withIndex('byConfig', (q) => q.eq('configId', configId))
    .collect();
  if (lobbies.length === 0) {
    return null;
  }
  return lobbies.sort((a, b) => b.createdAt - a.createdAt)[0];
}

async function findOpenLobby(ctx: QueryCtx | MutationCtx, configId: Id<'experimentConfigs'>) {
  const lobbies = await ctx.db
    .query('lobbies')
    .withIndex('byConfig', (q) => q.eq('configId', configId))
    .collect();
  return lobbies.find((lobby) => OPEN_STATUSES.has(lobby.status));
}

async function getOrCreateActiveLobby(ctx: MutationCtx, configId: Id<'experimentConfigs'>) {
  const config = await ctx.db.get(configId);
  if (!config) {
    throw new ConvexError('Experiment config missing');
  }
  const existing = await findOpenLobby(ctx, configId);
  if (existing) {
    return existing;
  }
  const now = Date.now();
  const worldId = await resolveDefaultWorldId(ctx);
  const lobbyId = await ctx.db.insert('lobbies', {
    configId,
    status: 'waiting',
    minPlayers: config.minPlayers,
    pairedChatMinutes: config.pairedChatMinutes,
    worldId,
    createdAt: now,
    startedAt: undefined,
    pairedChatEndsAt: undefined,
    completedAt: undefined,
  });
  const lobby = await ctx.db.get(lobbyId);
  if (!lobby) {
    throw new ConvexError('Failed to create lobby');
  }
  return lobby;
}

async function maybeStartLobby(ctx: MutationCtx, lobbyId: Id<'lobbies'>) {
  const lobby = await ctx.db.get(lobbyId);
  if (!lobby) {
    throw new ConvexError('Lobby not found');
  }
  if (lobby.status === 'paired_chat' || lobby.status === 'free_roam' || lobby.status === 'completed') {
    return;
  }
  const players = await ctx.db
    .query('lobbyPlayers')
    .withIndex('byLobby', (q) => q.eq('lobbyId', lobbyId))
    .collect();
  const readyPlayers = players.filter(
    (player) => player.ready && !!player.questionnaireCompletedAt,
  );
  if (readyPlayers.length < lobby.minPlayers) {
    const shouldReadyCheck = readyPlayers.length > 0;
    const targetStatus = shouldReadyCheck ? 'ready_check' : 'waiting';
    if (lobby.status !== targetStatus) {
      await ctx.db.patch(lobbyId, { status: targetStatus });
    }
    return;
  }

  const now = Date.now();
  const pairedChatEndsAt = now + lobby.pairedChatMinutes * 60_000;

  const sessionId = await ctx.db.insert('sessions', {
    lobbyId,
    status: 'paired_chat',
    pairedChatEndsAt,
    createdAt: now,
    updatedAt: now,
  });

  await ctx.db.patch(lobbyId, {
    status: 'paired_chat',
    startedAt: now,
    pairedChatEndsAt,
  });

  for (const player of players) {
    await ctx.db.patch(player._id, {
      status: readyPlayers.some((ready) => ready._id === player._id) ? 'paired_chat' : player.status,
      ready: readyPlayers.some((ready) => ready._id === player._id),
    });
  }

  await ctx.scheduler.runAfter(0, internal.experiment.sessions.startPairedChatSession, {
    sessionId,
  });
}

export const joinLobby = mutation({
  args: {
    userId: v.id('users'),
    configId: v.optional(v.id('experimentConfigs')),
    slug: v.optional(v.string()),
    onboardingCompletedAt: v.number(),
    questionnaireCompletedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId, onboardingCompletedAt, questionnaireCompletedAt } = args;
    const configId = await resolveConfigId(ctx, args.slug, args.configId);
    const lobby = await getOrCreateActiveLobby(ctx, configId);

    const membership = await ctx.db
      .query('lobbyPlayers')
      .withIndex('byLobby', (q) => q.eq('lobbyId', lobby._id))
      .filter((q) => q.eq(q.field('userId'), userId))
      .unique();

    if (membership) {
      await ctx.db.patch(membership._id, {
        onboardingCompletedAt,
        questionnaireCompletedAt,
        status: membership.ready ? 'ready' : 'waiting',
      });
    } else {
      await ctx.db.insert('lobbyPlayers', {
        lobbyId: lobby._id,
        userId,
        ready: false,
        readyAt: undefined,
        onboardingCompletedAt,
        questionnaireCompletedAt,
        status: 'waiting',
      });
    }

    return { lobbyId: lobby._id };
  },
});

export const setReadyStatus = mutation({
  args: {
    lobbyId: v.id('lobbies'),
    userId: v.id('users'),
    ready: v.boolean(),
  },
  handler: async (ctx, { lobbyId, userId, ready }) => {
    const membership = await ctx.db
      .query('lobbyPlayers')
      .withIndex('byLobby', (q) => q.eq('lobbyId', lobbyId))
      .filter((q) => q.eq(q.field('userId'), userId))
      .unique();
    if (!membership) {
      throw new ConvexError('Player is not part of the lobby');
    }

    const now = Date.now();
    await ctx.db.patch(membership._id, {
      ready,
      readyAt: ready ? now : undefined,
      status: ready ? 'ready' : 'waiting',
    });

    await maybeStartLobby(ctx, lobbyId);

    return { success: true };
  },
});

export const watchLobby = query({
  args: {
    lobbyId: v.optional(v.id('lobbies')),
    userId: v.optional(v.id('users')),
    configId: v.optional(v.id('experimentConfigs')),
    slug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let resolvedLobbyId: Id<'lobbies'> | null = args.lobbyId ?? null;
    if (!resolvedLobbyId) {
      const configId = await resolveConfigId(ctx, args.slug, args.configId);
      const lobby = (await findOpenLobby(ctx, configId)) ?? (await findLatestLobby(ctx, configId));
      if (!lobby) {
        return null;
      }
      resolvedLobbyId = lobby._id;
    }
    if (resolvedLobbyId === null) {
      return null;
    }
    const finalLobbyId = resolvedLobbyId;
    const lobby = await ctx.db.get(finalLobbyId);
    if (!lobby) {
      return null;
    }

    const players = await ctx.db
      .query('lobbyPlayers')
      .withIndex('byLobby', (q) => q.eq('lobbyId', finalLobbyId))
      .collect();
    const readyPlayers = players.filter((player) => player.ready);
    const fullyPrepared = players.filter((player) => !!player.questionnaireCompletedAt);
    const you = args.userId
      ? players.find((player) => player.userId === args.userId)
      : undefined;

    let session = null;
    if (lobby.status !== 'waiting' && lobby.status !== 'ready_check') {
      const sessions = await ctx.db
        .query('sessions')
        .withIndex('byLobby', (q) => q.eq('lobbyId', lobby._id))
        .collect();
      session = sessions.sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;
    }

    return {
      lobbyId: lobby._id,
      status: lobby.status,
      minPlayers: lobby.minPlayers,
      pairedChatMinutes: lobby.pairedChatMinutes,
      readyCount: readyPlayers.length,
      totalPlayers: players.length,
      fullyPrepared: fullyPrepared.length,
      startedAt: lobby.startedAt ?? null,
      pairedChatEndsAt: lobby.pairedChatEndsAt ?? session?.pairedChatEndsAt ?? null,
      you: you
        ? {
            ready: you.ready,
            status: you.status,
            readyAt: you.readyAt ?? null,
            questionnaireCompletedAt: you.questionnaireCompletedAt,
          }
        : null,
      sessionId: session?._id ?? null,
    };
  },
});
