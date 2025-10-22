import { useState, useEffect, useRef } from 'react';
import { useMutation, useConvex, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useServerGame } from '../hooks/serverGame';
import { characters } from '../../data/characters';
import { Descriptions } from '../../data/characters';
import CompanionChat from './CompanionChat';
import closeImg from '../../assets/close.svg';
import { toast } from 'react-toastify';
import { Stage } from '@pixi/react';
import { ConvexProvider } from 'convex/react';
import { useElementSize } from 'usehooks-ts';
import PixiGame from './PixiGame';
import { useHistoricalTime } from '../hooks/useHistoricalTime';

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

type TabType = 'profile' | 'map';

export default function CompanionPageView({ worldId }: CompanionPageViewProps) {
  const game = useServerGame(worldId);
  const convex = useConvex();
  const [userId, setUserId] = useState<Id<'users'> | null>(null);
  const [selectedCompanion, setSelectedCompanion] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [mapWrapperRef, { width, height }] = useElementSize();

  const updateCompanionMutation = useMutation(api.users.updateSelectedCompanion);
  const removeCompanionMutation = useMutation(api.users.removeSelectedCompanion);

  const worldStatus = useQuery(api.world.defaultWorldStatus);
  const engineId = worldStatus?.engineId;
  const worldState = useQuery(api.world.worldState, worldId ? { worldId } : 'skip');
  const { historicalTime } = useHistoricalTime(worldState?.engine);

  // Get human player token identifier
  const humanTokenIdentifier = useQuery(
    api.world.userStatus,
    worldId && userId ? { worldId, userId } : 'skip'
  ) ?? null;

  // Calculate filter player IDs for map view
  const filterPlayerIds = (() => {
    if (!selectedCompanion || !game) return [];

    const ids = [];

    // Get companion's player ID
    const companionAgent = game.world.agents.get(selectedCompanion);
    if (companionAgent?.playerId) {
      ids.push(companionAgent.playerId);
    }

    // Get human player ID
    const humanPlayerId = [...game.world.players.values()].find(
      (p) => p.human === humanTokenIdentifier
    )?.id;
    if (humanPlayerId) {
      ids.push(humanPlayerId);
    }

    return ids;
  })();

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedCompanion = localStorage.getItem('selectedCompanion');
    if (storedUserId) {
      setUserId(storedUserId as Id<'users'>);
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
          <p className="text-sm text-brown-300">
            Click the Companion button in the footer to login
          </p>
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
  const companionAgentData = selectedCompanion
    ? agents.find((a) => a.id === selectedCompanion)
    : null;
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
      characterName,
    };
  }

  // Tab switching UI
  const tabButtons = (
    <div className="flex gap-2 mb-6">
      <button
        onClick={() => setActiveTab('profile')}
        className={`flex-1 py-3 px-4 rounded-lg font-bold transition-colors ${
          activeTab === 'profile'
            ? 'bg-blue-600 text-white'
            : 'bg-brown-700 text-brown-300 hover:bg-brown-600'
        }`}
      >
        👤 Profile
      </button>
      <button
        onClick={() => setActiveTab('map')}
        className={`flex-1 py-3 px-4 rounded-lg font-bold transition-colors ${
          activeTab === 'map'
            ? 'bg-blue-600 text-white'
            : 'bg-brown-700 text-brown-300 hover:bg-brown-600'
        }`}
      >
        🗺️ Map
      </button>
    </div>
  );

  // Companion selection content for left panel
  const companionSelectionContent = (
    <div className="h-full overflow-y-auto p-6">
      <h1 className="text-4xl font-bold text-brown-100 mb-8 text-center">My Companion</h1>

      {selectedCompanion && tabButtons}

      {selectedCompanion && companionInfo && activeTab === 'profile' ? (
        // Show selected companion in card form
        <div className="mb-8">
          <div className="bg-brown-700 rounded-lg p-8 border-4 border-brown-500 shadow-xl">
            {/* Character Avatar */}
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 bg-brown-600 rounded-full flex items-center justify-center overflow-hidden border-4 border-brown-500 shadow-lg">
                {companionInfo.character?.textureUrl ? (
                  <CharacterAvatar
                    character={companionInfo.character}
                    characterName={companionInfo.characterName || 'f1'}
                  />
                ) : (
                  <div className="text-4xl text-brown-300">🤖</div>
                )}
              </div>
            </div>

            {/* Character Name */}
            <h2 className="text-3xl font-bold text-brown-100 text-center mb-2">
              {companionInfo.staticDescription?.name || `Agent ${companionInfo.agent.id}`}
            </h2>

            {/* Companion Badge */}
            <div className="flex justify-center mb-6">
              <span className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                ✓ Your Companion
              </span>
            </div>

            {/* Character Status */}
            <div className="text-sm text-center mb-6">
              <span
                className={`${
                  companionInfo.agent.inProgressOperation
                    ? 'text-yellow-300'
                    : companionInfo.player?.activity
                      ? 'text-orange-300'
                      : 'text-green-400'
                }`}
              >
                {companionInfo.agent.inProgressOperation
                  ? 'Thinking...'
                  : companionInfo.player?.activity
                    ? 'Busy'
                    : 'Active'}
              </span>
            </div>

            {/* Character Description */}
            <div className="bg-brown-600 rounded-lg p-4 mb-6">
              <p className="text-brown-100 text-sm leading-relaxed">
                {companionInfo.staticDescription?.identity || 'No description available'}
              </p>
            </div>

            {/* Character Plan */}
            {companionInfo.staticDescription?.plan && (
              <div className="mb-6 text-sm text-blue-300 italic bg-brown-600 rounded-lg p-3">
                <strong>Goal:</strong> {companionInfo.staticDescription.plan}
              </div>
            )}

            {/* Current Activity */}
            {companionInfo.player?.activity && (
              <div className="mb-6 text-sm text-yellow-300 bg-brown-600 rounded-lg p-3">
                <strong>Activity:</strong> {companionInfo.player.activity.description}{' '}
                {companionInfo.player.activity.emoji}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowChat(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg text-lg font-bold transition-colors shadow-lg"
              >
                💬 Chat with {companionInfo.staticDescription?.name || 'Companion'}
              </button>
              <button
                onClick={handleRemoveCompanion}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg text-lg font-bold transition-colors shadow-lg"
              >
                ✕ Remove Companion
              </button>
            </div>
          </div>
        </div>
      ) : selectedCompanion && companionInfo && activeTab === 'map' ? (
        // Show map view with companion and user only
        !engineId ? (
          <div className="text-center text-brown-300 py-8">Loading map...</div>
        ) : (
          <div ref={mapWrapperRef} className="w-full h-full relative">
            <Stage width={width} height={height} options={{ backgroundColor: 0x7ab5ff }}>
              <ConvexProvider client={convex}>
                <PixiGame
                  game={game}
                  worldId={worldId}
                  engineId={engineId}
                  width={width}
                  height={height}
                  historicalTime={historicalTime}
                  setSelectedElement={() => {}}
                  filterPlayerIds={filterPlayerIds}
                />
              </ConvexProvider>
            </Stage>
          </div>
        )
      ) : null}

      {!selectedCompanion && (
        // Show companion selection when no companion is selected
        <div className="mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-brown-100 mb-2">Select Your Companion</h2>
            <p className="text-brown-300">
              Choose an agent to be your personal companion. You can chat with them anytime!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className="bg-brown-700 rounded-lg p-6 border-4 border-brown-600 hover:border-brown-500 transition-all cursor-pointer shadow-lg hover:shadow-xl"
                  onClick={() =>
                    handleSelectCompanion(agent.id, staticDescription?.name || `Agent ${agent.id}`)
                  }
                >
                  {/* Character Avatar */}
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 bg-brown-600 rounded-full flex items-center justify-center overflow-hidden border-2 border-brown-500">
                      {character?.textureUrl ? (
                        <CharacterAvatar
                          character={character}
                          characterName={characterName || 'f1'}
                        />
                      ) : (
                        <div className="text-2xl text-brown-300">🤖</div>
                      )}
                    </div>
                  </div>

                  {/* Character Name */}
                  <h3 className="text-xl font-bold text-brown-100 text-center mb-3">
                    {staticDescription?.name || `Agent ${agent.id}`}
                  </h3>

                  {/* Character Status */}
                  <div className="text-sm text-green-400 text-center mb-4">
                    {agent.inProgressOperation
                      ? 'Thinking...'
                      : player.activity
                        ? 'Busy'
                        : 'Active'}
                  </div>

                  {/* Character Description */}
                  <div className="text-brown-200 text-sm leading-relaxed mb-4">
                    {staticDescription?.identity ? (
                      <p className="line-clamp-4">
                        {staticDescription.identity.length > 150
                          ? staticDescription.identity.slice(0, 150) + '...'
                          : staticDescription.identity}
                      </p>
                    ) : (
                      <p className="text-brown-400">No description available</p>
                    )}
                  </div>

                  {/* Character Plan */}
                  {staticDescription?.plan && (
                    <div className="mb-4 text-xs text-blue-300 italic">
                      <strong>Goal:</strong> {staticDescription.plan}
                    </div>
                  )}

                  {/* Current Activity */}
                  {player.activity && (
                    <div className="mb-4 text-xs text-yellow-300">
                      <strong>Activity:</strong> {player.activity.description}{' '}
                      {player.activity.emoji}
                    </div>
                  )}

                  {/* Select Button */}
                  <div className="mt-4">
                    <button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm font-bold transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectCompanion(
                          agent.id,
                          staticDescription?.name || `Agent ${agent.id}`,
                        );
                      }}
                    >
                      Select as Companion
                    </button>
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
      <div className="relative overflow-hidden bg-brown-900">{companionSelectionContent}</div>

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
