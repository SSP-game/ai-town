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
    gender: v.optional(
      v.union(
        v.literal('male'),
        v.literal('female'),
        v.literal('other'),
        v.literal('prefer_not_to_say'),
      ),
    ),
    mbti: v.optional(v.string()), // MBTI personality type (e.g., INTJ, ENFP, etc.)
    bio: v.optional(v.string()),
    avatar: v.optional(v.string()), // URL or storage ID for avatar image

    // Account management
    experimentConsent: v.optional(v.boolean()),
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
    messages: v.array(
      v.object({
        id: v.string(),
        sender: v.union(v.literal('user'), v.literal('agent')),
        content: v.string(),
        timestamp: v.number(),
      }),
    ),
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

  // Companion-specific worlds (when COMPANION_SEPARATE_WORLD is enabled)
  companionWorldStatus: defineTable({
    worldId: v.id('worlds'),
    engineId: v.id('engines'),
    userId: v.id('users'),
    companionAgentId: v.string(), // Agent ID from main world
    status: v.union(v.literal('running'), v.literal('inactive'), v.literal('stoppedByDeveloper')),
    lastViewed: v.number(),
  })
    .index('by_user_companion', ['userId', 'companionAgentId'])
    .index('worldId', ['worldId'])
    .index('lastViewed', ['lastViewed']),

  messages: defineTable({
    conversationId,
    messageUuid: v.string(),
    author: playerId,
    text: v.string(),
    worldId: v.optional(v.id('worlds')),
  })
    .index('conversationId', ['worldId', 'conversationId'])
    .index('messageUuid', ['conversationId', 'messageUuid']),

  // Psychological surveys
  surveys: defineTable({
    userId: v.id('users'),
    answers: v.object({
      // Mood and emotions (1-5 scale)
      currentMood: v.number(), // 1=Very sad, 5=Very happy
      stressLevel: v.number(), // 1=No stress, 5=Extremely stressed
      anxietyLevel: v.number(), // 1=No anxiety, 5=Extremely anxious
      energyLevel: v.number(), // 1=Very tired, 5=Very energetic

      // Social tendencies
      socialPreference: v.string(), // "introvert", "extrovert", "ambivert"
      socialAnxiety: v.number(), // 1=No anxiety, 5=Severe anxiety

      // Life satisfaction
      lifeSatisfaction: v.number(), // 1=Very dissatisfied, 5=Very satisfied
      sleepQuality: v.number(), // 1=Very poor, 5=Very good

      // Open-ended responses
      recentChallenges: v.optional(v.string()),
      positiveExperiences: v.optional(v.string()),
      futureGoals: v.optional(v.string()),
    }),
    completedAt: v.number(),
    createdAt: v.number(),
  })
    .index('userId', ['userId'])
    .index('completedAt', ['completedAt']),

  ...agentTables,
  ...aiTownTables,
  ...engineTables,
});
