import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

interface EndViewProps {
  userId: Id<'users'>;
  statsId: Id<'matchStats'>;
  onPlayAgain: () => void;
}

/**
 * End View - Displays game completion statistics
 *
 * Shows after a match ends with statistics like:
 * - Game duration
 * - Number of conversations
 * - Messages sent/received
 * - Conversation partners
 */
export default function EndView({ userId, statsId, onPlayAgain }: EndViewProps) {
  const stats = useQuery(api.matchStats.getMatchStats, { statsId });
  const dismissStats = useMutation(api.matchStats.dismissStats);
  const clearCompanion = useMutation(api.matchStats.clearCompanionForReplay);

  const handlePlayAgain = async () => {
    try {
      // Dismiss the stats so they don't show again
      await dismissStats({ statsId });
      // Clear companion to return to companion selection step
      await clearCompanion({ userId });
      onPlayAgain();
    } catch (error) {
      console.error('Error starting new game:', error);
    }
  };

  // Format duration from milliseconds to MM:SS
  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!stats) {
    return (
      <div className="min-h-screen bg-brown-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brown-900 via-brown-800 to-brown-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold font-display game-title mb-4">
            🎮 Game Complete!
          </h1>
          <p className="text-xl text-brown-300">
            Thanks for playing AI Town
          </p>
        </div>

        {/* Stats Card */}
        <div className="bg-brown-800/50 backdrop-blur-sm rounded-lg border-2 border-brown-600 p-6 mb-6">
          <h2 className="text-2xl font-bold mb-6 text-center border-b border-brown-600 pb-3">
            📊 Your Game Statistics
          </h2>

          {/* Duration */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-brown-700/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">
                {formatDuration(stats.durationMs)}
              </div>
              <div className="text-sm text-brown-300 mt-1">Duration</div>
            </div>

            <div className="bg-brown-700/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-400">
                {stats.totalConversations}
              </div>
              <div className="text-sm text-brown-300 mt-1">Conversations</div>
            </div>
          </div>

          {/* Messages */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-brown-700/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-yellow-400">
                {stats.messagesSent}
              </div>
              <div className="text-sm text-brown-300 mt-1">Messages Sent</div>
            </div>

            <div className="bg-brown-700/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-purple-400">
                {stats.messagesReceived}
              </div>
              <div className="text-sm text-brown-300 mt-1">Messages Received</div>
            </div>
          </div>

          {/* Conversation Partners */}
          {stats.conversationPartners.length > 0 && (
            <div className="bg-brown-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-center">
                👥 People You Met
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                {stats.conversationPartners.map((partner, index) => (
                  <span
                    key={index}
                    className="bg-brown-600 px-3 py-1 rounded-full text-sm"
                  >
                    {partner}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Play Again Button */}
        <div className="text-center">
          <button
            onClick={handlePlayAgain}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600
                       text-white font-bold py-4 px-8 rounded-lg text-xl
                       transform transition-all duration-200 hover:scale-105
                       shadow-lg hover:shadow-blue-500/25"
          >
            🔄 Play Again
          </button>
          <p className="text-brown-400 text-sm mt-3">
            Select a new companion and join another match
          </p>
        </div>

        {/* Footer info */}
        <div className="text-center mt-8 text-brown-500 text-sm">
          <p>Game ended at {new Date(stats.endedAt).toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
}
