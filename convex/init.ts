import { v } from 'convex/values';
import { internal } from './_generated/api';
import { DatabaseReader, MutationCtx, mutation } from './_generated/server';
import { Descriptions } from '../data/characters';
import * as map from '../data/gentle';
import { insertInput } from './aiTown/insertInput';
import { Id } from './_generated/dataModel';
import { createEngine } from './aiTown/main';
import { ENGINE_ACTION_DURATION } from './constants';
import { detectMismatchedLLMProvider } from './util/llm';

const init = mutation({
  args: {
    numAgents: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    detectMismatchedLLMProvider();
    const { worldStatus, engine } = await getOrCreateDefaultWorld(ctx);
    if (worldStatus.status !== 'running') {
      console.warn(
        `Engine ${engine._id} is not active! Run "npx convex run testing:resume" to restart it.`,
      );
      return;
    }
    const shouldCreate = await shouldCreateAgents(
      ctx.db,
      worldStatus.worldId,
      worldStatus.engineId,
    );
    if (shouldCreate) {
      const toCreate = args.numAgents !== undefined ? args.numAgents : Descriptions.length;
      for (let i = 0; i < toCreate; i++) {
        await insertInput(ctx, worldStatus.worldId, 'createAgent', {
          descriptionIndex: i % Descriptions.length,
        });
      }
    }
    await ensureDefaultExperimentSetup(ctx);
  },
});
export default init;

async function getOrCreateDefaultWorld(ctx: MutationCtx) {
  const now = Date.now();

  let worldStatus = await ctx.db
    .query('worldStatus')
    .filter((q) => q.eq(q.field('isDefault'), true))
    .unique();
  if (worldStatus) {
    const engine = (await ctx.db.get(worldStatus.engineId))!;
    return { worldStatus, engine };
  }

  const engineId = await createEngine(ctx);
  const engine = (await ctx.db.get(engineId))!;
  const worldId = await ctx.db.insert('worlds', {
    nextId: 0,
    agents: [],
    conversations: [],
    players: [],
  });
  const worldStatusId = await ctx.db.insert('worldStatus', {
    engineId: engineId,
    isDefault: true,
    lastViewed: now,
    status: 'running',
    worldId: worldId,
  });
  worldStatus = (await ctx.db.get(worldStatusId))!;
  await ctx.db.insert('maps', {
    worldId,
    width: map.mapwidth,
    height: map.mapheight,
    tileSetUrl: map.tilesetpath,
    tileSetDimX: map.tilesetpxw,
    tileSetDimY: map.tilesetpxh,
    tileDim: map.tiledim,
    bgTiles: map.bgtiles,
    objectTiles: map.objmap,
    animatedSprites: map.animatedsprites,
  });
  await ctx.scheduler.runAfter(0, internal.aiTown.main.runStep, {
    worldId,
    generationNumber: engine.generationNumber,
    maxDuration: ENGINE_ACTION_DURATION,
  });
  return { worldStatus, engine };
}

async function shouldCreateAgents(
  db: DatabaseReader,
  worldId: Id<'worlds'>,
  engineId: Id<'engines'>,
) {
  const world = await db.get(worldId);
  if (!world) {
    throw new Error(`Invalid world ID: ${worldId}`);
  }
  if (world.agents.length > 0) {
    return false;
  }
  const unactionedJoinInputs = await db
    .query('inputs')
    .withIndex('byInputNumber', (q) => q.eq('engineId', engineId))
    .order('asc')
    .filter((q) => q.eq(q.field('name'), 'createAgent'))
    .filter((q) => q.eq(q.field('returnValue'), undefined))
    .collect();
  if (unactionedJoinInputs.length > 0) {
    return false;
  }
  return true;
}

