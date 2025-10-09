import * as PIXI from 'pixi.js';
import { useApp } from '@pixi/react';
import { Player, SelectElement } from './Player.tsx';
import { useEffect, useRef, useState } from 'react';
import { PixiStaticMap } from './PixiStaticMap.tsx';
import PixiViewport from './PixiViewport.tsx';
import { Viewport } from 'pixi-viewport';
import { Id } from '../../convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api.js';
import { useSendInput } from '../hooks/sendInput.ts';
import { toastOnError } from '../toasts.ts';
import { DebugPath } from './DebugPath.tsx';
import { PositionIndicator } from './PositionIndicator.tsx';
import { SHOW_DEBUG_UI } from './Game.tsx';
import { ServerGame } from '../hooks/serverGame.ts';
import SyntheticAvatarSprite from './SyntheticAvatarSprite';

export const PixiGame = (props: {
  worldId: Id<'worlds'>;
  engineId: Id<'engines'>;
  game: ServerGame;
  historicalTime: number | undefined;
  width: number;
  height: number;
  setSelectedElement: SelectElement;
  movementLocked?: boolean;
  visiblePlayerIds?: string[];
  focusPosition?: { x: number; y: number } | null;
  syntheticPlayers?: Array<{
    id: string;
    character: string;
    position: { x: number; y: number };
    isAgent: boolean;
  }>;
}) => {
  // PIXI setup.
  const pixiApp = useApp();
  const viewportRef = useRef<Viewport | undefined>();

  const userId = localStorage.getItem('userId');
  const humanTokenIdentifier = useQuery(
    api.world.userStatus,
    props.worldId ? { worldId: props.worldId, userId: userId || undefined } : 'skip'
  ) ?? null;
  const humanPlayerId = [...props.game.world.players.values()].find(
    (p) => p.human === humanTokenIdentifier,
  )?.id;
  const visibleSet = props.visiblePlayerIds ? new Set(props.visiblePlayerIds) : null;
  if (visibleSet && humanPlayerId) {
    visibleSet.add(humanPlayerId);
  }
  const syntheticPlayers = props.syntheticPlayers ?? [];

  const moveTo = useSendInput(props.engineId, 'moveTo');

  // Interaction for clicking on the world to navigate.
  const dragStart = useRef<{ screenX: number; screenY: number } | null>(null);
  const onMapPointerDown = (e: any) => {
    // https://pixijs.download/dev/docs/PIXI.FederatedPointerEvent.html
    dragStart.current = { screenX: e.screenX, screenY: e.screenY };
  };

  const [lastDestination, setLastDestination] = useState<{
    x: number;
    y: number;
    t: number;
  } | null>(null);
  const onMapPointerUp = async (e: any) => {
    if (dragStart.current) {
      const { screenX, screenY } = dragStart.current;
      dragStart.current = null;
      const [dx, dy] = [screenX - e.screenX, screenY - e.screenY];
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 10) {
        console.log(`Skipping navigation on drag event (${dist}px)`);
        return;
      }
    }
    if (!humanPlayerId) {
      return;
    }
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    if (props.movementLocked) {
      return;
    }
    const gameSpacePx = viewport.toWorld(e.screenX, e.screenY);
    const tileDim = props.game.worldMap.tileDim;
    const gameSpaceTiles = {
      x: gameSpacePx.x / tileDim,
      y: gameSpacePx.y / tileDim,
    };
    setLastDestination({ t: Date.now(), ...gameSpaceTiles });
    const roundedTiles = {
      x: Math.floor(gameSpaceTiles.x),
      y: Math.floor(gameSpaceTiles.y),
    };
    console.log(`Moving to ${JSON.stringify(roundedTiles)}`);
    await toastOnError(moveTo({ playerId: humanPlayerId, destination: roundedTiles }));
  };
  const { width, height, tileDim } = props.game.worldMap;
  let players = [...props.game.world.players.values()];
  if (visibleSet) {
    players = players.filter((p) => visibleSet.has(p.id));
  }

  // Zoom on the user’s avatar when it is created
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    if (props.focusPosition) {
      const target = new PIXI.Point(
        (props.focusPosition.x + 0.5) * tileDim,
        (props.focusPosition.y + 0.5) * tileDim,
      );
      viewport.animate({ position: target, scale: 1.5, time: 250 });
      return;
    }

    if (humanPlayerId !== undefined) {
      const humanPlayer = props.game.world.players.get(humanPlayerId);
      if (humanPlayer) {
        viewport.animate({
          position: new PIXI.Point(
            (humanPlayer.position.x + 0.5) * tileDim,
            (humanPlayer.position.y + 0.5) * tileDim,
          ),
          scale: 0.8,
          time: 250,
        });
      }
    }
  }, [props.focusPosition, humanPlayerId, tileDim]);

  return (
    <PixiViewport
      app={pixiApp}
      screenWidth={props.width}
      screenHeight={props.height}
      worldWidth={width * tileDim}
      worldHeight={height * tileDim}
      viewportRef={viewportRef}
    >
      <PixiStaticMap
        map={props.game.worldMap}
        onpointerup={onMapPointerUp}
        onpointerdown={onMapPointerDown}
      />
      {players.map(
        (p) =>
          // Only show the path for the human player in non-debug mode.
          (SHOW_DEBUG_UI || p.id === humanPlayerId) && (
            <DebugPath key={`path-${p.id}`} player={p} tileDim={tileDim} />
          ),
      )}
      {lastDestination && <PositionIndicator destination={lastDestination} tileDim={tileDim} />}
      {players.map((p) => (
        <Player
          key={`player-${p.id}`}
          game={props.game}
          player={p}
          isViewer={p.id === humanPlayerId}
          onClick={props.setSelectedElement}
          historicalTime={props.historicalTime}
        />
      ))}
      {syntheticPlayers.map((synthetic) => (
        <SyntheticAvatarSprite
          key={`synthetic-${synthetic.id}`}
          character={synthetic.character}
          position={synthetic.position}
          tileDim={tileDim}
          faceLeft={synthetic.isAgent}
        />
      ))}
    </PixiViewport>
  );
};
export default PixiGame;
