import { v } from 'convex/values';
import { internalAction } from '../_generated/server';
import { WorldMap, serializedWorldMap } from './worldMap';
import { rememberConversation } from '../agent/memory';
import { GameId, agentId, conversationId, playerId } from './ids';
import {
  continueConversationMessage,
  leaveConversationMessage,
  startConversationMessage,
} from '../agent/conversation';
import { buildGroupConversationPrompt } from '../agent/promptBuilder';
import { assertNever } from '../util/assertNever';
import { serializedAgent } from './agent';
import {
  ACTIVITIES,
  ACTIVITY_COOLDOWN,
  CONVERSATION_COOLDOWN,
  AGENT_FENCE_BOUNDS,
} from '../constants';
import { api, internal } from '../_generated/api';
import { retry } from '../util/retry';
import { serializedPlayer } from './player';

export const agentRememberConversation = internalAction({
  args: {
    worldId: v.id('worlds'),
    playerId,
    agentId,
    conversationId,
    operationId: v.string(),
  },
  handler: async (ctx, args) => {
    await rememberConversation(
      ctx,
      args.worldId,
      args.agentId as GameId<'agents'>,
      args.playerId as GameId<'players'>,
      args.conversationId as GameId<'conversations'>,
    );
    await retry(() =>
      ctx.runMutation(api.aiTown.main.sendInput, {
        worldId: args.worldId,
        name: 'finishRememberConversation',
        args: {
          agentId: args.agentId,
          operationId: args.operationId,
        },
      }),
    );
  },
});

export const agentGenerateMessage = internalAction({
  args: {
    worldId: v.id('worlds'),
    playerId,
    agentId,
    conversationId,
    otherPlayerId: playerId,
    operationId: v.string(),
    type: v.union(v.literal('start'), v.literal('continue'), v.literal('leave')),
    messageUuid: v.string(),
  },
  handler: async (ctx, args) => {
    let completionFn;
    switch (args.type) {
      case 'start':
        completionFn = startConversationMessage;
        break;
      case 'continue':
        completionFn = continueConversationMessage;
        break;
      case 'leave':
        completionFn = leaveConversationMessage;
        break;
      default:
        assertNever(args.type);
    }
    const text = await completionFn(
      ctx,
      args.worldId,
      args.conversationId as GameId<'conversations'>,
      args.playerId as GameId<'players'>,
      args.otherPlayerId as GameId<'players'>,
    );

    await ctx.runMutation(internal.aiTown.agent.agentSendMessage, {
      worldId: args.worldId,
      conversationId: args.conversationId,
      agentId: args.agentId,
      playerId: args.playerId,
      text,
      messageUuid: args.messageUuid,
      leaveConversation: args.type === 'leave',
      operationId: args.operationId,
    });
  },
});

export const agentGenerateGroupMessage = internalAction({
  args: {
    worldId: v.id('worlds'),
    agentId,
    playerId,
    conversationId,
    operationId: v.string(),
  },
  handler: async (ctx, args) => {
    // Load world for participants and recent messages via queries (actions cannot access db directly)
    const worldState = await ctx.runQuery(api.world.worldState, { worldId: args.worldId });
    const world = worldState.world;
    const convo = world.conversations.find((c: any) => c.id === args.conversationId);
    if (!convo) throw new Error(`Conversation ${args.conversationId} not found`);
    const participantIds: string[] = (convo.participants as any[]).map((m: any) => m.playerId);

    const { playerDescriptions } = await ctx.runQuery(api.world.gameDescriptions, {
      worldId: args.worldId,
    });
    const nameById = new Map<string, string>();
    for (const pd of playerDescriptions) nameById.set(pd.playerId, pd.name);
    const names: string[] = participantIds.map((pid) => nameById.get(pid) ?? pid);
    const selfName = nameById.get(args.playerId) ?? 'Me';

    const recent = await ctx.runQuery(api.messages.listMessages, {
      worldId: args.worldId,
      conversationId: args.conversationId,
    });
    const history = recent.map((m: any) => ({ author: m.authorName, text: m.text }));

    const { messages, stop, max_tokens } = buildGroupConversationPrompt({
      selfName,
      participantNames: names,
      history,
      brief: true,
    });
    const { content } = await ctx.runAction(internal.aiTown.agentOperations._chat, {
      body: { messages, stop, max_tokens },
    });

    const reply = typeof content === 'string' ? content.trim() : `${selfName}`;
    await ctx.runMutation(internal.aiTown.agent.agentSendMessage, {
      worldId: args.worldId,
      conversationId: args.conversationId,
      agentId: args.agentId,
      playerId: args.playerId,
      text: reply,
      messageUuid: crypto.randomUUID(),
      leaveConversation: false,
      operationId: args.operationId,
    });
  },
});

