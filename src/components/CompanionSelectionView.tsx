import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useServerGame } from '../hooks/serverGame';
import { characters, Descriptions } from '../../data/characters';
import { toast } from 'react-toastify';
import CompanionChat from './CompanionChat';
import CompanionAvatarChat from './CompanionAvatarChat';

interface CompanionSelectionViewProps {
  userId: Id<'users'>;
  worldId?: Id<'worlds'>;
  onCompanionSelected: () => void;
}

interface CompanionInfo {
  id: string;
  name: string;
  character: string;
  characterData: { textureUrl: string; spritesheetData?: any; name: string; speed: number } | undefined;
  identity: string;
  plan: string | undefined;
  activity: any;
  isThinking: any;
  isBusy: boolean;
}

/**
 * Character Avatar Component
 * Renders a character sprite from the spritesheet
 */
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

/**
 * Companion Selection View
 *
 * Allows users to select an AI companion before entering the lobby.
 * This is a required step in the game flow.
 * Includes chat dialogue with selected companion.
 */
export default function CompanionSelectionView({
  userId,
  worldId,
  onCompanionSelected,
}: CompanionSelectionViewProps) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [isCompanionTyping, setIsCompanionTyping] = useState(false);

  // Get game data to list available agents
  const game = worldId ? useServerGame(worldId) : null;

  // Mutation to update user's selected companion
  const updateCompanion = useMutation(api.users.updateSelectedCompanion);

  // Get available agents from the game world
  const agents = game?.world?.agents ? [...game.world.agents.values()] : [];

  // Build companion data with full details
  const availableCompanions: CompanionInfo[] = agents.length > 0
    ? agents.map((agent) => {
        const player = game?.world.players.get(agent.playerId);
        const playerDescription = game?.playerDescriptions.get(agent.playerId);
        const characterName = playerDescription?.character;
        const character = characters.find((c) => c.name === characterName);
        const staticDescription = Descriptions.find((d) => d.character === characterName);

        return {
          id: agent.id.toString(),
          name: staticDescription?.name || playerDescription?.name || 'Unknown Agent',
          character: characterName || 'f1',
          characterData: character,
          identity: staticDescription?.identity || 'A mysterious AI companion',
          plan: staticDescription?.plan,
          activity: player?.activity,
          isThinking: agent.inProgressOperation,
          isBusy: !!player?.activity,
        };
      })
    : Descriptions.map((desc, index) => ({
        id: `agent-${index}`,
        name: desc.name,
        character: desc.character,
        characterData: characters.find((c) => c.name === desc.character),
        identity: desc.identity,
        plan: desc.plan,
        activity: null,
        isThinking: false,
        isBusy: false,
      }));

  // Get selected companion info
  const selectedCompanionInfo = selectedAgent
    ? availableCompanions.find((c) => c.id === selectedAgent)
    : null;

  const handleSelectCompanion = (companionId: string, companionName: string) => {
    setSelectedAgent(companionId);
    setShowChat(true);
    toast.info(`${companionName} selected! Chat with them or continue to lobby.`);
  };

  const handleContinueToLobby = async () => {
    if (!selectedAgent) {
      toast.warning('Please select a companion first');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateCompanion({
        userId,
        companionId: selectedAgent,
      });
      toast.success('Companion selected!');
      onCompanionSelected();
    } catch (error) {
      console.error('Error selecting companion:', error);
      toast.error('Failed to select companion. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveCompanion = () => {
    setSelectedAgent(null);
    setShowChat(false);
    toast.info('Companion deselected');
  };

  // Use the same two-column layout as original CompanionPageView
  return (
    <div className="mx-auto w-full max-w grid grid-rows-[240px_1fr] lg:grid-rows-[1fr] lg:grid-cols-[1fr_auto] lg:grow max-w-none h-full game-frame">
      {/* Left area - Companion selection or Avatar view */}
      <div className="relative overflow-hidden bg-brown-900 flex flex-col min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          {selectedAgent && selectedCompanionInfo ? (
            <>
              {/* Companion Description */}
              <div className="desc mb-4">
                <p className="leading-tight p-4 bg-brown-700 text-base sm:text-sm rounded-lg">
                  {selectedCompanionInfo.identity}
                </p>
              </div>

              {/* Face-to-face avatar chat view */}
              <div className="h-48 mb-4 rounded-lg overflow-hidden">
                <CompanionAvatarChat
                  companionName={selectedCompanionInfo.name}
                  companionCharacter={selectedCompanionInfo.character}
                  userName={localStorage.getItem('userNickname') || 'You'}
                  userCharacter={localStorage.getItem('selectedCharacter') || 'f1'}
                  isUserTyping={isUserTyping}
                  isCompanionTyping={isCompanionTyping}
                />
              </div>

              {/* Continue Button */}
              <div className="text-center mb-6">
                <button
                  onClick={handleContinueToLobby}
                  disabled={isSubmitting}
                  className={`
                    font-bold py-4 px-8 rounded-lg text-xl
                    transform transition-all duration-200
                    ${
                      !isSubmitting
                        ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white hover:scale-105 shadow-lg hover:shadow-green-500/25'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">...</span> Selecting...
                    </span>
                  ) : (
                    'Continue to Lobby'
                  )}
                </button>
                <p className="text-brown-400 text-sm mt-3">
                  Or chat with your companion first
                </p>
              </div>

              {/* Change Companion Link */}
              <div className="text-center">
                <button
                  onClick={handleRemoveCompanion}
                  className="text-brown-400 hover:text-brown-200 underline text-sm"
                >
                  Choose a different companion
                </button>
              </div>
            </>
          ) : (
            // Companion Selection Grid
            <div className="mb-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-brown-100 mb-2">Select Your Companion</h2>
                <p className="text-brown-300">
                  Choose an agent to be your personal companion. You can chat with them anytime!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableCompanions.map((companion) => {
                  const isSelected = selectedAgent === companion.id;

                  return (
                    <div
                      key={companion.id}
                      className={`
                        bg-brown-700 rounded-lg p-6 border-4 transition-all cursor-pointer shadow-lg hover:shadow-xl
                        ${isSelected ? 'border-blue-500 bg-brown-600' : 'border-brown-600 hover:border-brown-500'}
                      `}
                      onClick={() => handleSelectCompanion(companion.id, companion.name)}
                    >
                      {/* Character Avatar */}
                      <div className="flex justify-center mb-4">
                        <div className="w-20 h-20 bg-brown-600 rounded-full flex items-center justify-center overflow-hidden border-2 border-brown-500">
                          {companion.characterData?.textureUrl ? (
                            <CharacterAvatar
                              character={companion.characterData}
                              characterName={companion.character}
                            />
                          ) : (
                            <div className="text-2xl text-brown-300">?</div>
                          )}
                        </div>
                      </div>

                      {/* Character Name */}
                      <h3 className="text-xl font-bold text-brown-100 text-center mb-3">
                        {companion.name}
                      </h3>

                      {/* Character Status */}
                      <div className="text-sm text-center mb-4">
                        <span
                          className={`
                            ${companion.isThinking ? 'text-yellow-400' : companion.isBusy ? 'text-orange-400' : 'text-green-400'}
                          `}
                        >
                          {companion.isThinking ? 'Thinking...' : companion.isBusy ? 'Busy' : 'Active'}
                        </span>
                      </div>

                      {/* Character Description */}
                      <div className="text-brown-200 text-sm leading-relaxed mb-4">
                        <p className="line-clamp-4">
                          {companion.identity.length > 150
                            ? companion.identity.slice(0, 150) + '...'
                            : companion.identity}
                        </p>
                      </div>

                      {/* Character Plan */}
                      {companion.plan && (
                        <div className="mb-4 text-xs text-blue-300 italic">
                          <strong>Goal:</strong> {companion.plan}
                        </div>
                      )}

                      {/* Current Activity */}
                      {companion.activity && (
                        <div className="mb-4 text-xs text-yellow-300">
                          <strong>Activity:</strong> {companion.activity.description}{' '}
                          {companion.activity.emoji}
                        </div>
                      )}

                      {/* Select Button */}
                      <div className="mt-4">
                        <button
                          className={`
                            w-full py-2 px-4 rounded text-sm font-bold transition-colors
                            ${isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'}
                          `}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCompanion(companion.id, companion.name);
                          }}
                        >
                          {isSelected ? 'Selected' : 'Select as Companion'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right column area - Chat */}
      <div className="flex flex-col overflow-y-auto shrink-0 px-4 py-6 sm:px-6 lg:w-96 xl:pr-6 border-t-8 sm:border-t-0 sm:border-l-8 border-brown-900 bg-brown-800 text-brown-100">
        {showChat && selectedAgent && selectedCompanionInfo && worldId ? (
          <CompanionChat
            agentId={selectedAgent}
            agentName={selectedCompanionInfo.name}
            agentDescription={selectedCompanionInfo.identity}
            userId={userId}
            worldId={worldId}
            onTypingChange={setIsUserTyping}
            onCompanionTypingChange={setIsCompanionTyping}
            onRemove={handleRemoveCompanion}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-bold mb-2">Chat with Your Companion</h3>
            <p className="text-brown-300">
              {selectedAgent
                ? 'Click "Chat" to start talking with your companion.'
                : 'Select a companion from the left to start chatting.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
