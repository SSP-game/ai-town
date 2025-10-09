import { ConvexError, v } from 'convex/values';
import {
  mutation,
  query,
  internalAction,
  internalMutation,
  internalQuery,
  MutationCtx,
} from './_generated/server';
import { internal, api } from './_generated/api';
import { chatCompletion } from './util/llm';
import type { LLMMessage } from './util/llm';
import { Id } from './_generated/dataModel';

// Simple hash function (in production, use bcrypt or similar)
function simpleHash(password: string): string {
  // This is a simple hash for demo purposes. Use bcrypt in production!
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

async function ensureNicknameAvailable(
  ctx: MutationCtx,
  nickname: string,
  ignoreUserId?: Id<'users'>,
) {
  const existingNickname = await ctx.db
    .query('users')
    .withIndex('nickname', (q) => q.eq('nickname', nickname))
    .first();
  if (existingNickname && existingNickname._id !== ignoreUserId) {
    throw new ConvexError('Nickname already taken');
  }
}

async function generateUniqueNickname(ctx: MutationCtx, seed: string) {
  const base = seed.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) || 'Participant';
  let candidate = base;
  let counter = 1;
  while (counter < 100) {
    const existing = await ctx.db
      .query('users')
      .withIndex('nickname', (q) => q.eq('nickname', candidate))
      .first();
    if (!existing) {
      return candidate;
    }
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  throw new ConvexError('Unable to allocate nickname at this time. Please try again.');
}

export const register = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    nickname: v.optional(v.string()),
  },
  handler: async (ctx, { email, password, nickname }) => {
    // Check if email already exists
    const existingUser = await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', email))
      .first();

    if (existingUser) {
      throw new ConvexError('Email already registered');
    }

    // Validate inputs
    if (!email.includes('@')) {
      throw new ConvexError('Invalid email format');
    }

    if (password.length < 6) {
      throw new ConvexError('Password must be at least 6 characters');
    }

    let chosenNickname = nickname?.trim();
    if (chosenNickname) {
      if (chosenNickname.length < 2 || chosenNickname.length > 20) {
        throw new ConvexError('Nickname must be 2-20 characters');
      }
      await ensureNicknameAvailable(ctx, chosenNickname);
    } else {
      const localPart = email.split('@')[0] ?? 'Participant';
      chosenNickname = await generateUniqueNickname(ctx, localPart);
    }

    // Create user
    const passwordHash = simpleHash(password);
    const now = Date.now();
    const userId = await ctx.db.insert('users', {
      email,
      passwordHash,
      nickname: chosenNickname,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      experimentConsent: false,
    });

    return { userId, nickname: chosenNickname };
  },
});

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { email, password }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', email))
      .first();

    if (!user) {
      throw new ConvexError('User not found');
    }

    const passwordHash = simpleHash(password);
    if (user.passwordHash !== passwordHash) {
      throw new ConvexError('Invalid password');
    }

    // Update last login
    await ctx.db.patch(user._id, {
      lastLoginAt: Date.now(),
    });

    return {
      userId: user._id,
      nickname: user.nickname,
      email: user.email,
      selectedCharacter: user.selectedCharacter,
      avatar: user.avatar,
      mbti: user.mbti,
      profileCompletedAt: user.profileCompletedAt,
      experimentConsent: user.experimentConsent ?? false,
    };
  },
});

export const updateSelectedCharacter = mutation({
  args: {
    userId: v.id('users'),
    character: v.string(),
  },
  handler: async (ctx, { userId, character }) => {
    await ctx.db.patch(userId, {
      selectedCharacter: character,
    });
    return { success: true };
  },
});

export const completeProfile = mutation({
  args: {
    userId: v.id('users'),
    nickname: v.string(),
    gender: v.optional(
      v.union(
        v.literal('male'),
        v.literal('female'),
        v.literal('other'),
        v.literal('prefer_not_to_say'),
      ),
    ),
    dateOfBirth: v.optional(v.string()),
    mbti: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatar: v.optional(v.string()),
    experimentConsent: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { userId, nickname, gender, dateOfBirth, mbti, bio, avatar, experimentConsent } = args;
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError('User not found');
    }

    const trimmedNickname = nickname.trim();
    if (trimmedNickname.length < 2 || trimmedNickname.length > 20) {
      throw new ConvexError('Nickname must be between 2 and 20 characters');
    }

    await ensureNicknameAvailable(ctx, trimmedNickname, userId);

    const now = Date.now();
    await ctx.db.patch(userId, {
      nickname: trimmedNickname,
      gender,
      dateOfBirth,
      mbti,
      bio,
      avatar,
      experimentConsent,
      profileCompletedAt: now,
      updatedAt: now,
    });

    return {
      userId,
      nickname: trimmedNickname,
      gender,
      dateOfBirth,
      mbti,
      bio,
      avatar,
      experimentConsent,
      profileCompletedAt: now,
    };
  },
});

