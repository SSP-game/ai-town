import { ObjectType, v } from 'convex/values';
import { GameId, agentId, parseGameId } from './ids';
import { Id } from '../_generated/dataModel';

export class AgentDescription {
  agentId: GameId<'agents'>;
  identity: string;
  plan: string;
  companionOfUserId?: Id<'users'>;

  constructor(serialized: SerializedAgentDescription) {
    const { agentId, identity, plan, companionOfUserId } = serialized;
    this.agentId = parseGameId('agents', agentId);
    this.identity = identity;
    this.plan = plan;
    this.companionOfUserId = companionOfUserId;
  }

  serialize(): SerializedAgentDescription {
    const { agentId, identity, plan, companionOfUserId } = this;
    return { agentId, identity, plan, companionOfUserId };
  }
}

export const serializedAgentDescription = {
  agentId,
  identity: v.string(),
  plan: v.string(),
  companionOfUserId: v.optional(v.id('users')),
};
export type SerializedAgentDescription = ObjectType<typeof serializedAgentDescription>;
