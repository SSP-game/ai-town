import { ConvexError, v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { Id } from '../_generated/dataModel';

const DEFAULT_SLUG = 'default';

export const getActiveConfig = query({
  args: {
    slug: v.optional(v.string()),
  },
  handler: async (ctx, { slug }) => {
    const targetSlug = slug ?? DEFAULT_SLUG;
    const configBySlug = await ctx.db
      .query('experimentConfigs')
      .withIndex('slug', (q) => q.eq('slug', targetSlug))
      .first();
    if (configBySlug) {
      return configBySlug;
    }

    const activeConfig = await ctx.db
      .query('experimentConfigs')
      .withIndex('isActive', (q) => q.eq('isActive', true))
      .first();

    return activeConfig ?? null;
  },
});

export const upsertConfig = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    introduction: v.string(),
    minPlayers: v.number(),
    pairedChatMinutes: v.number(),
    questionnaireVersion: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query('experimentConfigs')
      .withIndex('slug', (q) => q.eq('slug', args.slug))
      .first();

    let configId: Id<'experimentConfigs'>;
    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        introduction: args.introduction,
        minPlayers: args.minPlayers,
        pairedChatMinutes: args.pairedChatMinutes,
        questionnaireVersion: args.questionnaireVersion,
        isActive: args.isActive ?? existing.isActive,
        updatedAt: now,
      });
      configId = existing._id;
    } else {
      const isFirstConfig =
        (await ctx.db.query('experimentConfigs').collect()).length === 0;
      configId = await ctx.db.insert('experimentConfigs', {
        slug: args.slug,
        name: args.name,
        introduction: args.introduction,
        minPlayers: args.minPlayers,
        pairedChatMinutes: args.pairedChatMinutes,
        questionnaireVersion: args.questionnaireVersion,
        isActive: args.isActive ?? isFirstConfig ?? true,
        createdAt: now,
        updatedAt: now,
      });
    }

    const shouldActivate = args.isActive === true;
    if (shouldActivate) {
      const others = await ctx.db
        .query('experimentConfigs')
        .collect();
      for (const other of others) {
        if (other._id !== configId && other.isActive) {
          await ctx.db.patch(other._id, { isActive: false, updatedAt: now });
        }
      }
    }

    const config = await ctx.db.get(configId);
    if (!config) {
      throw new ConvexError('Failed to load experiment config after upsert');
    }
    return config;
  },
});
