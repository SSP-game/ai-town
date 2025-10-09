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
    mbti: v.optional(v.string()),
    profileCompletedAt: v.optional(v.number()),
    experimentConsent: v.optional(v.boolean()),
    experimentCohort: v.optional(v.string()),

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

  experimentConfigs: defineTable({
    slug: v.string(),
    name: v.string(),
    introduction: v.string(),
    minPlayers: v.number(),
    pairedChatMinutes: v.number(),
    questionnaireVersion: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('slug', ['slug'])
    .index('isActive', ['isActive']),

  questionnaires: defineTable({
    configId: v.id('experimentConfigs'),
    order: v.number(),
    question: v.string(),
    type: v.union(v.literal('single'), v.literal('multi'), v.literal('text')),
    options: v.optional(
      v.array(
        v.object({
          value: v.string(),
          label: v.string(),
        }),
      ),
    ),
    metadata: v.optional(v.any()),
    required: v.boolean(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('configOrder', ['configId', 'order']),

  questionnaireResponses: defineTable({
    userId: v.id('users'),
    configId: v.id('experimentConfigs'),
    questionId: v.id('questionnaires'),
    sessionId: v.optional(v.id('sessions')),
    answer: v.any(),
    submittedAt: v.number(),
  })
    .index('byUser', ['userId', 'configId'])
    .index('byQuestion', ['questionId']),

  lobbies: defineTable({
    configId: v.id('experimentConfigs'),
    status: v.union(
      v.literal('waiting'),
      v.literal('ready_check'),
      v.literal('paired_chat'),
      v.literal('free_roam'),
      v.literal('completed'),
    ),
    minPlayers: v.number(),
    pairedChatMinutes: v.number(),
    worldId: v.optional(v.id('worlds')),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    pairedChatEndsAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index('byStatus', ['status'])
    .index('byConfig', ['configId']),

  lobbyPlayers: defineTable({
    lobbyId: v.id('lobbies'),
    userId: v.id('users'),
    ready: v.boolean(),
    readyAt: v.optional(v.number()),
    onboardingCompletedAt: v.number(),
    questionnaireCompletedAt: v.number(),
    status: v.union(
      v.literal('waiting'),
      v.literal('ready'),
      v.literal('paired_chat'),
      v.literal('free_roam'),
      v.literal('completed'),
    ),
  })
    .index('byLobby', ['lobbyId'])
    .index('byUser', ['userId']),

  sessions: defineTable({
    lobbyId: v.id('lobbies'),
    status: v.union(v.literal('paired_chat'), v.literal('free_roam'), v.literal('ended')),
    pairedChatEndsAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('byLobby', ['lobbyId']),

  sessionAgents: defineTable({
    sessionId: v.id('sessions'),
    userId: v.id('users'),
    agentId: v.string(),
    chatId: v.optional(v.id('userAgentChats')),
    playerGameId: v.optional(v.string()),
    movementLockUntil: v.optional(v.number()),
    agentName: v.optional(v.string()),
    agentCharacter: v.optional(v.string()),
    assignedAt: v.number(),
  })
    .index('bySession', ['sessionId'])
    .index('byUser', ['userId']),

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
