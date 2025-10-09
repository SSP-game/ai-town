import { useMemo, useState } from 'react';

interface LobbyWaitingRoomProps {
  lobbyState: {
    lobbyId: string;
    status: 'waiting' | 'ready_check' | 'paired_chat' | 'free_roam' | 'completed';
    minPlayers: number;
    pairedChatMinutes: number;
    readyCount: number;
    totalPlayers: number;
    fullyPrepared: number;
    startedAt: number | null;
    pairedChatEndsAt: number | null;
    you: {
      ready: boolean;
      status: string;
      readyAt: number | null;
      questionnaireCompletedAt: number;
    } | null;
  };
  onReadyChange: (ready: boolean) => Promise<void> | void;
}

export default function LobbyWaitingRoom({ lobbyState, onReadyChange }: LobbyWaitingRoomProps) {
  const [submitting, setSubmitting] = useState(false);
  const ready = lobbyState.you?.ready ?? false;

  const statusMessage = useMemo(() => {
    switch (lobbyState.status) {
      case 'ready_check':
        return 'Waiting for the remaining participants to press ready…';
      case 'paired_chat':
        return 'Pairing in progress. Your session is about to start!';
      default:
        return 'Please stay on this page. We will begin once everyone is ready.';
    }
  }, [lobbyState.status]);

  const handleToggle = async () => {
    try {
      setSubmitting(true);
      await onReadyChange(!ready);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl w-full mx-auto text-brown-100">
      <div className="box bg-brown-800">
        <div className="bg-brown-700 p-4 text-center">
          <h2 className="text-3xl font-display">Lobby</h2>
          <p className="text-brown-300 mt-2">We’re gathering a cohort for the next session.</p>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-brown-900/40 border border-brown-700 rounded p-3">
              <p className="text-sm uppercase tracking-wide text-brown-400">Ready / Required</p>
              <p className="text-2xl font-display">
                {lobbyState.readyCount} / {lobbyState.minPlayers}
              </p>
            </div>
            <div className="bg-brown-900/40 border border-brown-700 rounded p-3">
              <p className="text-sm uppercase tracking-wide text-brown-400">Checked in</p>
              <p className="text-2xl font-display">
                {lobbyState.fullyPrepared} / {lobbyState.totalPlayers}
              </p>
            </div>
          </div>

          <p className="text-center text-brown-200 text-sm">{statusMessage}</p>

          <button
            onClick={handleToggle}
            disabled={submitting || lobbyState.status === 'paired_chat'}
            className={`w-full button text-white shadow-solid text-lg cursor-pointer pointer-events-auto ${ready ? 'opacity-90' : ''}`}
          >
            <div className={`h-full ${ready ? 'bg-green-700' : 'bg-clay-700'} text-center py-3`}>
              <span>{submitting ? 'Updating…' : ready ? 'Ready ✓ (click to unready)' : 'Press Ready'}</span>
            </div>
          </button>

          <div className="bg-brown-900/30 border border-brown-700 rounded p-4 text-xs text-brown-300 space-y-2">
            <p>
              • Once all {lobbyState.minPlayers} participants are ready, the AI companions will be
              assigned automatically.
            </p>
            <p>
              • Stay on this screen. When the session begins you’ll be redirected to the paired chat
              view.
            </p>
            <p>
              • Estimated chat duration: {lobbyState.pairedChatMinutes} minute(s).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
