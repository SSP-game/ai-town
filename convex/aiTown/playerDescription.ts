import { ObjectType, v } from 'convex/values';
import { GameId, parseGameId, playerId } from './ids';
import { Id } from '../_generated/dataModel';

export const serializedPlayerDescription = {
  playerId,
  name: v.string(),
  description: v.string(),
  character: v.string(),
  userId: v.optional(v.id('users')),
};
export type SerializedPlayerDescription = ObjectType<typeof serializedPlayerDescription>;

export class PlayerDescription {
  playerId: GameId<'players'>;
  name: string;
  description: string;
  character: string;
  userId?: Id<'users'>;

  constructor(serialized: SerializedPlayerDescription) {
    const { playerId, name, description, character, userId } = serialized;
    this.playerId = parseGameId('players', playerId);
    this.name = name;
    this.description = description;
    this.character = character;
    this.userId = userId;
  }

  serialize(): SerializedPlayerDescription {
    const { playerId, name, description, character, userId } = this;
    return {
      playerId,
      name,
      description,
      character,
      userId,
    };
  }
}
