import { useState, useEffect, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useServerGame } from '../hooks/serverGame';
import { characters } from '../../data/characters';
import { Descriptions } from '../../data/characters';
import CompanionChat from './CompanionChat';
import closeImg from '../../assets/close.svg';
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
  const [showChat, setShowChat] = useState(false);

  const updateCompanionMutation = useMutation(api.users.updateSelectedCompanion);
  const removeCompanionMutation = useMutation(api.users.removeSelectedCompanion);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedCompanion = localStorage.getItem('selectedCompanion');
    if (storedUserId) {
      setUserId(storedUserId as Id<"users">);
      setSelectedCompanion(storedCompanion);
      // Default to showing chat if user has a companion
      setShowChat(!!storedCompanion);
    }
  }, []);

  if (!game) {
    return <div className="p-8 text-center text-white">Loading...</div>;
  }

  if (!userId) {
    return (
      <div className="h-full bg-brown-800 flex items-center justify-center text-brown-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Companion</h1>
          <p className="text-lg mb-6">You need to login first to select a companion</p>
          <p className="text-sm text-brown-300">Click the Companion button in the footer to login</p>
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
      setShowChat(true);
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
      setShowChat(false);
      toast.success('Companion removed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove companion');
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

  // Companion selection content for left panel
  const companionSelectionContent = (
    <div className="h-full overflow-y-auto p-6">
      <h1 className="text-4xl font-bold text-brown-100 mb-8 text-center">My Companion</h1>

      {selectedCompanion && companionInfo ? (
        // Show selected companion
        <div className="mb-8">
          <div className="box mb-6">
            <h2 className="bg-brown-700 p-4 font-display text-2xl tracking-wider shadow-solid text-center">
              {companionInfo.staticDescription?.name || `Agent ${companionInfo.agent.id}`}
            </h2>
          </div>

          <div className="flex items-center justify-center mb-6">
            <div className="w-24 h-24 bg-brown-700 rounded-full flex items-center justify-center overflow-hidden">
              {companionInfo.character?.textureUrl ? (
                <CharacterAvatar
                  character={companionInfo.character}
                  characterName={companionInfo.characterName || 'f1'}
                />
              ) : (
                <div className="text-3xl text-brown-300">🤖</div>
              )}
            </div>
          </div>

          <div className="desc mb-6">
            <p className="leading-tight -m-4 bg-brown-700 text-base">
              {companionInfo.staticDescription?.identity || 'No description available'}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <a
              className="button text-white shadow-solid text-xl cursor-pointer pointer-events-auto"
              onClick={() => setShowChat(true)}
            >
              <div className="h-full bg-clay-700 text-center">
                <span>Chat with {companionInfo.staticDescription?.name || 'Companion'}</span>
              </div>
            </a>
            <a
              className="button text-white shadow-solid text-xl cursor-pointer pointer-events-auto"
              onClick={handleRemoveCompanion}
            >
              <div className="h-full bg-red-700 text-center">
                <span>Remove Companion</span>
              </div>
            </a>
          </div>
        </div>
      ) : (
        // Show companion selection
        <div className="mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-brown-100 mb-2">Select Your Companion</h2>
            <p className="text-brown-300">Choose an agent to be your personal companion. You can chat with them anytime!</p>
          </div>

          <div className="space-y-4">
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
                  className="box cursor-pointer hover:bg-brown-700 transition-colors"
                  onClick={() => handleSelectCompanion(
                    agent.id,
                    staticDescription?.name || `Agent ${agent.id}`
                  )}
                >
                  <div className="bg-brown-700 p-4">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-12 h-12 bg-brown-600 rounded-full flex items-center justify-center overflow-hidden">
                        {character?.textureUrl ? (
                          <CharacterAvatar
                            character={character}
                            characterName={characterName || 'f1'}
                          />
                        ) : (
                          <div className="text-lg text-brown-300">🤖</div>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-brown-100">
                        {staticDescription?.name || `Agent ${agent.id}`}
                      </h3>
                    </div>
                    <p className="text-brown-200 text-sm">
                      {staticDescription?.identity ? (
                        staticDescription.identity.length > 100
                          ? staticDescription.identity.slice(0, 100) + '...'
                          : staticDescription.identity
                      ) : (
                        'No description available'
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // Use the same layout as Game component with two columns
  return (
    <div className="mx-auto w-full max-w grid grid-rows-[240px_1fr] lg:grid-rows-[1fr] lg:grid-cols-[1fr_auto] lg:grow max-w-none h-full game-frame">
      {/* Left area - Companion selection */}
      <div className="relative overflow-hidden bg-brown-900">
        {companionSelectionContent}
      </div>

      {/* Right column area - Chat */}
      <div className="flex flex-col overflow-y-auto shrink-0 px-4 py-6 sm:px-6 lg:w-96 xl:pr-6 border-t-8 sm:border-t-0 sm:border-l-8 border-brown-900 bg-brown-800 text-brown-100">
        {showChat && selectedCompanion && companionInfo ? (
          <CompanionChat
            agentId={selectedCompanion}
            agentName={companionInfo.staticDescription?.name || `Agent ${companionInfo.agent.id}`}
            userId={userId}
            worldId={worldId}
          />
        ) : (
          <div className="h-full text-xl flex text-center items-center p-4">
            {selectedCompanion ?
              'Click "Chat" to start talking with your companion.' :
              'Select a companion from the left to start chatting.'}
          </div>
        )}
      </div>
    </div>
  );
}