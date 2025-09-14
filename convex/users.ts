import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';

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
    const userId = await ctx.db.insert('users', {
      email,
      passwordHash,
      nickname,
      createdAt: Date.now(),
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