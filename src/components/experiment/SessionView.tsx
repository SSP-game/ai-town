import { useEffect, useMemo, useState } from 'react';
import Game from '../Game';
import CompanionChat from '../CompanionChat';
import { Id } from '../../../convex/_generated/dataModel';

interface SessionViewProps {
  userId: Id<'users'>;
  worldId: Id<'worlds'>;
  phase: 'paired_chat' | 'free_roam';
  assignment?: {
    agentId: string;
    chatId: Id<'userAgentChats'> | null;
    movementLockUntil: number | null;
  } | null;
  pairedChatEndsAt?: number | null;
}

export default function SessionView({
  userId,
  worldId,
  phase,
  assignment,
  pairedChatEndsAt,
}: SessionViewProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!pairedChatEndsAt || phase !== 'paired_chat') {
      return;
    }
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [pairedChatEndsAt, phase]);

  const remaining = useMemo(() => {
    if (!pairedChatEndsAt) {
      return 0;
    }
    return Math.max(0, pairedChatEndsAt - now);
  }, [pairedChatEndsAt, now]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  const movementLocked = phase === 'paired_chat';

  const chatPanel = assignment ? (
    <div className="flex flex-col h-full">
      {phase === 'paired_chat' && (
        <div className="mb-4 bg-brown-900/50 border border-brown-700 rounded p-3 text-center text-sm text-brown-200">
          <p className="uppercase tracking-wide text-brown-300 text-xs">Paired chat underway</p>
          <p className="text-lg font-display">
            Time remaining: {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </p>
          <p className="text-xs mt-1">Movement is disabled until the countdown reaches zero.</p>
        </div>
      )}
      {assignment.chatId ? (
        <CompanionChat
          agentId={assignment.agentId}
          agentName={assignment.agentId.toUpperCase()}
          userId={userId}
          worldId={worldId}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-brown-200 bg-brown-900/40 border border-brown-700 rounded">
          <p>Setting up your AI companion…</p>
        </div>
      )}
    </div>
  ) : (
    <div className="flex items-center justify-center h-full text-brown-200 bg-brown-900/40 border border-brown-700 rounded">
      <p>Pairing…</p>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <Game movementLocked={movementLocked} rightPanel={chatPanel} />
      </div>
    </div>
  );
}
