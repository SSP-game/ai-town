import { ObjectType, v } from 'convex/values';
import { GameId, parseGameId } from './ids';
import { conversationId, playerId } from './ids';
import { Player } from './player';
import { inputHandler } from './inputHandler';

import { TYPING_TIMEOUT, CONVERSATION_DISTANCE } from '../constants';
import { distance, normalize, vector } from '../util/geometry';
import { Point } from '../util/types';
import { Game } from './game';
import { stopPlayer, blocked, movePlayer } from './movement';
import { ConversationMembership, serializedConversationMembership } from './conversationMembership';
import { parseMap, serializeMap } from '../util/object';

export class Conversation {
  id: GameId<'conversations'>;
  creator: GameId<'players'>;
  created: number;
  isTyping?: {
    playerId: GameId<'players'>;
    messageUuid: string;
    since: number;
  };
  lastMessage?: {
    author: GameId<'players'>;
    timestamp: number;
  };
  numMessages: number;
  participants: Map<GameId<'players'>, ConversationMembership>;

  constructor(serialized: SerializedConversation) {
    const { id, creator, created, isTyping, lastMessage, numMessages, participants } = serialized;
    this.id = parseGameId('conversations', id);
    this.creator = parseGameId('players', creator);
    this.created = created;
    this.isTyping = isTyping && {
      playerId: parseGameId('players', isTyping.playerId),
      messageUuid: isTyping.messageUuid,
      since: isTyping.since,
    };
    this.lastMessage = lastMessage && {
      author: parseGameId('players', lastMessage.author),
      timestamp: lastMessage.timestamp,
    };
    this.numMessages = numMessages;
    this.participants = parseMap(participants, ConversationMembership, (m) => m.playerId);
  }

  tick(game: Game, now: number) {
    if (this.isTyping && this.isTyping.since + TYPING_TIMEOUT < now) {
      delete this.isTyping;
    }
    // Group-aware tick: support 2+ participants.
    const entries = [...this.participants.entries()];
    const players = entries
      .map(([pid]) => game.world.players.get(pid)!)
      .filter(Boolean);
    if (players.length < 2) return;

    // Determine active participants (walking over or already participating).
    const active = entries.filter(([, m]) => m.status.kind === 'walkingOver' || m.status.kind === 'participating');
    if (active.length < 2) return;

    // Compute centroid of current active players.
    const centroid = active.reduce(
      (acc, [pid]) => {
        const p = game.world.players.get(pid)!;
        acc.x += p.position.x;
        acc.y += p.position.y;
        return acc;
      },
      { x: 0, y: 0 },
    );
    centroid.x /= active.length;
    centroid.y /= active.length;

    // If all walkingOver are near the centroid, mark them participating and stop moving.
    let allNear = true;
    for (const [pid, member] of active) {
      const p = game.world.players.get(pid)!;
      const d = distance(p.position, centroid);
      if (member.status.kind === 'walkingOver' && d >= CONVERSATION_DISTANCE) {
        allNear = false;
        break;
      }
    }
    if (!allNear) {
      // Move each walkingOver participant towards nearest grid point close to centroid.
      const target = { x: Math.floor(centroid.x), y: Math.floor(centroid.y) };
      for (const [pid, member] of active) {
        if (member.status.kind !== 'walkingOver') continue;
        const p = game.world.players.get(pid)!;
        if (!p.pathfinding) {
          // Find a nearby free neighbor to avoid collisions.
          const neighbors = (q: Point) => [
            { x: q.x + 1, y: q.y },
            { x: q.x - 1, y: q.y },
            { x: q.x, y: q.y + 1 },
            { x: q.x, y: q.y - 1 },
            q,
          ];
          const candidates = neighbors(target).filter((q) => !blocked(game, now, q, p.id));
          candidates.sort((a, b) => distance(a, p.position) - distance(b, p.position));
          if (candidates.length > 0) movePlayer(game, now, p, candidates[0], true);
        }
      }
    } else {
      // Everyone is close enough: mark all walkingOver -> participating and stop them.
      for (const [pid, member] of active) {
        const p = game.world.players.get(pid)!;
        if (member.status.kind === 'walkingOver') {
          stopPlayer(p);
          member.status = { kind: 'participating', started: now };
        }
      }
    }

    // Orient participating players towards centroid if they're not moving.
    for (const [pid, member] of entries) {
      if (member.status.kind !== 'participating') continue;
      const p = game.world.players.get(pid)!;
      const v = normalize(vector(p.position, centroid));
      if (!p.pathfinding && v) {
        p.facing = v;
      }
    }
  }

