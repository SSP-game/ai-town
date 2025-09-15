import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { agentTables } from './agent/schema';
import { aiTownTables } from './aiTown/schema';
import { conversationId, playerId } from './aiTown/ids';
import { engineTables } from './engine/schema';

export default defineSchema({
  // User accounts and profiles
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    nickname: v.string(),
    selectedCharacter: v.optional(v.string()), // f1, f2, f3, etc.
    selectedCompanion: v.optional(v.string()), // Agent ID for companion

    // Personal information
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()), // YYYY-MM-DD format
    gender: v.optional(v.union(v.literal('male'), v.literal('female'), v.literal('other'), v.literal('prefer_not_to_say'))),
    bio: v.optional(v.string()),
    avatar: v.optional(v.string()), // URL or storage ID for avatar image

    // Account management
    isActive: v.boolean(),
    createdAt: v.number(),
    lastLoginAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index('email', ['email'])
    .index('nickname', ['nickname'])
    .index('isActive', ['isActive']),

  // Chat conversations between users and agents
  userAgentChats: defineTable({
    userId: v.id('users'),
    agentId: v.string(), // Agent ID from the game
    worldId: v.id('worlds'),
    messages: v.array(v.object({
      id: v.string(),
      sender: v.union(v.literal('user'), v.literal('agent')),
      content: v.string(),
      timestamp: v.number(),
    })),
    lastMessageAt: v.number(),
    createdAt: v.number(),
  })
    .index('userId', ['userId'])
    .index('userAgent', ['userId', 'agentId'])
    .index('lastMessage', ['lastMessageAt']),

  music: defineTable({
    storageId: v.string(),
    type: v.union(v.literal('background'), v.literal('player')),
  }),

  messages: defineTable({
    conversationId,
    messageUuid: v.string(),
    author: playerId,
    text: v.string(),
    worldId: v.optional(v.id('worlds')),
  })
    .index('conversationId', ['worldId', 'conversationId'])
    .index('messageUuid', ['conversationId', 'messageUuid']),

  ...agentTables,
  ...aiTownTables,
  ...engineTables,
});
