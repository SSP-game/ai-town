import { ConvexError, v } from 'convex/values';
import { mutation, query, MutationCtx, QueryCtx } from '../_generated/server';
import { Id } from '../_generated/dataModel';

const DEFAULT_SLUG = 'default';

async function resolveConfigId(
  ctx: QueryCtx | MutationCtx,
  slug?: string,
  configId?: Id<'experimentConfigs'>,
) {
  if (configId) {
    return configId;
  }
  const targetSlug = slug ?? DEFAULT_SLUG;
  const config = await ctx.db
    .query('experimentConfigs')
    .withIndex('slug', (q) => q.eq('slug', targetSlug))
    .first();
  if (!config) {
    throw new ConvexError('Experiment config not found');
  }
  return config._id;
}

export const getQuestionnaire = query({
  args: {
    slug: v.optional(v.string()),
    configId: v.optional(v.id('experimentConfigs')),
    onlyActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { slug, configId, onlyActive }) => {
    const resolvedConfigId = await resolveConfigId(ctx, slug, configId);

    let queryBuilder = ctx.db
      .query('questionnaires')
      .withIndex('configOrder', (q) => q.eq('configId', resolvedConfigId));
    if (onlyActive) {
      queryBuilder = queryBuilder.filter((q) => q.eq(q.field('isActive'), true));
    }
    const questions = await queryBuilder.collect();

    return {
      configId: resolvedConfigId,
      questions,
    };
  },
});

export const saveQuestionnaireResponses = mutation({
  args: {
    configId: v.id('experimentConfigs'),
    userId: v.id('users'),
    responses: v.array(
      v.object({
        questionId: v.id('questionnaires'),
        answer: v.any(),
      }),
    ),
    sessionId: v.optional(v.id('sessions')),
    lobbyId: v.optional(v.id('lobbies')),
  },
  handler: async (ctx, { configId, userId, responses, sessionId, lobbyId }) => {
    if (responses.length === 0) {
      throw new ConvexError('No responses provided');
    }

    const questions = await ctx.db
      .query('questionnaires')
      .withIndex('configOrder', (q) => q.eq('configId', configId))
      .collect();
    const validQuestionIds = new Set(questions.map((q) => q._id));

    const existingResponses = await ctx.db
      .query('questionnaireResponses')
      .withIndex('byUser', (q) => q.eq('userId', userId).eq('configId', configId))
      .collect();
    const existingByQuestion = new Map(existingResponses.map((resp) => [resp.questionId, resp]));

    const now = Date.now();
    for (const response of responses) {
      if (!validQuestionIds.has(response.questionId)) {
        throw new ConvexError(`Invalid question ${response.questionId} for config ${configId}`);
      }
      const existing = existingByQuestion.get(response.questionId);
      if (existing) {
        await ctx.db.patch(existing._id, {
          answer: response.answer,
          sessionId,
          submittedAt: now,
        });
      } else {
        await ctx.db.insert('questionnaireResponses', {
          configId,
          userId,
          sessionId,
          questionId: response.questionId,
          answer: response.answer,
          submittedAt: now,
        });
      }
    }

    if (lobbyId) {
      const membership = await ctx.db
        .query('lobbyPlayers')
        .withIndex('byLobby', (q) => q.eq('lobbyId', lobbyId))
        .collect();
      const playerEntry = membership.find((member) => member.userId === userId);
      if (playerEntry) {
        await ctx.db.patch(playerEntry._id, {
          questionnaireCompletedAt: now,
          status: playerEntry.ready ? 'ready' : 'waiting',
        });
      }
    }

    return { success: true, submittedAt: now };
  },
});
