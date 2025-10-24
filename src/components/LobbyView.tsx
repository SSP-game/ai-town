import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Game from './Game.tsx';

interface LobbyViewProps {
  userId: Id<'users'>;
}

export default function LobbyView({ userId }: LobbyViewProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<string>('f1');

  const onlineCount = useQuery(api.lobby.getOnlineUsersCount);
  const lobbyStatus = useQuery(api.lobby.getUserLobbyStatus, { userId });
  const joinMatchmaking = useMutation(api.lobby.joinMatchmaking);
  const leaveMatchmaking = useMutation(api.lobby.leaveMatchmaking);

  // Auto-leave on component unmount
  useEffect(() => {
    return () => {
      if (lobbyStatus && lobbyStatus.currentPlayer.status === 'waiting') {
        leaveMatchmaking({ userId }).catch(console.error);
      }
    };
  }, [lobbyStatus, userId, leaveMatchmaking]);

  // Auto-leave on browser close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (lobbyStatus && lobbyStatus.currentPlayer.status === 'waiting') {
        leaveMatchmaking({ userId }).catch(console.error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [lobbyStatus, userId, leaveMatchmaking]);

  // Check if match found and world created
  // NOTE: No longer automatically switch to Game view
  // Players should stay in Lobby and see the game world here
  useEffect(() => {
    if (lobbyStatus?.lobby.status === 'active' && lobbyStatus.lobby.worldId) {
      // Match found! Player stays in Lobby view
      // Game world will be displayed within Lobby component
      console.log('Match found! World ID:', lobbyStatus.lobby.worldId);
    }
  }, [lobbyStatus]);

  const handleJoinMatchmaking = async () => {
    try {
      await joinMatchmaking({
        userId,
        character: selectedCharacter,
      });
      toast.success('Joined matchmaking queue!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join matchmaking');
    }
  };

  const handleLeaveMatchmaking = async () => {
    try {
      await leaveMatchmaking({ userId });
      toast.success('Left matchmaking queue');
    } catch (error) {
      toast.error('Failed to leave matchmaking');
    }
  };

  // If match is found and active, show full game world instead of lobby
  if (lobbyStatus?.lobby.status === 'active' && lobbyStatus.lobby.worldId) {
    return (
      <div className="flex flex-col h-full bg-gray-900">
        {/* Game Header with Room Info */}
        <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-white">🎮 Match World</h2>
              <div className="bg-green-900/30 border border-green-600 rounded px-4 py-2">
                <span className="text-green-300 font-mono">
                  Room: {lobbyStatus.lobby.worldId.slice(-12)}
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              {lobbyStatus.allPlayers.length} Players in Match
            </div>
          </div>
        </div>

        {/* Full Game World */}
        <div className="flex-1 relative">
          <Game matchWorldId={lobbyStatus.lobby.worldId} />
        </div>
      </div>
    );
  }

  // Show lobby interface when not in active match
  return (
    <div className="h-full game-background overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 game-title">🏟️ AI Town Lobby</h1>
          <p className="text-xl text-gray-300">Find other players and start a new game session</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Online Players Count */}
          <div className="bg-gray-800/80 backdrop-blur rounded-xl p-6 border-2 border-gray-700 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400 mb-1">Online Players</div>
                <div className="text-4xl font-bold text-green-400">
                  {onlineCount !== undefined ? onlineCount : '...'}
                </div>
              </div>
              <div className="text-6xl">👥</div>
            </div>
            <p className="text-sm text-gray-400 mt-3">Active in the last 5 minutes</p>
          </div>

          {/* Match Status */}
          <div className="bg-gray-800/80 backdrop-blur rounded-xl p-6 border-2 border-gray-700 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400 mb-1">Match Status</div>
                <div className="text-2xl font-bold text-blue-400">
                  {lobbyStatus ? 'In Queue' : 'Ready'}
                </div>
              </div>
              <div className="text-6xl">🎮</div>
            </div>
            <p className="text-sm text-gray-400 mt-3">
              {lobbyStatus ? `Position #${lobbyStatus.queuePosition}` : 'Join to start matching'}
            </p>
          </div>
        </div>

        {/* Main Lobby Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left/Center: Join Matchmaking or Queue Status */}
          <div className="lg:col-span-2">
            {!lobbyStatus ? (
              // Not in queue - Join Matchmaking Panel
              <div className="bg-gray-800/80 backdrop-blur rounded-xl p-8 border-2 border-gray-700 shadow-xl">
                <h2 className="text-3xl font-bold text-white mb-6 text-center">🎯 Join Matchmaking</h2>

                {/* Character Selection */}
                <div className="mb-6">
                  <label className="text-lg font-semibold text-gray-300 mb-3 block">Select Your Character</label>
                  <div className="grid grid-cols-4 gap-3">
                    {['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8'].map((char) => (
                      <button
                        key={char}
                        onClick={() => setSelectedCharacter(char)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedCharacter === char
                            ? 'bg-blue-600 border-blue-400 text-white'
                            : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        <div className="text-2xl mb-1">
                          {char === 'f1' && '👩'}
                          {char === 'f2' && '👩‍🦰'}
                          {char === 'f3' && '👩‍🦱'}
                          {char === 'f4' && '👨'}
                          {char === 'f5' && '👨‍🦱'}
                          {char === 'f6' && '👨‍🦰'}
                          {char === 'f7' && '🧑'}
                          {char === 'f8' && '🧑‍🦱'}
                        </div>
                        <div className="text-xs font-semibold">{char.toUpperCase()}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleJoinMatchmaking}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl text-2xl font-bold text-white transition-all transform hover:scale-105 shadow-lg"
                >
                  🚀 Join Matchmaking Queue
                </button>
              </div>
            ) : (
              // In queue or matched - Queue Status Panel
              <div className="bg-gray-800/80 backdrop-blur rounded-xl p-8 border-2 border-gray-700 shadow-xl">
                <h2 className="text-3xl font-bold text-white mb-6 text-center">
                  {lobbyStatus.currentPlayer.status === 'waiting' && '⏳ Waiting for Players...'}
                  {lobbyStatus.currentPlayer.status === 'matched' && '🎮 Match Found! Loading Game World...'}
                  {lobbyStatus.currentPlayer.status === 'playing' && '🚀 Starting Game World...'}
                </h2>

                {/* Queue Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 text-center">
                    <div className="text-sm text-blue-300 mb-1">Your Position</div>
                    <div className="text-4xl font-bold text-blue-400">
                      #{lobbyStatus.queuePosition}
                    </div>
                  </div>
                  <div className="bg-purple-900/30 border border-purple-600 rounded-lg p-4 text-center">
                    <div className="text-sm text-purple-300 mb-1">Players in Queue</div>
                    <div className="text-4xl font-bold text-purple-400">
                      {lobbyStatus.totalInQueue}
                    </div>
                  </div>
                </div>

                {/* Players List */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-4">🎭 Players in This Lobby</h3>
                  <div className="space-y-3">
                    {lobbyStatus.allPlayers.map((player, index) => (
                      <div
                        key={player._id}
                        className="bg-gray-700/60 rounded-lg p-4 flex items-center justify-between border border-gray-600"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-3xl font-bold text-gray-400">#{index + 1}</div>
                          <div>
                            <div className="text-lg font-semibold text-white">{player.nickname}</div>
                            <div className="text-sm text-gray-400">Character: {player.character}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-4 py-2 rounded-full text-sm font-bold ${
                              player.status === 'waiting'
                                ? 'bg-yellow-600 text-white'
                                : player.status === 'matched'
                                ? 'bg-green-600 text-white'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            {player.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Match Requirements */}
                <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 mb-6">
                  <p className="text-blue-200 text-center">
                    🎯 Waiting for {lobbyStatus.lobby.humanSlotsRequired} players to start the match.
                    {lobbyStatus.lobby.includeCompanions && ' 🤖 Your AI companion will join you!'}
                  </p>
                </div>

                {/* Leave Button */}
                {lobbyStatus.currentPlayer.status === 'waiting' && (
                  <button
                    onClick={handleLeaveMatchmaking}
                    className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl text-xl font-bold text-white transition-all transform hover:scale-105 shadow-lg"
                  >
                    🚪 Leave Queue
                  </button>
                )}

                {/* Match Found Status */}
                {(lobbyStatus.currentPlayer.status === 'matched' ||
                  lobbyStatus.currentPlayer.status === 'playing') && (
                  <div className="bg-green-900/30 border border-green-600 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-300 mb-2 text-center">
                      🎮 Match Found! Entering Game World...
                    </h3>
                    <p className="text-sm text-green-200 text-center">
                      Room ID: {lobbyStatus.lobby.worldId ? lobbyStatus.lobby.worldId.slice(-12) : 'Loading...'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* How It Works - Info Panel */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800/80 backdrop-blur rounded-xl p-6 border-2 border-gray-700 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-4">📖 How It Works</h3>
                <ul className="text-sm text-gray-300 space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">▸</span>
                    <span>Join the matchmaking queue and wait for other players</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">▸</span>
                    <span>Once enough players join, a new isolated world will be created</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">▸</span>
                    <span>The game world will replace this lobby interface</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">▸</span>
                    <span>Leaving the page will automatically remove you from the queue</span>
                  </li>
                </ul>

                {/* Match Configuration */}
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h4 className="text-lg font-semibold text-white mb-3">⚙️ Match Configuration</h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex justify-between">
                      <span>Players Required:</span>
                      <span className="text-blue-400 font-semibold">2</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Slots:</span>
                      <span className="text-purple-400 font-semibold">5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AI Companions:</span>
                      <span className="text-green-400 font-semibold">Yes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
