import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

interface LobbyViewProps {
  userId: Id<'users'>;
  onMatchFound?: (worldId: Id<'worlds'>) => void;
}

export default function LobbyView({ userId, onMatchFound }: LobbyViewProps) {
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
  useEffect(() => {
    if (lobbyStatus?.lobby.status === 'active' && lobbyStatus.lobby.worldId && onMatchFound) {
      onMatchFound(lobbyStatus.lobby.worldId);
    }
  }, [lobbyStatus, onMatchFound]);

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

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-6xl font-bold font-display game-title mb-4">AI Town Lobby</h1>
          <p className="text-xl text-gray-300">Find other players and start a new game session</p>
        </div>

        {/* Online Players Count */}
        <div className="bg-gray-800/50 rounded-lg p-6 border-2 border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-semibold">Online Players</span>
            <span className="text-4xl font-bold text-green-400">
              {onlineCount !== undefined ? onlineCount : '...'}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-2">Players active in the last 5 minutes</p>
        </div>

        {/* Lobby Status */}
        {!lobbyStatus ? (
          // Not in queue
          <div className="bg-gray-800/50 rounded-lg p-6 border-2 border-gray-700 space-y-4">
            <h2 className="text-3xl font-bold mb-4">Join Matchmaking</h2>

            {/* Character Selection */}
            <div className="space-y-2">
              <label className="text-lg font-semibold">Select Character</label>
              <select
                value={selectedCharacter}
                onChange={(e) => setSelectedCharacter(e.target.value)}
                className="w-full p-3 bg-gray-700 rounded border-2 border-gray-600 text-white text-lg"
              >
                <option value="f1">Character F1</option>
                <option value="f2">Character F2</option>
                <option value="f3">Character F3</option>
                <option value="f4">Character F4</option>
                <option value="f5">Character F5</option>
                <option value="f6">Character F6</option>
                <option value="f7">Character F7</option>
                <option value="f8">Character F8</option>
              </select>
            </div>

            <button
              onClick={handleJoinMatchmaking}
              className="w-full py-4 bg-green-600 hover:bg-green-700 rounded-lg text-2xl font-bold transition-colors"
            >
              Join Queue
            </button>
          </div>
        ) : (
          // In queue or matched
          <div className="bg-gray-800/50 rounded-lg p-6 border-2 border-gray-700 space-y-4">
            <h2 className="text-3xl font-bold mb-4">
              {lobbyStatus.currentPlayer.status === 'waiting' && 'Waiting for Players...'}
              {lobbyStatus.currentPlayer.status === 'matched' && 'Match Found!'}
              {lobbyStatus.currentPlayer.status === 'playing' && 'Loading Game...'}
            </h2>

            {/* Queue Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700/50 p-4 rounded">
                <div className="text-sm text-gray-400">Your Position</div>
                <div className="text-3xl font-bold text-blue-400">
                  #{lobbyStatus.queuePosition}
                </div>
              </div>
              <div className="bg-gray-700/50 p-4 rounded">
                <div className="text-sm text-gray-400">Players in Queue</div>
                <div className="text-3xl font-bold text-purple-400">
                  {lobbyStatus.totalInQueue}
                </div>
              </div>
            </div>

            {/* Players List */}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Players in This Lobby</h3>
              <div className="space-y-2">
                {lobbyStatus.allPlayers.map((player, index) => (
                  <div
                    key={player._id}
                    className="bg-gray-700/50 p-3 rounded flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-gray-500">#{index + 1}</span>
                      <span className="text-lg">{player.nickname}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">{player.character}</span>
                      <span
                        className={`px-3 py-1 rounded text-sm font-semibold ${
                          player.status === 'waiting'
                            ? 'bg-yellow-600'
                            : player.status === 'matched'
                            ? 'bg-green-600'
                            : 'bg-blue-600'
                        }`}
                      >
                        {player.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Match Requirements */}
            <div className="bg-blue-900/30 border border-blue-600 rounded p-4">
              <p className="text-sm text-blue-200">
                Waiting for {lobbyStatus.lobby.humanSlotsRequired} players to start the match.
                {lobbyStatus.lobby.includeCompanions && ' Your companion will join you!'}
              </p>
            </div>

            {/* Leave Button */}
            {lobbyStatus.currentPlayer.status === 'waiting' && (
              <button
                onClick={handleLeaveMatchmaking}
                className="w-full py-4 bg-red-600 hover:bg-red-700 rounded-lg text-2xl font-bold transition-colors"
              >
                Leave Queue
              </button>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold mb-2">How It Works</h3>
          <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
            <li>Join the matchmaking queue and wait for other players</li>
            <li>Once enough players join, a new isolated world will be created</li>
            <li>You'll automatically be redirected to the game when ready</li>
            <li>Leaving the page will automatically remove you from the queue</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
