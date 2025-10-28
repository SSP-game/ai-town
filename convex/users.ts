import { ConvexError, v } from 'convex/values';
import { mutation, query, internalAction, internalMutation, internalQuery } from './_generated/server';
import { internal, api } from './_generated/api';
import { chatCompletion } from './util/llm';
import type { LLMMessage } from './util/llm';

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

export const register = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    nickname: v.string(),
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

    // Check if nickname already exists
    const existingNickname = await ctx.db
      .query('users')
      .withIndex('nickname', (q) => q.eq('nickname', nickname))
      .first();

    if (existingNickname) {
      throw new ConvexError('Nickname already taken');
    }

    // Validate inputs
    if (!email.includes('@')) {
      throw new ConvexError('Invalid email format');
    }

    if (password.length < 6) {
      throw new ConvexError('Password must be at least 6 characters');
    }

    if (nickname.length < 2 || nickname.length > 20) {
      throw new ConvexError('Nickname must be 2-20 characters');
    }

    // Create user
    const passwordHash = simpleHash(password);
    const now = Date.now();
    const userId = await ctx.db.insert('users', {
      email,
      passwordHash,
      nickname,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return { userId, nickname };
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

    const history: LLMMessage[] = messages.map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.sender === 'user' ? `${userName}: ${m.content}` : `${name}: ${m.content}`,
    }));

    const llmMessages: LLMMessage[] = [
      { role: 'system', content: sys.join('\n') },
      ...history,
      { role: 'user', content: `${name}:` },
    ];

    let reply: string | null = null;
    try {
      const { content } = await chatCompletion({
        messages: llmMessages,
        max_tokens: 200,
        stop: [`${userName} to ${name}:`, `${name} to ${userName}:`],
      });
      reply = typeof content === 'string' ? content.trim() : `${name}`;
    } catch (error) {
      console.error('Failed to generate companion reply', error);
      reply = null;
    }

    if (!reply) {
      reply = `Sorry ${userName}, I had trouble replying just now.`;
    }

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
      mbti: v.optional(v.string()),
      bio: v.optional(v.string()),
      nickname: v.optional(v.string()),
      experimentConsent: v.optional(v.boolean()),
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

// List all users (for testing purposes)
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect();

    return users.map(user => ({
      userId: user._id,
      email: user.email,
      nickname: user.nickname,
      selectedCharacter: user.selectedCharacter,
      selectedCompanion: user.selectedCompanion,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      updatedAt: user.updatedAt,
    }));
  },
});

// Batch get user profiles by IDs
export const listByIds = query({
  args: {
    userIds: v.array(v.id('users')),
  },
  handler: async (ctx, { userIds }) => {
    const users = await Promise.all(
      userIds.map(async (userId) => {
        const user = await ctx.db.get(userId);
        if (!user || !user.isActive) {
          return null;
        }
        return {
          userId: user._id,
          nickname: user.nickname,
          selectedCharacter: user.selectedCharacter,
          selectedCompanion: user.selectedCompanion,
        };
      }),
    );

    // Create a mapping of userId to user profile
    const userMap: Record<string, any> = {};
    users.forEach((user) => {
      if (user) {
        userMap[user.userId] = user;
      }
    });

    return userMap;
  },
});
