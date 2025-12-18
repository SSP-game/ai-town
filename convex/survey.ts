import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const submitSurvey = mutation({
  args: {
    userId: v.id('users'),
    answers: v.object({
      currentMood: v.number(),
      stressLevel: v.number(),
      anxietyLevel: v.number(),
      energyLevel: v.number(),
      socialPreference: v.string(),
      socialAnxiety: v.number(),
      lifeSatisfaction: v.number(),
      sleepQuality: v.number(),
      recentChallenges: v.optional(v.string()),
      positiveExperiences: v.optional(v.string()),
      futureGoals: v.optional(v.string()),
      // New question types
      spendingHabits: v.optional(v.string()),
      hobbies: v.optional(v.array(v.string())),
      exerciseRegularly: v.optional(v.boolean()),
      dailyActivities: v.optional(v.object({
        work: v.number(),
        socializing: v.number(),
        relaxing: v.number(),
        learning: v.number(),
      })),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Insert survey record
    const surveyId = await ctx.db.insert('surveys', {
      userId: args.userId,
      answers: args.answers,
      completedAt: now,
      createdAt: now,
    });

    // Mark survey as completed on user record (for game flow tracking)
    await ctx.db.patch(args.userId, {
      surveyCompleted: true,
      updatedAt: now,
    });

    return surveyId;
  },
});

export const getUserSurveys = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const surveys = await ctx.db
      .query('surveys')
      .withIndex('userId', (q) => q.eq('userId', args.userId))
      .order('desc')
      .collect();

    return surveys;
  },
});

export const getLatestSurvey = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const survey = await ctx.db
      .query('surveys')
      .withIndex('userId', (q) => q.eq('userId', args.userId))
      .order('desc')
      .first();

    return survey;
  },
});
