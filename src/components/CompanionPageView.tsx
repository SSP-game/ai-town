import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useServerGame } from '../hooks/serverGame';
import { characters } from '../../data/characters';
import { Descriptions } from '../../data/characters';
import AgentChatModal from './AgentChatModal';
import { toast } from 'react-toastify';

interface CompanionPageViewProps {
  worldId: Id<'worlds'>;
}

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
      ctx.clearRect(0, 0, 64, 64);

      const frameData = character.spritesheetData?.frames?.down;

      if (frameData && frameData.frame) {
        const { x, y, w, h } = frameData.frame;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, x, y, w, h, 0, 0, 64, 64);
      } else {
        const characterPositions: { [key: string]: { x: number; y: number } } = {
          f1: { x: 0, y: 0 },
          f2: { x: 32, y: 0 },
          f3: { x: 64, y: 0 },
          f4: { x: 96, y: 0 },
          f5: { x: 128, y: 0 },
          f6: { x: 160, y: 0 },
          f7: { x: 192, y: 0 },
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

export default function CompanionPageView({ worldId }: CompanionPageViewProps) {
  const game = useServerGame(worldId);
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [selectedCompanion, setSelectedCompanion] = useState<string | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [companionAgent, setCompanionAgent] = useState<{ id: string; name: string } | null>(null);

  const updateCompanionMutation = useMutation(api.users.updateSelectedCompanion);
  const removeCompanionMutation = useMutation(api.users.removeSelectedCompanion);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedCompanion = localStorage.getItem('selectedCompanion');
    if (storedUserId) {
      setUserId(storedUserId as Id<"users">);
      setSelectedCompanion(storedCompanion);

      // Auto-open chat if user has a companion
      if (storedCompanion && game) {
        const agents = [...game.world.agents.values()];
        const agent = agents.find(a => a.id === storedCompanion);
        if (agent) {
          const player = game.world.players.get(agent.playerId);
          const playerDescription = game.playerDescriptions.get(agent.playerId);
          const characterName = playerDescription?.character;
          const staticDescription = Descriptions.find((d) => d.character === characterName);

          setCompanionAgent({
            id: agent.id,
            name: staticDescription?.name || `Agent ${agent.id}`
          });
          setChatModalOpen(true);
        }
      }
    }
  }, [game]);

  if (!game) {
    return <div className="p-8 text-center text-white">Loading...</div>;
  }

  if (!userId) {
    return (
      <div className="h-full game-background flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Companion</h1>
          <p className="text-lg mb-6">You need to login first to select a companion</p>
          <p className="text-sm text-gray-400">Click the Companion button in the footer to login</p>
        </div>
      </div>
    );
  }

  const agents = [...game.world.agents.values()];

  const handleSelectCompanion = async (agentId: string, agentName: string) => {
    try {
      await updateCompanionMutation({ userId, companionId: agentId });
      setSelectedCompanion(agentId);
      localStorage.setItem('selectedCompanion', agentId);
      toast.success(`${agentName} is now your companion!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to select companion');
    }
  };

  const handleRemoveCompanion = async () => {
    try {
      await removeCompanionMutation({ userId });
      setSelectedCompanion(null);
      localStorage.removeItem('selectedCompanion');
      toast.success('Companion removed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove companion');
    }
  };

  const handleChatWithCompanion = () => {
    if (selectedCompanion) {
      const agent = agents.find(a => a.id === selectedCompanion);
      if (agent) {
        const player = game.world.players.get(agent.playerId);
        const playerDescription = game.playerDescriptions.get(agent.playerId);
        const characterName = playerDescription?.character;
        const staticDescription = Descriptions.find((d) => d.character === characterName);

        setCompanionAgent({
          id: agent.id,
          name: staticDescription?.name || `Agent ${agent.id}`
        });
        setChatModalOpen(true);
      }
    }
  };

  // Find the selected companion agent
  const companionAgentData = selectedCompanion ? agents.find(a => a.id === selectedCompanion) : null;
  let companionInfo = null;

  if (companionAgentData) {
    const player = game.world.players.get(companionAgentData.playerId);
    const playerDescription = game.playerDescriptions.get(companionAgentData.playerId);
    const characterName = playerDescription?.character;
    const character = characters.find((c) => c.name === characterName);
    const staticDescription = Descriptions.find((d) => d.character === characterName);

    companionInfo = {
      agent: companionAgentData,
      player,
      character,
      staticDescription,
      characterName
    };
  }

  return (
    <div className="h-full game-background overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">My Companion</h1>

        {selectedCompanion && companionInfo ? (
          // Show selected companion
          <div className="mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border-2 border-yellow-500">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                  {companionInfo.character?.textureUrl ? (
                    <CharacterAvatar
                      character={companionInfo.character}
                      characterName={companionInfo.characterName || 'f1'}
                    />
                  ) : (
                    <div className="text-2xl text-gray-400">🤖</div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-yellow-400 mb-2">
                    {companionInfo.staticDescription?.name || `Agent ${companionInfo.agent.id}`}
                  </h2>
                  <p className="text-green-400 text-sm">Your Companion</p>
                </div>
              </div>

              {companionInfo.staticDescription?.identity && (
                <p className="text-gray-300 mb-4">
                  {companionInfo.staticDescription.identity}
                </p>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleChatWithCompanion}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded font-bold"
                >
                  Chat with {companionInfo.staticDescription?.name || 'Companion'}
                </button>
                <button
                  onClick={handleRemoveCompanion}
                  className="bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded font-bold"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Show companion selection
          <div className="mb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Select Your Companion</h2>
              <p className="text-gray-400">Choose an agent to be your personal companion. You can chat with them anytime!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => {
                const player = game.world.players.get(agent.playerId);
                const playerDescription = game.playerDescriptions.get(agent.playerId);
                const characterName = playerDescription?.character;
                const character = characters.find((c) => c.name === characterName);
                const staticDescription = Descriptions.find((d) => d.character === characterName);

                if (!player || !playerDescription) {
                  return null;
                }

                return (
                  <div
                    key={agent.id}
                    className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors"
                  >
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

                    <h3 className="text-xl font-bold text-white text-center mb-3">
                      {staticDescription?.name || `Agent ${agent.id}`}
                    </h3>

                    <div className="text-gray-300 text-sm leading-relaxed mb-4">
                      {staticDescription?.identity ? (
                        <p className="line-clamp-3">
                          {staticDescription.identity.length > 150
                            ? staticDescription.identity.slice(0, 150) + '...'
                            : staticDescription.identity}
                        </p>
                      ) : (
                        <p className="text-gray-500">No description available</p>
                      )}
                    </div>

                    <button
                      onClick={() => handleSelectCompanion(
                        agent.id,
                        staticDescription?.name || `Agent ${agent.id}`
                      )}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded font-bold"
                    >
                      Select as Companion
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {companionAgent && (
        <AgentChatModal
          isOpen={chatModalOpen}
          onClose={() => setChatModalOpen(false)}
          agentId={companionAgent.id}
          agentName={companionAgent.name}
          userId={userId}
          worldId={worldId}
        />
      )}
    </div>
  );
}