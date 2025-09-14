import { Descriptions, characters } from '../../data/characters';
import { Id } from '../../convex/_generated/dataModel';
import { useServerGame } from '../hooks/serverGame';

export interface AgentsListViewProps {
  worldId: Id<'worlds'>;
  onSelectAgent?: (agentId: string) => void;
}

export default function AgentsListView({ worldId, onSelectAgent }: AgentsListViewProps) {
  const game = useServerGame(worldId);

  if (!game) {
    return <div className="p-8 text-center text-white">Loading agents...</div>;
  }

  const agents = [...game.world.agents.values()];

  return (
    <div className="h-full game-background overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">AI Town Residents</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
          {agents.map((agent) => {
            const player = game.world.players.get(agent.playerId);
            const playerDescription = game.playerDescriptions.get(agent.playerId);
            const agentDescription = game.agentDescriptions.get(agent.id);
            const characterName = playerDescription?.character;
            const character = characters.find((c) => c.name === characterName);

            // Get the description from data/characters.ts
            const staticDescription = Descriptions.find((d) => d.character === characterName);

            if (!player || !playerDescription) {
              return null;
            }

            return (
              <div
                key={agent.id}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-500 transition-colors cursor-pointer"
                onClick={() => onSelectAgent?.(agent.id)}
              >
                {/* Character Avatar */}
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center">
                    {character?.textureUrl ? (
                      <div
                        className="w-16 h-16 bg-cover bg-center rounded-full border-2 border-gray-600"
                        style={{
                          backgroundImage: `url(${character.textureUrl})`,
                          backgroundPosition: getCharacterSpritePosition(characterName || 'f1'),
                        }}
                      ></div>
                    ) : (
                      <div className="text-2xl text-gray-400">🤖</div>
                    )}
                  </div>
                </div>

                {/* Character Name */}
                <h3 className="text-xl font-bold text-white text-center mb-3">
                  {staticDescription?.name || agentDescription?.name || `Agent ${agent.id}`}
                </h3>

                {/* Character Status */}
                <div className="text-sm text-green-400 text-center mb-4">
                  {agent.inProgressOperation ? 'Thinking...' : player.activity ? 'Busy' : 'Active'}
                </div>

                {/* Character Description */}
                <div className="text-gray-300 text-sm leading-relaxed mb-4">
                  {staticDescription?.identity ? (
                    <p className="line-clamp-4">
                      {staticDescription.identity.length > 200
                        ? staticDescription.identity.slice(0, 200) + '...'
                        : staticDescription.identity}
                    </p>
                  ) : agentDescription?.description ? (
                    <p className="line-clamp-4">
                      {agentDescription.description.length > 200
                        ? agentDescription.description.slice(0, 200) + '...'
                        : agentDescription.description}
                    </p>
                  ) : (
                    <p className="text-gray-500">No description available</p>
                  )}
                </div>

                {/* Character Plan */}
                {staticDescription?.plan && (
                  <div className="mb-4 text-xs text-blue-400 italic">
                    <strong>Goal:</strong> {staticDescription.plan}
                  </div>
                )}

                {/* Current Activity */}
                {player.activity && (
                  <div className="mb-4 text-xs text-yellow-400">
                    <strong>Activity:</strong> {player.activity.description} {player.activity.emoji}
                  </div>
                )}

                {/* Character Info */}
                <div className="text-xs text-gray-500">
                  <div>Agent ID: {agent.id}</div>
                  <div>Character: {characterName || 'Unknown'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Helper function to get sprite position for character avatar
function getCharacterSpritePosition(character: string): string {
  const spriteMap: { [key: string]: string } = {
    f1: '0px 0px',
    f2: '-32px 0px',
    f3: '-64px 0px',
    f4: '-96px 0px',
    f5: '-128px 0px',
    f6: '-160px 0px',
    f7: '-192px 0px',
    f8: '-224px 0px',
  };
  return spriteMap[character] || '0px 0px';
}