  static start(game: Game, now: number, player: Player, invitee: Player) {
    if (player.id === invitee.id) {
      throw new Error(`Can't invite yourself to a conversation`);
    }
    // Ensure the players still exist.
    if ([...game.world.conversations.values()].find((c) => c.participants.has(player.id))) {
      const reason = `Player ${player.id} is already in a conversation`;
      console.log(reason);
      return { error: reason };
    }
    if ([...game.world.conversations.values()].find((c) => c.participants.has(invitee.id))) {
      const reason = `Player ${player.id} is already in a conversation`;
      console.log(reason);
      return { error: reason };
    }
    const conversationId = game.allocId('conversations');
    console.log(`Creating conversation ${conversationId}`);
    game.world.conversations.set(
      conversationId,
      new Conversation({
        id: conversationId,
        created: now,
        creator: player.id,
        numMessages: 0,
        participants: [
          { playerId: player.id, invited: now, status: { kind: 'walkingOver' } },
          { playerId: invitee.id, invited: now, status: { kind: 'invited' } },
        ],
      }),
    );
    return { conversationId };
  }

  setIsTyping(now: number, player: Player, messageUuid: string) {
    if (this.isTyping) {
      if (this.isTyping.playerId !== player.id) {
        throw new Error(`Player ${this.isTyping.playerId} is already typing in ${this.id}`);
      }
      return;
    }
    this.isTyping = { playerId: player.id, messageUuid, since: now };
  }

  acceptInvite(game: Game, player: Player) {
    const member = this.participants.get(player.id);
    if (!member) {
      throw new Error(`Player ${player.id} not in conversation ${this.id}`);
    }
    if (member.status.kind !== 'invited') {
      throw new Error(
        `Invalid membership status for ${player.id}:${this.id}: ${JSON.stringify(member)}`,
      );
    }
    member.status = { kind: 'walkingOver' };
  }

  rejectInvite(game: Game, now: number, player: Player) {
    const member = this.participants.get(player.id);
    if (!member) {
      throw new Error(`Player ${player.id} not in conversation ${this.id}`);
    }
    if (member.status.kind !== 'invited') {
      throw new Error(
        `Rejecting invite in wrong membership state: ${this.id}:${player.id}: ${JSON.stringify(
          member,
        )}`,
      );
    }
    this.stop(game, now);
  }

  stop(game: Game, now: number) {
    delete this.isTyping;
    for (const [playerId, member] of this.participants.entries()) {
      const agent = [...game.world.agents.values()].find((a) => a.playerId === playerId);
      if (agent) {
        agent.lastConversation = now;
        agent.toRemember = this.id;
      }
    }
    game.world.conversations.delete(this.id);
  }

  leave(game: Game, now: number, player: Player) {
    const member = this.participants.get(player.id);
    if (!member) {
      throw new Error(`Couldn't find membership for ${this.id}:${player.id}`);
    }
    this.stop(game, now);
  }

  serialize(): SerializedConversation {
    const { id, creator, created, isTyping, lastMessage, numMessages } = this;
    return {
      id,
      creator,
      created,
      isTyping,
      lastMessage,
      numMessages,
      participants: serializeMap(this.participants),
    };
  }
}