export const getUserProfile = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    return {
      userId: user._id,
      nickname: user.nickname,
      email: user.email,
      selectedCharacter: user.selectedCharacter,
      avatar: user.avatar,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      mbti: user.mbti,
      bio: user.bio,
      experimentConsent: user.experimentConsent ?? false,
      profileCompletedAt: user.profileCompletedAt,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  },
});

export const createOrGetChat = mutation({
  args: {
    userId: v.id('users'),
    agentId: v.string(),
    worldId: v.id('worlds'),
  },
  handler: async (ctx, { userId, agentId, worldId }) => {
    const existingChat = await ctx.db
      .query('userAgentChats')
      .withIndex('userAgent', (q) => q.eq('userId', userId).eq('agentId', agentId))
      .first();

    if (existingChat) {
      return existingChat._id;
    }

    const chatId = await ctx.db.insert('userAgentChats', {
      userId,
      agentId,
      worldId,
      messages: [],
      lastMessageAt: Date.now(),
      createdAt: Date.now(),
    });

    return chatId;
  },
});

export const addChatMessage = mutation({
  args: {
    chatId: v.id('userAgentChats'),
    sender: v.union(v.literal('user'), v.literal('agent')),
    content: v.string(),
  },
  handler: async (ctx, { chatId, sender, content }) => {
    const chat = await ctx.db.get(chatId);
    if (!chat) {
      throw new ConvexError('Chat not found');
    }

    const newMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sender,
      content,
      timestamp: Date.now(),
    };

    const updatedMessages = [...chat.messages, newMessage];

    await ctx.db.patch(chatId, {
      messages: updatedMessages,
      lastMessageAt: Date.now(),
    });

    // If user sent a message, schedule an LLM reply using the same provider/models as the game.
    if (sender === 'user') {
      // Set remote chat state in the world for this agent
      await ctx.runMutation(api.aiTown.main.sendInput, {
        worldId: chat.worldId,
        name: 'setRemoteChat',
        args: { agentId: chat.agentId as any, until: Date.now() + 2 * 60_000 },
      });
      await ctx.scheduler.runAfter(0, internal.users.generateCompanionReply, {
        chatId,
        worldId: chat.worldId,
        agentId: chat.agentId,
        userId: chat.userId,
      });
    }

    return newMessage;
  },
});

export const getChatHistory = query({
  args: {
    userId: v.id('users'),
    agentId: v.string(),
  },
  handler: async (ctx, { userId, agentId }) => {
    const chat = await ctx.db
      .query('userAgentChats')
      .withIndex('userAgent', (q) => q.eq('userId', userId).eq('agentId', agentId))
      .first();

    return chat ? chat.messages : [];
  },
});

// Internal: fetch prompt data for companion/agent chat
export const getCompanionPromptData = internalQuery({
  args: {
    chatId: v.id('userAgentChats'),
    worldId: v.id('worlds'),
    agentId: v.string(),
    userId: v.id('users'),
  },
  handler: async (ctx, { chatId, worldId, agentId, userId }) => {
    const chat = await ctx.db.get(chatId);
    if (!chat) throw new ConvexError('Chat not found');

    const user = await ctx.db.get(userId);
    const userName = user?.nickname || 'You';

    // Agent identity & plan from agentDescriptions
    const agentDesc = await ctx.db
      .query('agentDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', worldId).eq('agentId', agentId))
      .first();

    // Player name behind the agent (optional)
    const world = await ctx.db.get(worldId);
    let agentPlayerName: string | undefined;
    if (world) {
      const agent = world.agents.find((a) => a.id === agentId);
      const playerId = agent?.playerId;
      if (playerId) {
        const playerDesc = await ctx.db
          .query('playerDescriptions')
          .withIndex('worldId', (q) => q.eq('worldId', worldId).eq('playerId', playerId))
          .first();
        agentPlayerName = playerDesc?.name;
      }
    }

    return {
      messages: chat.messages,
      userName,
      agentIdentity: agentDesc?.identity,
      agentPlan: agentDesc?.plan,
      agentName: agentPlayerName,
    };
  },
});

// Internal: append agent message to chat without triggering another reply
export const appendAgentMessage = internalMutation({
  args: {
    chatId: v.id('userAgentChats'),
    content: v.string(),
  },
  handler: async (ctx, { chatId, content }) => {
    const chat = await ctx.db.get(chatId);
    if (!chat) return;
    const newMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      sender: 'agent' as const,
      content,
      timestamp: Date.now(),
    };
    await ctx.db.patch(chatId, {
      messages: [...chat.messages, newMessage],
      lastMessageAt: Date.now(),
    });
  },
});

