import { ConvexError, v } from 'convex/values';
import { MutationCtx, QueryCtx, internalMutation, mutation, query } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { api, internal } from '../_generated/api';

async function loadSession(ctx: QueryCtx | MutationCtx, sessionId: Id<'sessions'>) {
  const session = await ctx.db.get(sessionId);
  if (!session) {
    throw new ConvexError('Session not found');
  }
  return session;
}

async function loadLobby(ctx: QueryCtx | MutationCtx, lobbyId: Id<'lobbies'>) {
  const lobby = await ctx.db.get(lobbyId);
  if (!lobby) {
    throw new ConvexError('Lobby not found');
  }
  return lobby;
}

export const startPairedChatSession = internalMutation({
  args: {
    sessionId: v.id('sessions'),
  },
  handler: async (ctx, { sessionId }) => {
    const session = await loadSession(ctx, sessionId);
    if (session.status !== 'paired_chat') {
      return { status: session.status };
    }
    const lobby = await loadLobby(ctx, session.lobbyId);
    if (!lobby.worldId) {
      throw new ConvexError('Lobby is missing a world assignment');
    }
    const lobbyPlayers = await ctx.db
      .query('lobbyPlayers')
      .withIndex('byLobby', (q) => q.eq('lobbyId', lobby._id))
      .collect();
    const participants = lobbyPlayers.filter((player) => player.status === 'paired_chat');
    if (participants.length === 0) {
      throw new ConvexError('No participants ready for paired chat');
    }

    const assignments = await ctx.db
      .query('sessionAgents')
      .withIndex('bySession', (q) => q.eq('sessionId', sessionId))
      .collect();
    const assignmentsByUser = new Map(assignments.map((assignment) => [assignment.userId, assignment]));

    const world = await ctx.db.get(lobby.worldId);
    const worldAgents = world?.agents ?? [];
    const worldPlayers = world?.players ?? [];
    if (worldAgents.length === 0) {
      throw new ConvexError('No AI agents available in the world for pairing');
    }

    let agentIndex = 0;
    const pairedChatEndsAt = session.pairedChatEndsAt ?? Date.now() + lobby.pairedChatMinutes * 60_000;
    if (!session.pairedChatEndsAt) {
      await ctx.db.patch(sessionId, { pairedChatEndsAt });
      await ctx.db.patch(lobby._id, { pairedChatEndsAt });
    }

    const results: Array<{ userId: Id<'users'>; agentId: string; chatId: Id<'userAgentChats'> }> = [];

    for (const participant of participants) {
      await ctx.db.patch(participant._id, {
        ready: false,
      });
      const existingAssignment = assignmentsByUser.get(participant.userId);
      const agentDoc = worldAgents[agentIndex % worldAgents.length];
      agentIndex += 1;
      const agentId = agentDoc.id;

      const chatId = await ctx.runMutation(api.users.createOrGetChat, {
        userId: participant.userId,
        agentId,
        worldId: lobby.worldId,
      });

      const worldPlayer = worldPlayers.find((player) => player.human === participant.userId);
      const playerGameId = worldPlayer?.id;
      if (playerGameId) {
        await ctx.runMutation(api.aiTown.main.sendInput, {
          worldId: lobby.worldId,
          name: 'setMovementLock',
          args: {
            playerId: playerGameId as any,
            until: pairedChatEndsAt,
          },
        });
      }

      if (existingAssignment) {
        await ctx.db.patch(existingAssignment._id, {
          agentId,
          chatId,
          playerGameId: playerGameId ?? existingAssignment.playerGameId,
          movementLockUntil: pairedChatEndsAt,
          assignedAt: Date.now(),
        });
      } else {
        await ctx.db.insert('sessionAgents', {
          sessionId,
          userId: participant.userId,
          agentId,
          chatId,
          playerGameId: playerGameId ?? undefined,
          movementLockUntil: pairedChatEndsAt,
          assignedAt: Date.now(),
        });
      }

      results.push({ userId: participant.userId, agentId, chatId });
    }

    return {
      sessionId,
      pairedChatEndsAt,
      assignments: results,
    };
  },
});