export const serializedConversation = {
  id: conversationId,
  creator: playerId,
  created: v.number(),
  isTyping: v.optional(
    v.object({
      playerId,
      messageUuid: v.string(),
      since: v.number(),
    }),
  ),
  lastMessage: v.optional(
    v.object({
      author: playerId,
      timestamp: v.number(),
    }),
  ),
  numMessages: v.number(),
  participants: v.array(v.object(serializedConversationMembership)),
};
export type SerializedConversation = ObjectType<typeof serializedConversation>;

  export const conversationInputs = {
  // Start a conversation, inviting the specified player.
  // Conversations can only have two participants for now,
  // so we don't have a separate "invite" input.
  startConversation: inputHandler({
    args: {
      playerId,
      invitee: playerId,
    },
    handler: (game: Game, now: number, args): GameId<'conversations'> => {
      const playerId = parseGameId('players', args.playerId);
      const player = game.world.players.get(playerId);
      if (!player) {
        throw new Error(`Invalid player ID: ${playerId}`);
      }
      const inviteeId = parseGameId('players', args.invitee);
      const invitee = game.world.players.get(inviteeId);
      if (!invitee) {
        throw new Error(`Invalid player ID: ${inviteeId}`);
      }
      console.log(`Starting ${playerId} ${inviteeId}...`);
      const { conversationId, error } = Conversation.start(game, now, player, invitee);
      if (!conversationId) {
        // TODO: pass it back to the client for them to show an error.
        throw new Error(error);
      }
      return conversationId;
    },
  }),

  startTyping: inputHandler({
    args: {
      playerId,
      conversationId,
      messageUuid: v.string(),
    },
    handler: (game: Game, now: number, args): null => {
      const playerId = parseGameId('players', args.playerId);
      const player = game.world.players.get(playerId);
      if (!player) {
        throw new Error(`Invalid player ID: ${playerId}`);
      }
      const conversationId = parseGameId('conversations', args.conversationId);
      const conversation = game.world.conversations.get(conversationId);
      if (!conversation) {
        throw new Error(`Invalid conversation ID: ${conversationId}`);
      }
      if (conversation.isTyping && conversation.isTyping.playerId !== playerId) {
        throw new Error(
          `Player ${conversation.isTyping.playerId} is already typing in ${conversationId}`,
        );
      }
      conversation.isTyping = { playerId, messageUuid: args.messageUuid, since: now };
      return null;
    },
  }),

  finishSendingMessage: inputHandler({
    args: {
      playerId,
      conversationId,
      timestamp: v.number(),
    },
    handler: (game: Game, now: number, args): null => {
      const playerId = parseGameId('players', args.playerId);
      const conversationId = parseGameId('conversations', args.conversationId);
      const conversation = game.world.conversations.get(conversationId);
      if (!conversation) {
        throw new Error(`Invalid conversation ID: ${conversationId}`);
      }
      if (conversation.isTyping && conversation.isTyping.playerId === playerId) {
        delete conversation.isTyping;
      }
      conversation.lastMessage = { author: playerId, timestamp: args.timestamp };
      conversation.numMessages++;
      return null;
    },
  }),

  // Accept an invite to a conversation, which puts the
  // player in the "walkingOver" state until they're close
  // enough to the other participant.
  acceptInvite: inputHandler({
    args: {
      playerId,
      conversationId,
    },
    handler: (game: Game, now: number, args): null => {
      const playerId = parseGameId('players', args.playerId);
      const player = game.world.players.get(playerId);
      if (!player) {
        throw new Error(`Invalid player ID ${playerId}`);
      }
      const conversationId = parseGameId('conversations', args.conversationId);
      const conversation = game.world.conversations.get(conversationId);
      if (!conversation) {
        throw new Error(`Invalid conversation ID ${conversationId}`);
      }
      conversation.acceptInvite(game, player);
      return null;
    },
  }),

  // Invite another player into an existing conversation.
  inviteToConversation: inputHandler({
    args: {
      playerId, // inviter (must be participant)
      conversationId,
      invitee: playerId,
    },
    handler: (game: Game, now: number, args): null => {
      const inviterId = parseGameId('players', args.playerId);
      const conversationId = parseGameId('conversations', args.conversationId);
      const convo = game.world.conversations.get(conversationId);
      if (!convo) throw new Error(`Invalid conversation ID: ${conversationId}`);
      if (!convo.participants.has(inviterId)) throw new Error(`Inviter not in conversation`);
      const inviteeId = parseGameId('players', args.invitee);
      if (!game.world.players.get(inviteeId)) throw new Error(`Invalid player ID: ${inviteeId}`);
      if (convo.participants.has(inviteeId)) return null; // already in
      convo.participants.set(inviteeId, new ConversationMembership({
        playerId: inviteeId,
        invited: now,
        status: { kind: 'invited' },
      }));
      return null;
    },
  }),

  // Start a group conversation with multiple invitees at once.
  startGroupConversation: inputHandler({
    args: {
      playerId,
      invitees: v.array(playerId),
    },
    handler: (game: Game, now: number, args): GameId<'conversations'> => {
      const creatorId = parseGameId('players', args.playerId);
      const creator = game.world.players.get(creatorId);
      if (!creator) throw new Error(`Invalid player ID: ${creatorId}`);
      const conversationId = game.allocId('conversations');
      const participants: ConversationMembership[] = [] as any;
      participants.push(new ConversationMembership({ playerId: creatorId, invited: now, status: { kind: 'walkingOver' } }));
      for (const inv of args.invitees) {
        const inviteeId = parseGameId('players', inv);
        const invitee = game.world.players.get(inviteeId);
        if (!invitee) continue;
        participants.push(new ConversationMembership({ playerId: inviteeId, invited: now, status: { kind: 'invited' } }));
      }
      game.world.conversations.set(
        conversationId,
        new Conversation({
          id: conversationId,
          created: now,
          creator: creatorId,
          numMessages: 0,
          participants,
        }),
      );
      return conversationId;
    },
  }),

  // Reject the invite. Eventually we might add a message
  // that explains why!
  rejectInvite: inputHandler({
    args: {
      playerId,
      conversationId,
    },
    handler: (game: Game, now: number, args): null => {
      const playerId = parseGameId('players', args.playerId);
      const player = game.world.players.get(playerId);
      if (!player) {
        throw new Error(`Invalid player ID ${playerId}`);
      }
      const conversationId = parseGameId('conversations', args.conversationId);
      const conversation = game.world.conversations.get(conversationId);
      if (!conversation) {
        throw new Error(`Invalid conversation ID ${conversationId}`);
      }
      conversation.rejectInvite(game, now, player);
      return null;
    },
  }),
  // Leave a conversation.
  leaveConversation: inputHandler({
    args: {
      playerId,
      conversationId,
    },
    handler: (game: Game, now: number, args): null => {
      const playerId = parseGameId('players', args.playerId);
      const player = game.world.players.get(playerId);
      if (!player) {
        throw new Error(`Invalid player ID ${playerId}`);
      }
      const conversationId = parseGameId('conversations', args.conversationId);
      const conversation = game.world.conversations.get(conversationId);
      if (!conversation) {
        throw new Error(`Invalid conversation ID ${conversationId}`);
      }
      conversation.leave(game, now, player);
      return null;
    },
  }),
};