// Internal: generate LLM reply using the same LLM provider/models as game
export const generateCompanionReply = internalAction({
  args: {
    chatId: v.id('userAgentChats'),
    worldId: v.id('worlds'),
    agentId: v.string(),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const { messages, userName, agentIdentity, agentPlan, agentName } = await ctx.runQuery(
      internal.users.getCompanionPromptData,
      args,
    );

    const name = agentName ?? 'Companion';
    const sys: string[] = [];
    sys.push(`You are ${name}, chatting with ${userName}.`);
    if (agentIdentity) sys.push(`About you: ${agentIdentity}`);
    if (agentPlan) sys.push(`Your goals: ${agentPlan}`);
    sys.push('Keep responses brief (<= 200 chars).');

    const history: LLMMessage[] = messages.map((m: { sender: 'user' | 'agent'; content: string }) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.sender === 'user' ? `${userName}: ${m.content}` : `${name}: ${m.content}`,
    }));

    const llmMessages: LLMMessage[] = [
      { role: 'system', content: sys.join('\n') },
      ...history,
      { role: 'user', content: `${name}:` },
    ];

    const { content } = await chatCompletion({
      messages: llmMessages,
      max_tokens: 200,
      stop: [`${userName} to ${name}:`, `${name} to ${userName}:`],
    });

    const reply = typeof content === 'string' ? content.trim() : `${name}`;
    await ctx.runMutation(internal.users.appendAgentMessage, {
      chatId: args.chatId,
      content: reply,
    });

    // Extend remote chat state after reply
    await ctx.runMutation(api.aiTown.main.sendInput, {
      worldId: args.worldId,
      name: 'setRemoteChat',
      args: { agentId: args.agentId as any, until: Date.now() + 2 * 60_000 },
    });
  },
});

export const getUserChats = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, { userId }) => {
    const chats = await ctx.db
      .query('userAgentChats')
      .withIndex('userId', (q) => q.eq('userId', userId))
      .order('desc')
      .collect();

    return chats;
  },
});

export const updateSelectedCompanion = mutation({
  args: {
    userId: v.id('users'),
    companionId: v.string(),
  },
  handler: async (ctx, { userId, companionId }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError('User not found');
    }

    await ctx.db.patch(userId, {
      selectedCompanion: companionId,
    });

    return { success: true };
  },
});

export const removeSelectedCompanion = mutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError('User not found');
    }

    await ctx.db.patch(userId, {
      selectedCompanion: undefined,
    });

    return { success: true };
  },
});

// Update user profile information
export const updateUserProfile = mutation({
  args: {
    userId: v.id('users'),
    updates: v.object({
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      dateOfBirth: v.optional(v.string()),
      gender: v.optional(v.union(v.literal('male'), v.literal('female'), v.literal('other'), v.literal('prefer_not_to_say'))),
      bio: v.optional(v.string()),
      nickname: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { userId, updates }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError('User not found');
    }

    // Check if nickname is being updated and if it's already taken
    if (updates.nickname && updates.nickname !== user.nickname) {
      const existingNickname = await ctx.db
        .query('users')
        .withIndex('nickname', (q) => q.eq('nickname', updates.nickname!))
        .first();

      if (existingNickname) {
        throw new ConvexError('Nickname already taken');
      }
    }

    // Validate inputs
    if (updates.nickname && (updates.nickname.length < 2 || updates.nickname.length > 20)) {
      throw new ConvexError('Nickname must be 2-20 characters');
    }

    await ctx.db.patch(userId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Change password
export const changePassword = mutation({
  args: {
    userId: v.id('users'),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, { userId, currentPassword, newPassword }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError('User not found');
    }

    // Verify current password
    const currentPasswordHash = simpleHash(currentPassword);
    if (user.passwordHash !== currentPasswordHash) {
      throw new ConvexError('Current password is incorrect');
    }

    // Validate new password
    if (newPassword.length < 6) {
      throw new ConvexError('New password must be at least 6 characters');
    }

    const newPasswordHash = simpleHash(newPassword);
    await ctx.db.patch(userId, {
      passwordHash: newPasswordHash,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Deactivate account (soft delete)
export const deactivateAccount = mutation({
  args: {
    userId: v.id('users'),
    password: v.string(),
  },
  handler: async (ctx, { userId, password }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError('User not found');
    }

    // Verify password
    const passwordHash = simpleHash(password);
    if (user.passwordHash !== passwordHash) {
      throw new ConvexError('Invalid password');
    }

    await ctx.db.patch(userId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get full user profile including personal information
export const getFullUserProfile = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user || !user.isActive) {
      return null;
    }

    return {
      userId: user._id,
      email: user.email,
      nickname: user.nickname,
      firstName: user.firstName,
      lastName: user.lastName,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      bio: user.bio,
      avatar: user.avatar,
      selectedCharacter: user.selectedCharacter,
      selectedCompanion: user.selectedCompanion,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      updatedAt: user.updatedAt,
    };
  },
});

// Login with additional checks for active accounts
export const loginWithValidation = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { email, password }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', email))
      .first();

    if (!user) {
      throw new ConvexError('User not found');
    }

    if (!user.isActive) {
      throw new ConvexError('Account has been deactivated');
    }

    const passwordHash = simpleHash(password);
    if (user.passwordHash !== passwordHash) {
      throw new ConvexError('Invalid password');
    }

    // Update last login
    await ctx.db.patch(user._id, {
      lastLoginAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      userId: user._id,
      nickname: user.nickname,
      email: user.email,
      selectedCharacter: user.selectedCharacter,
      selectedCompanion: user.selectedCompanion,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  },
});