export const endPairedChatSession = internalMutation({
  args: {
    sessionId: v.id('sessions'),
  },
  handler: async (ctx, { sessionId }) => {
    const session = await loadSession(ctx, sessionId);
    if (session.status !== 'paired_chat') {
      return { status: session.status };
    }
    const lobby = await loadLobby(ctx, session.lobbyId);
    const now = Date.now();

    await ctx.db.patch(sessionId, {
      status: 'free_roam',
      updatedAt: now,
    });
    await ctx.db.patch(lobby._id, {
      status: 'free_roam',
      pairedChatEndsAt: session.pairedChatEndsAt ?? now,
    });

    const participants = await ctx.db
      .query('lobbyPlayers')
      .withIndex('byLobby', (q) => q.eq('lobbyId', lobby._id))
      .collect();

    for (const participant of participants) {
      const newStatus = participant.status === 'paired_chat' ? 'free_roam' : participant.status;
      await ctx.db.patch(participant._id, {
        status: newStatus,
      });
    }

    const assignments = await ctx.db
      .query('sessionAgents')
      .withIndex('bySession', (q) => q.eq('sessionId', sessionId))
      .collect();

    if (lobby.worldId) {
      for (const assignment of assignments) {
        if (assignment.playerGameId) {
          await ctx.runMutation(api.aiTown.main.sendInput, {
            worldId: lobby.worldId,
            name: 'setMovementLock',
            args: {
              playerId: assignment.playerGameId as any,
              until: now,
            },
          });
        }
        await ctx.db.patch(assignment._id, {
          movementLockUntil: now,
        });
      }
    }

    return { status: 'free_roam', transitionedAt: now };
  },
});

export const sessionsNeedingRelease = query({
  handler: async (ctx) => {
    const now = Date.now();
    const sessions = await ctx.db
      .query('sessions')
      .filter((q) => q.eq(q.field('status'), 'paired_chat'))
      .collect();
    return sessions
      .filter((session) => session.pairedChatEndsAt && session.pairedChatEndsAt <= now)
      .map((session) => session._id);
  },
});

export const releaseExpiredSessions = internalMutation({
  handler: async (ctx) => {
    const sessionIds = (await ctx.runQuery(
      api.experiment.sessions.sessionsNeedingRelease,
      {},
    )) as Id<'sessions'>[];
    for (const sessionId of sessionIds) {
      await ctx.runMutation(internal.experiment.sessions.endPairedChatSession, { sessionId });
    }
    return { processed: sessionIds.length };
  },
});

export const setSessionFreeRoam = mutation({
  args: {
    sessionId: v.id('sessions'),
  },
  handler: async (ctx, { sessionId }) => {
    await ctx.runMutation(internal.experiment.sessions.endPairedChatSession, { sessionId });
    return { success: true };
  },
});

export const userSessionState = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, { userId }) => {
    const memberships = await ctx.db
      .query('lobbyPlayers')
      .withIndex('byUser', (q) => q.eq('userId', userId))
      .collect();
    if (memberships.length === 0) {
      return null;
    }
    const membership = memberships.sort(
      (a, b) => b.onboardingCompletedAt - a.onboardingCompletedAt,
    )[0];
    const lobby = await ctx.db.get(membership.lobbyId);
    if (!lobby) {
      return null;
    }
    const sessions = await ctx.db
      .query('sessions')
      .withIndex('byLobby', (q) => q.eq('lobbyId', membership.lobbyId))
      .collect();
    const session = sessions.sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;

    let assignment = null;
    if (session) {
      const assignments = await ctx.db
        .query('sessionAgents')
        .withIndex('bySession', (q) => q.eq('sessionId', session._id))
        .collect();
      assignment = assignments.find((agent) => agent.userId === userId) ?? null;
    }

    return {
      lobby: {
        id: lobby._id,
        status: lobby.status,
        minPlayers: lobby.minPlayers,
        pairedChatMinutes: lobby.pairedChatMinutes,
        worldId: lobby.worldId ?? null,
        startedAt: lobby.startedAt ?? null,
        pairedChatEndsAt: lobby.pairedChatEndsAt ?? null,
      },
      membership: {
        lobbyPlayerId: membership._id,
        lobbyId: membership.lobbyId,
        ready: membership.ready,
        readyAt: membership.readyAt ?? null,
        status: membership.status,
        questionnaireCompletedAt: membership.questionnaireCompletedAt,
        onboardingCompletedAt: membership.onboardingCompletedAt,
      },
      session: session
        ? {
            id: session._id,
            status: session.status,
            pairedChatEndsAt: session.pairedChatEndsAt ?? null,
            updatedAt: session.updatedAt,
          }
        : null,
      assignment: assignment
        ? {
            agentId: assignment.agentId,
            chatId: assignment.chatId ?? null,
            movementLockUntil: assignment.movementLockUntil ?? null,
          }
        : null,
    };
  },
});
