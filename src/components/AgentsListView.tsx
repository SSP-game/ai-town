import { Descriptions, characters } from '../../data/characters';
import { Id } from '../../convex/_generated/dataModel';
import { useServerGame } from '../hooks/serverGame';
import { useEffect, useRef, useState } from 'react';
import CompanionChat from './CompanionChat';
import Button from './buttons/Button';

export interface AgentsListViewProps {
  worldId: Id<'worlds'>;
  onSelectAgent?: (agentId: string) => void;
}

export default function AgentsListView({ worldId, onSelectAgent }: AgentsListViewProps) {
  const game = useServerGame(worldId);
  const [selectedAgent, setSelectedAgent] = useState<{ id: string; name: string; description?: string } | null>(null);
  const [userId, setUserId] = useState<Id<"users"> | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId as Id<"users">);
    }
  }, []);

  if (!game) {
    return <div className="p-8 text-center text-white">Loading agents...</div>;
  }

  const agents = [...game.world.agents.values()];

  const handleChatWithAgent = (agentId: string, agentName: string, agentDescription?: string) => {
    if (!userId) {
      // Show login modal if not logged in
      return;
    }

    // Toggle: if clicking same agent, deselect; otherwise select new agent
    if (selectedAgent?.id === agentId) {
      setSelectedAgent(null);
    } else {
      setSelectedAgent({ id: agentId, name: agentName, description: agentDescription });
    }
  };

  return (
    <div className="h-full game-background overflow-hidden flex">
      {/* Left side - Agents List */}
      <div className={`${selectedAgent ? 'w-1/2' : 'w-full'} overflow-y-auto transition-all duration-300`}>
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
                  <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                    {character?.textureUrl ? (
                      <CharacterAvatar
                        character={character}
                        characterName={characterName || 'f1'}
                      />
                    ) : (
                      <div className="text-2xl text-gray-400">🤖</div>
                    )}
                  </div>
                </div>

                {/* Character Name */}
                <h3 className="text-xl font-bold text-white text-center mb-3">
                  {staticDescription?.name || `Agent ${agent.id}`}
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
                  ) : agentDescription?.identity ? (
                    <p className="line-clamp-4">
                      {agentDescription.identity.length > 200
                        ? agentDescription.identity.slice(0, 200) + '...'
                        : agentDescription.identity}
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
                <div className="text-xs text-gray-500 mb-4">
                  <div>Agent ID: {agent.id}</div>
                  <div>Character: {characterName || 'Unknown'}</div>
                </div>

                {/* Chat Button */}
                <div className="mt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChatWithAgent(
                        agent.id,
                        staticDescription?.name || `Agent ${agent.id}`,
                        staticDescription?.identity || agentDescription?.identity
                      );
                    }}
                    className={`w-full ${selectedAgent?.id === agent.id ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white py-2 px-4 rounded text-sm font-bold disabled:opacity-50`}
                    disabled={!userId}
                  >
                    {userId ? (selectedAgent?.id === agent.id ? 'Close Chat' : 'Chat') : 'Login to Chat'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>

      {/* Right side - Chat Panel */}
      {selectedAgent && userId && (
        <div className="w-1/2 bg-brown-800 border-l-8 border-brown-900 overflow-hidden flex flex-col">
          <div className="p-4">
            <button
              onClick={() => setSelectedAgent(null)}
              className="bg-brown-700 hover:bg-brown-600 text-white px-4 py-2 rounded text-sm font-bold mb-4"
            >
              ← Back to Agents
            </button>
          </div>
          <CompanionChat
            agentId={selectedAgent.id}
            agentName={selectedAgent.name}
            agentDescription={selectedAgent.description}
            userId={userId}
            worldId={worldId}
          />
        </div>
      )}
    </div>
  );
}

// Character Avatar component using canvas to properly render sprites
function CharacterAvatar({
  character,
  characterName,
}: {
  character: { textureUrl: string; spritesheetData?: any };
  characterName: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, 64, 64);

      // Get the sprite frame data
      const frameData = character.spritesheetData?.frames?.down;

      if (frameData && frameData.frame) {
        const { x, y, w, h } = frameData.frame;
        // Draw the specific sprite frame from the spritesheet
        // Source: x, y, width, height from spritesheet
        // Destination: 0, 0, 64, 64 (scaled up)
        ctx.imageSmoothingEnabled = false; // Keep pixels sharp
        ctx.drawImage(img, x, y, w, h, 0, 0, 64, 64);
      } else {
        // Fallback: use simple position mapping
        const characterPositions: { [key: string]: { x: number; y: number } } = {
          f1: { x: 0, y: 0 }, // Lucky
          f2: { x: 32, y: 0 },
          f3: { x: 64, y: 0 }, // Alice
          f4: { x: 96, y: 0 }, // Bob
          f5: { x: 128, y: 0 },
          f6: { x: 160, y: 0 }, // Stella
          f7: { x: 192, y: 0 }, // Pete
          f8: { x: 224, y: 0 },
        };

        const pos = characterPositions[characterName] || { x: 0, y: 0 };
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, pos.x, pos.y, 32, 32, 0, 0, 64, 64);
      }

      setImageLoaded(true);
    };

    img.onerror = () => {
      console.error('Failed to load character image:', character.textureUrl);
    };

    img.src = character.textureUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [character.textureUrl, character.spritesheetData, characterName]);

  return (
    <canvas
      ref={canvasRef}
      width={64}
      height={64}
      className={`w-16 h-16 ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
