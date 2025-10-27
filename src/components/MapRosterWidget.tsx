import { useEffect, useMemo, useRef, useState } from 'react';
import { Descriptions, characters } from '../../data/characters';
import type { GameId } from '../../convex/aiTown/ids';
import type { ServerGame } from '../hooks/serverGame';
import type { Agent } from '../../convex/aiTown/agent';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

type CharacterKind = 'agent' | 'player' | 'other';

type RosterEntry = {
  key: string;
  name: string;
  characterName?: string;
  kind: CharacterKind;
  companionOfUser?: string; // User nickname this companion belongs to
};

type CharacterProfile = {
  name: string;
  character: string;
  identity: string;
  plan: string;
};

function isCharacterProfile(value: (typeof Descriptions)[number]): value is CharacterProfile {
  return typeof value === 'object' && value !== null && 'character' in value;
}

function RosterAvatar({ characterName }: { characterName?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const character = characterName ? characters.find((c) => c.name === characterName) : undefined;

    if (!character) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const frame = character.spritesheetData?.frames?.down?.frame;

      if (frame) {
        const { x, y, w, h } = frame;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, x, y, w, h, 0, 0, canvas.width, canvas.height);
        return;
      }

      const fallbackPositions: Record<string, { x: number; y: number }> = {
        f1: { x: 0, y: 0 },
        f2: { x: 32, y: 0 },
        f3: { x: 64, y: 0 },
        f4: { x: 96, y: 0 },
        f5: { x: 128, y: 0 },
        f6: { x: 160, y: 0 },
        f7: { x: 192, y: 0 },
        f8: { x: 224, y: 0 },
      };

      const pos = fallbackPositions[character.name] || fallbackPositions.f1;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, pos.x, pos.y, 32, 32, 0, 0, canvas.width, canvas.height);
    };

    img.onerror = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    img.src = character.textureUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [characterName]);

  return (
    <canvas
      ref={canvasRef}
      width={48}
      height={48}
      className="w-12 h-12"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

const typePriority: Record<CharacterKind, number> = {
  player: 0,
  agent: 1,
  other: 2,
};

export default function MapRosterWidget({ game, worldId }: { game: ServerGame; worldId?: Id<'worlds'> }) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Get current user ID from localStorage
  const currentUserId = localStorage.getItem('userId');

  // Get user profile information
  const userProfile = useQuery(
    api.users.getFullUserProfile,
    currentUserId ? { userId: currentUserId as any } : 'skip',
  );

  // Get all user profiles to show real nicknames for all human players
  const allPlayerDescriptions = [...game.playerDescriptions.values()];
  const userIds = allPlayerDescriptions
    .map(pd => pd.userId)
    .filter((uid): uid is Id<'users'> => uid !== undefined);

  const userProfiles = useQuery(
    api.users.listByIds,
    userIds.length > 0 ? { userIds } : 'skip',
  ) || {};
  const entries: RosterEntry[] = useMemo(() => {
    const list: RosterEntry[] = [];
    const agentByPlayerId = new Map<GameId<'players'>, Agent>();

    for (const agent of game.world.agents.values()) {
      agentByPlayerId.set(agent.playerId, agent);
    }

    for (const player of game.world.players.values()) {
      const agent = agentByPlayerId.get(player.id);
      const playerDescription = game.playerDescriptions.get(player.id);
      const agentDescription = agent ? game.agentDescriptions.get(agent.id) : undefined;
      const characterName = playerDescription?.character;
      const staticDescription = characterName
        ? Descriptions.find(
            (d): d is CharacterProfile => isCharacterProfile(d) && d.character === characterName,
          )
        : undefined;

      let name: string;
      let companionOfUser: string | undefined;
      const kind: CharacterKind = agent ? 'agent' : player.human ? 'player' : 'other';

      // Check if this agent is a companion of a user
      if (agent && agentDescription?.companionOfUserId) {
        const companionUserId = agentDescription.companionOfUserId;
        const companionUserProfile = userProfiles[companionUserId];
        if (companionUserProfile?.nickname) {
          companionOfUser = companionUserProfile.nickname;
        }
      }

      // For human players, try to show user nickname instead of character name
      if (player.human && playerDescription?.userId) {
        const playerUserId = playerDescription.userId as string;
        const playerUserProfile = userProfiles[playerUserId];

        // Show the user's real nickname if available
        if (playerUserProfile?.nickname) {
          name = playerUserProfile.nickname;
        } else if (playerUserId === currentUserId && userProfile?.nickname) {
          name = userProfile.nickname;
        } else {
          // For other players, try to get their profile or fall back to character name
          name =
            staticDescription?.name ?? playerDescription?.name ?? `Player ${player.id.slice(-4)}`;
        }
      } else {
        name =
          staticDescription?.name ??
          playerDescription?.name ??
          (agent ? `Agent ${agent.id}` : `Player ${player.id.slice(-4)}`);
      }

      list.push({
        key: agent ? `agent-${agent.id}` : `player-${player.id}`,
        name,
        characterName,
        kind,
        companionOfUser,
      });
    }

    list.sort((a, b) => {
      const kindDelta = typePriority[a.kind] - typePriority[b.kind];
      if (kindDelta !== 0) {
        return kindDelta;
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    return list;
  }, [game, userProfiles, userProfile, currentUserId]);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute left-4 top-4 z-30">
      <div className="pointer-events-auto flex w-64 max-w-[18rem] flex-col gap-2 rounded-xl border border-white/10 bg-black/60 p-3 text-white shadow-lg backdrop-blur">
        {/* Room ID Display */}
        {worldId && (
          <div className="border-b border-white/10 pb-2 mb-1">
            <div className="text-[10px] uppercase tracking-wider text-white/50 mb-1">Room ID</div>
            <div className="text-xs font-mono text-green-400 break-all">
              {worldId.slice(-12)}
            </div>
          </div>
        )}

        <div
          className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-white/70 cursor-pointer hover:text-white/90 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <span>Characters on the Map · {entries.length}</span>
          <span className="text-lg">{isCollapsed ? '▶' : '▼'}</span>
        </div>
        {!isCollapsed && (
          <div className="flex flex-wrap gap-2 animate-in slide-in-from-top-1 duration-200">
            {entries.map(({ key, name, characterName, kind, companionOfUser }) => (
              <div
                key={key}
                className="flex min-w-[8.5rem] flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-2 py-1"
              >
                <div className="h-12 w-12 overflow-hidden rounded-full border border-white/20 bg-black/30">
                  <RosterAvatar characterName={characterName} />
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold">{name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-white/60">
                    {kind === 'agent' ? 'Agent' : kind === 'player' ? 'Player' : 'Resident'}
                    {companionOfUser && ` · ${companionOfUser}'s`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