async function ensureDefaultExperimentSetup(ctx: MutationCtx) {
  const now = Date.now();
  const defaults = {
    slug: 'default' as const,
    name: 'Default Experiment',
    introduction:
      'Welcome to the experiment. You will be paired with an AI companion for a brief conversation before exploring the town.',
    minPlayers: 2,
    pairedChatMinutes: 1,
    questionnaireVersion: 'v1' as string | undefined,
  };
  const existingConfig = await ctx.db
    .query('experimentConfigs')
    .withIndex('slug', (q) => q.eq('slug', defaults.slug))
    .first();
  let configId: Id<'experimentConfigs'>;
  if (existingConfig) {
    const needsUpdate =
      existingConfig.name !== defaults.name ||
      existingConfig.introduction !== defaults.introduction ||
      existingConfig.minPlayers !== defaults.minPlayers ||
      existingConfig.pairedChatMinutes !== defaults.pairedChatMinutes ||
      existingConfig.questionnaireVersion !== defaults.questionnaireVersion;
    if (needsUpdate) {
      await ctx.db.patch(existingConfig._id, {
        name: defaults.name,
        introduction: defaults.introduction,
        minPlayers: defaults.minPlayers,
        pairedChatMinutes: defaults.pairedChatMinutes,
        questionnaireVersion: defaults.questionnaireVersion,
        updatedAt: now,
      });
    }
    configId = existingConfig._id;
  } else {
    const isFirstConfig = (await ctx.db.query('experimentConfigs').collect()).length === 0;
    configId = await ctx.db.insert('experimentConfigs', {
      ...defaults,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    if (!isFirstConfig) {
      const others = await ctx.db.query('experimentConfigs').collect();
      for (const other of others) {
        if (other._id !== configId && other.isActive) {
          await ctx.db.patch(other._id, { isActive: false, updatedAt: now });
        }
      }
    }
  }

  const configDoc = await ctx.db.get(configId);
  if (configDoc) {
    const openLobbies = await ctx.db
      .query('lobbies')
      .withIndex('byConfig', (q) => q.eq('configId', configId))
      .collect();
    for (const lobby of openLobbies) {
      if (lobby.status === 'waiting' || lobby.status === 'ready_check') {
        if (
          lobby.minPlayers !== configDoc.minPlayers ||
          lobby.pairedChatMinutes !== configDoc.pairedChatMinutes
        ) {
          await ctx.db.patch(lobby._id, {
            minPlayers: configDoc.minPlayers,
            pairedChatMinutes: configDoc.pairedChatMinutes,
          });
        }
      }
    }
  }

  const existingQuestions = await ctx.db
    .query('questionnaires')
    .withIndex('configOrder', (q) => q.eq('configId', configId))
    .collect();
  if (existingQuestions.length === 0) {
    const questions = [
      {
        order: 0,
        question: 'What is your primary motivation for participating today?',
        type: 'text' as const,
        required: true,
      },
      {
        order: 1,
        question: 'How social do you consider yourself?',
        type: 'single' as const,
        required: true,
        options: [
          { value: 'very_introverted', label: 'Very introverted' },
          { value: 'somewhat_introverted', label: 'Somewhat introverted' },
          { value: 'neutral', label: 'In-between' },
          { value: 'somewhat_extroverted', label: 'Somewhat extroverted' },
          { value: 'very_extroverted', label: 'Very extroverted' },
        ],
      },
      {
        order: 2,
        question: 'Select any themes you are most interested in discussing.',
        type: 'multi' as const,
        required: false,
        options: [
          { value: 'work', label: 'Work & career' },
          { value: 'relationships', label: 'Relationships' },
          { value: 'wellbeing', label: 'Wellbeing' },
          { value: 'hobbies', label: 'Hobbies & interests' },
          { value: 'future', label: 'Future plans' },
        ],
      },
    ];
    for (const qn of questions) {
      await ctx.db.insert('questionnaires', {
        configId,
        order: qn.order,
        question: qn.question,
        type: qn.type,
        options: qn.options,
        metadata: undefined,
        required: qn.required,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
}