// Private wrapper to reuse chatCompletion with retries from util/llm.ts
export const _chat = internalAction({
  args: { body: v.any() },
  handler: async (ctx, { body }) => {
    const { chatCompletion } = await import('../util/llm');
    return await chatCompletion(body);
  },
});

export const agentDoSomething = internalAction({
  args: {
    worldId: v.id('worlds'),
    player: v.object(serializedPlayer),
    agent: v.object(serializedAgent),
    map: v.object(serializedWorldMap),
    otherFreePlayers: v.array(v.object(serializedPlayer)),
    operationId: v.string(),
  },
  handler: async (ctx, args) => {
    const { player, agent } = args;
    const map = new WorldMap(args.map);
    const now = Date.now();
    // Don't try to start a new conversation if we were just in one.
    const justLeftConversation =
      agent.lastConversation && now < agent.lastConversation + CONVERSATION_COOLDOWN;
    // Don't try again if we recently tried to find someone to invite.
    const recentlyAttemptedInvite =
      agent.lastInviteAttempt && now < agent.lastInviteAttempt + CONVERSATION_COOLDOWN;
    const recentActivity = player.activity && now < player.activity.until + ACTIVITY_COOLDOWN;
    // Decide whether to do an activity or wander somewhere.
    if (!player.pathfinding) {
      if (recentActivity || justLeftConversation) {
        await retry(() =>
          ctx.runMutation(api.aiTown.main.sendInput, {
            worldId: args.worldId,
            name: 'finishDoSomething',
            args: {
              operationId: args.operationId,
              agentId: agent.id,
              destination: wanderDestination(map),
            },
          }),
        );
        return;
      } else {
        // TODO: have LLM choose the activity & emoji
        const activity = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
        await retry(() =>
          ctx.runMutation(api.aiTown.main.sendInput, {
            worldId: args.worldId,
            name: 'finishDoSomething',
            args: {
              operationId: args.operationId,
              agentId: agent.id,
              activity: {
                description: activity.description,
                emoji: activity.emoji,
                until: Date.now() + activity.duration,
              },
            },
          }),
        );
        return;
      }
    }
    const invitee =
      justLeftConversation || recentlyAttemptedInvite
        ? undefined
        : await ctx.runQuery(internal.aiTown.agent.findConversationCandidate, {
            now,
            worldId: args.worldId,
            player: args.player,
            otherFreePlayers: args.otherFreePlayers,
          });

    // Using retry instead of random sleep to handle OCC conflicts gracefully
    await retry(() =>
      ctx.runMutation(api.aiTown.main.sendInput, {
        worldId: args.worldId,
        name: 'finishDoSomething',
        args: {
          operationId: args.operationId,
          agentId: agent.id,
          invitee,
        },
      }),
    );
  },
});

function wanderDestination(worldMap: WorldMap) {
  // Generate wander destination within agent fence bounds
  // Try multiple times to find a non-blocked position
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = {
      x:
        Math.floor(Math.random() * (AGENT_FENCE_BOUNDS.maxX - AGENT_FENCE_BOUNDS.minX + 1)) +
        AGENT_FENCE_BOUNDS.minX,
      y:
        Math.floor(Math.random() * (AGENT_FENCE_BOUNDS.maxY - AGENT_FENCE_BOUNDS.minY + 1)) +
        AGENT_FENCE_BOUNDS.minY,
    };

    // Check if this position is blocked by object tiles
    let isBlocked = false;
    for (const layer of worldMap.objectTiles) {
      if (layer[candidate.x]?.[candidate.y] !== -1) {
        isBlocked = true;
        break;
      }
    }

    if (!isBlocked) {
      return candidate;
    }
  }

  // Fallback: return a position even if blocked (pathfinding will handle it)
  return {
    x:
      Math.floor(Math.random() * (AGENT_FENCE_BOUNDS.maxX - AGENT_FENCE_BOUNDS.minX + 1)) +
      AGENT_FENCE_BOUNDS.minX,
    y:
      Math.floor(Math.random() * (AGENT_FENCE_BOUNDS.maxY - AGENT_FENCE_BOUNDS.minY + 1)) +
      AGENT_FENCE_BOUNDS.minY,
  };
}
